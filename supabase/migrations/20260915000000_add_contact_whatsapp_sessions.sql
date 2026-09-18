create table if not exists public.contact_whatsapp_sessions (
  contact_id bigint not null references public.contacts(id) on delete cascade,
  whatsapp_session_id uuid not null references public.whatsapp_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, whatsapp_session_id)
);

create index if not exists contact_whatsapp_sessions_session_idx
on public.contact_whatsapp_sessions (whatsapp_session_id);

alter table public.contact_whatsapp_sessions enable row level security;

drop policy if exists "Users can view contact WhatsApp sessions" on public.contact_whatsapp_sessions;
create policy "Users can view contact WhatsApp sessions"
on public.contact_whatsapp_sessions
for select
using (
  exists (
    select 1
    from public.contacts
    join public.businesses on businesses.business_id = contacts.business_id
    where contacts.id = contact_whatsapp_sessions.contact_id
      and businesses.user_id = auth.uid()
  )
);

drop policy if exists "Users can create contact WhatsApp sessions" on public.contact_whatsapp_sessions;
create policy "Users can create contact WhatsApp sessions"
on public.contact_whatsapp_sessions
for insert
with check (
  exists (
    select 1
    from public.contacts
    join public.businesses on businesses.business_id = contacts.business_id
    where contacts.id = contact_whatsapp_sessions.contact_id
      and businesses.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.whatsapp_sessions
    join public.businesses on businesses.business_id = whatsapp_sessions.business_id
    where whatsapp_sessions.id = contact_whatsapp_sessions.whatsapp_session_id
      and businesses.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete contact WhatsApp sessions" on public.contact_whatsapp_sessions;
create policy "Users can delete contact WhatsApp sessions"
on public.contact_whatsapp_sessions
for delete
using (
  exists (
    select 1
    from public.contacts
    join public.businesses on businesses.business_id = contacts.business_id
    where contacts.id = contact_whatsapp_sessions.contact_id
      and businesses.user_id = auth.uid()
  )
);