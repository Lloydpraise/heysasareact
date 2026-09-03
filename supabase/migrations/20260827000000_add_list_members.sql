create table if not exists public.list_members (
  list_id uuid not null references public.lists(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, contact_id)
);

alter table public.list_members enable row level security;

drop policy if exists "Users can manage list members" on public.list_members;

create policy "Users can manage list members"
on public.list_members
for all
using (
  exists (
    select 1 from public.lists
    join public.businesses on businesses.business_id = lists.business_id
    where lists.id = list_members.list_id and businesses.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.lists
    join public.businesses on businesses.business_id = lists.business_id
    where lists.id = list_members.list_id and businesses.user_id = auth.uid()
  )
);