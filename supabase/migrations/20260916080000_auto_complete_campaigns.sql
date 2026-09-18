create or replace function public.complete_finished_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_campaign_id uuid;
  enrollment_count integer;
  open_enrollment_count integer;
begin
  target_campaign_id := case when tg_op = 'DELETE' then old.campaign_id else new.campaign_id end;

  select count(*), count(*) filter (where status in ('pending', 'active', 'awaiting_opt_in'))
    into enrollment_count, open_enrollment_count
    from public.campaign_enrollments
   where campaign_id = target_campaign_id;

  if enrollment_count > 0 and open_enrollment_count = 0 then
    update public.campaigns
       set status = 'completed'
     where id = target_campaign_id
       and status in ('active', 'paused');
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists complete_finished_campaign_on_enrollment on public.campaign_enrollments;
create constraint trigger complete_finished_campaign_on_enrollment
after insert or update of status or delete on public.campaign_enrollments
deferrable initially deferred
for each row execute function public.complete_finished_campaign();

update public.campaigns c
   set status = 'completed'
 where c.status in ('active', 'paused')
   and exists (select 1 from public.campaign_enrollments ce where ce.campaign_id = c.id)
   and not exists (
     select 1
       from public.campaign_enrollments ce
      where ce.campaign_id = c.id
        and ce.status in ('pending', 'active', 'awaiting_opt_in')
   );
