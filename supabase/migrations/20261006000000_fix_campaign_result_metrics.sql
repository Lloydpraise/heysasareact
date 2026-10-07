-- Update the base view, keeping its existing column names and order.
create or replace view public.v_campaign_step_summary_base as
select
  cst.id as step_id,
  cst.campaign_id,
  cst.step_number,
  cst.content,
  cst.delay_hours,
  cst.condition,
  count(distinct cse.id) filter (
    where cse.sent_at is not null
      and cse.message_id is not null
  ) as sent_count,
  count(distinct cse.id) filter (
    where cse.replied_at is not null
      and cse.sent_at is not null
      and cse.message_id is not null
  ) as replied_count,
  count(distinct cse.id) filter (
    where cse.opted_out_at is not null
  ) as opt_outs,
  cst.media,
  count(distinct cse.id) filter (
    where feedback.reacted_at is not null
  ) as reacted_count,
  count(distinct cse.id) filter (
    where feedback.reply_intent = 'positive'
  ) as positive_count,
  count(distinct cse.id) filter (
    where feedback.reply_intent = 'negative'
  ) as negative_count,
  count(distinct cse.id) filter (
    where feedback.reply_intent = 'action'
  ) as action_count
from public.campaign_steps cst
left join public.campaign_step_events cse
  on cse.step_id = cst.id
left join public.v_campaign_message_feedback feedback
  on feedback.step_event_id = cse.id
group by cst.id;


-- Deduplicate conversions before summing, so multiple enrollments
-- for the same lead don't count the same conversion more than once.
create or replace view public.v_campaign_summary_base as
with campaign_revenue_rows as (
  select distinct
    ce.campaign_id,
    conv.id as conversion_id,
    conv.deal_value
  from public.campaign_enrollments ce
  join public.campaigns c
    on c.id = ce.campaign_id
  join public.conversions conv
    on conv.contact_id = ce.lead_id
   and conv.converted_at >= c.created_at
),
campaign_revenue as (
  select
    campaign_id,
    sum(deal_value) as realized_revenue
  from campaign_revenue_rows
  group by campaign_id
)
select
  c.id as campaign_id,
  c.business_id,
  c.name,
  c.status,
  c.list_id,
  li.name as list_name,
  c.sequence_mode,
  c.gateway_type,
  c.daily_cap,
  coalesce(dsc.sent_today, 0) as sent_today,
  count(distinct ce.id) as enrolled_count,
  count(distinct cse.id) filter (
    where cse.sent_at is not null
      and cse.message_id is not null
  ) as sent_count,
  count(distinct cse.id) filter (
    where cse.replied_at is not null
      and cse.sent_at is not null
      and cse.message_id is not null
  ) as replies_count,
  round(
    100.0 * count(distinct cse.id) filter (
      where cse.replied_at is not null
        and cse.sent_at is not null
        and cse.message_id is not null
    ) / nullif(
      count(distinct cse.id) filter (
        where cse.sent_at is not null
          and cse.message_id is not null
      ),
      0
    ),
    1
  ) as response_rate,
  coalesce(cr.realized_revenue, 0::numeric) as realized_revenue,
  c.ai_rewrite_enabled,
  c.auto_approve,
  c.whatsapp_instances,
  count(distinct cse.enrollment_id) filter (
    where cse.sent_at is not null
      and cse.message_id is not null
  ) as reached_count
from public.campaigns c
join public.lists li
  on li.id = c.list_id
left join public.campaign_enrollments ce
  on ce.campaign_id = c.id
left join public.campaign_step_events cse
  on cse.enrollment_id = ce.id
left join campaign_revenue cr
  on cr.campaign_id = c.id
left join public.daily_send_counters dsc
  on dsc.business_id = c.business_id
 and dsc.send_date = current_date
group by
  c.id,
  li.name,
  dsc.sent_today,
  cr.realized_revenue;


-- Preserve the public view's business-access filter and expose the new
-- reached_count column at the end.
create or replace view public.v_campaign_summary
with (security_invoker = false) as
select
  campaign_id,
  business_id,
  name,
  status,
  list_id,
  list_name,
  sequence_mode,
  gateway_type,
  daily_cap,
  sent_today,
  enrolled_count,
  sent_count,
  replies_count,
  response_rate,
  realized_revenue,
  ai_rewrite_enabled,
  auto_approve,
  whatsapp_instances,
  reached_count
from public.v_campaign_summary_base
where (select auth.role()) = 'service_role'
   or business_id in (
     select public.my_business_ids()
   );
