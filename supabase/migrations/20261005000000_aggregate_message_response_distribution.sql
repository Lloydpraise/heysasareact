CREATE INDEX IF NOT EXISTS messages_business_direction_contact_created_idx
  ON public.messages (business_id, direction, contact_id, created_at);

CREATE INDEX IF NOT EXISTS messages_delivery_failures_business_idx
  ON public.messages (business_id)
  WHERE direction = 'out' AND status = 'ERROR';

CREATE OR REPLACE FUNCTION public.get_message_response_distribution(p_business_id uuid)
RETURNS TABLE(bucket text, count bigint, avg_reply_time_min numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH first_outbound AS (
    SELECT contact_id, MIN(created_at) AS sent_at
    FROM public.messages
    WHERE business_id = p_business_id
      AND direction = 'out'
    GROUP BY contact_id
  ),
  reply_times AS (
    SELECT EXTRACT(EPOCH FROM (MIN(inbound.created_at) - first_outbound.sent_at)) / 60 AS minutes
    FROM first_outbound
    JOIN public.messages AS inbound
      ON inbound.business_id = p_business_id
      AND inbound.contact_id = first_outbound.contact_id
      AND inbound.direction = 'in'
      AND inbound.created_at > first_outbound.sent_at
    GROUP BY first_outbound.contact_id, first_outbound.sent_at
  ),
  stats AS (
    SELECT ROUND(AVG(minutes)) AS average_minutes
    FROM reply_times
  ),
  buckets (position, label, lower_bound, upper_bound) AS (
    VALUES
      (1, '< 2 min', NULL::numeric, 2::numeric),
      (2, '2–10 min', 2::numeric, 10::numeric),
      (3, '10–30 min', 10::numeric, 30::numeric),
      (4, '30–60 min', 30::numeric, 60::numeric),
      (5, '1–6 hrs', 60::numeric, 360::numeric),
      (6, '6+ hrs', 360::numeric, NULL::numeric)
  )
  SELECT
    buckets.label,
    COUNT(reply_times.minutes)::bigint,
    stats.average_minutes
  FROM buckets
  CROSS JOIN stats
  LEFT JOIN reply_times
    ON (buckets.lower_bound IS NULL OR reply_times.minutes >= buckets.lower_bound)
    AND (buckets.upper_bound IS NULL OR reply_times.minutes < buckets.upper_bound)
  GROUP BY buckets.position, buckets.label, stats.average_minutes
  ORDER BY buckets.position;
$$;

REVOKE ALL ON FUNCTION public.get_message_response_distribution(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_message_response_distribution(uuid) TO authenticated;
