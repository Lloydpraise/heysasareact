create or replace view public.v_campaign_step_summary as
 select cst.id as step_id,
    cst.campaign_id,
    cst.step_number,
    cst.content,
    cst.delay_hours,
    cst.condition,
   count(distinct cse.id) filter (where cse.sent_at is not null and cse.message_id is not null) as sent_count,
    count(distinct cse.id) filter (where cse.replied_at is not null) as replied_count,
    count(distinct cse.id) filter (where cse.opted_out_at is not null) as opt_outs,
    cst.media
   from public.campaign_steps cst
   left join public.campaign_step_events cse on cse.step_id = cst.id
  group by cst.id;

create or replace view public.v_campaign_summary as
 select c.id as campaign_id,
    c.business_id,
    c.name,
    c.status,
    c.list_id,
    li.name as list_name,
    c.sequence_mode,
    c.gateway_type,
    c.daily_cap,
    coalesce(dsc.sent_today, 0) as sent_today,
    count(distinct ce.id) filter (where ce.status = any (array['pending'::text, 'active'::text])) as enrolled_count,
   count(distinct cse.id) filter (where cse.sent_at is not null and cse.message_id is not null) as sent_count,
    count(distinct cse.id) filter (where cse.replied_at is not null) as replies_count,
   round((100.0 * count(distinct cse.id) filter (where cse.replied_at is not null))::numeric / nullif(count(distinct cse.id) filter (where cse.sent_at is not null and cse.message_id is not null), 0)::numeric, 1) as response_rate,
    coalesce(sum(conv.deal_value) filter (where conv.converted_at >= c.created_at), 0::numeric) as realized_revenue,
    c.ai_rewrite_enabled,
    c.auto_approve,
    c.whatsapp_instances
   from public.campaigns c
   join public.lists li on li.id = c.list_id
   left join public.campaign_enrollments ce on ce.campaign_id = c.id
   left join public.campaign_step_events cse on cse.enrollment_id = ce.id
   left join public.conversions conv on conv.contact_id = ce.lead_id
   left join public.daily_send_counters dsc on dsc.business_id = c.business_id and dsc.send_date = current_date
  group by c.id, li.name, dsc.sent_today;