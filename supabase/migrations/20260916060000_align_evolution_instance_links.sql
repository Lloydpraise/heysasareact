alter table public.whatsapp_sessions
  add column if not exists evolution_instance_id text;

create index if not exists whatsapp_sessions_evolution_instance_id_idx
on public.whatsapp_sessions (evolution_instance_id);

update public.whatsapp_sessions
set evolution_instance_id = case instance_name
  when 'business_8e481ca1878d' then '8646b2ff-f248-4cfc-a282-cada94821b2a'
  when 'business_f3cf6a59c429' then '844a5447-91f4-4599-96cb-667fbeb135b9'
  else evolution_instance_id
end
where instance_name in ('business_8e481ca1878d', 'business_f3cf6a59c429');

insert into public.contact_whatsapp_sessions (contact_id, whatsapp_session_id)
select distinct m.contact_id, ws.id
from public.messages m
join public.whatsapp_sessions ws
  on ws.business_id = m.business_id
 and ws.evolution_instance_id = m.raw_payload->>'instanceId'
where m.contact_id is not null
on conflict (contact_id, whatsapp_session_id) do nothing;

create or replace function public.link_message_to_whatsapp_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.contact_id is not null and new.raw_payload->>'instanceId' is not null then
    insert into public.contact_whatsapp_sessions (contact_id, whatsapp_session_id)
    select new.contact_id, ws.id
    from public.whatsapp_sessions ws
    where ws.business_id = new.business_id
      and ws.evolution_instance_id = new.raw_payload->>'instanceId'
    on conflict (contact_id, whatsapp_session_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists link_message_whatsapp_session on public.messages;
create trigger link_message_whatsapp_session
after insert or update of contact_id, raw_payload on public.messages
for each row
execute function public.link_message_to_whatsapp_session();