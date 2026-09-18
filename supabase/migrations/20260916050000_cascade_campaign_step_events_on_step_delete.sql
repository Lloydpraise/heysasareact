alter table public.campaign_step_events
  drop constraint if exists campaign_step_events_step_id_fkey;

alter table public.campaign_step_events
  add constraint campaign_step_events_step_id_fkey
  foreign key (step_id)
  references public.campaign_steps(id)
  on delete cascade;