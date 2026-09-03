create table if not exists public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  phone_number text,
  instance_name text,
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'pending')),
  history_loaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_sessions_business_fk
    foreign key (business_id)
    references public.businesses (business_id)
    on delete cascade
);

create index if not exists whatsapp_sessions_business_id_idx
on public.whatsapp_sessions (business_id);

create index if not exists whatsapp_sessions_instance_name_idx
on public.whatsapp_sessions (instance_name);

create trigger set_whatsapp_sessions_updated_at
before update on public.whatsapp_sessions
for each row
execute function public.update_updated_at_column();
