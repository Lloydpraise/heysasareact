alter table public.contacts enable row level security;

drop policy if exists "Users can create contacts" on public.contacts;

create policy "Users can create contacts"
on public.contacts
for insert
with check (
	exists (
		select 1
		from public.businesses
		where businesses.business_id = contacts.business_id
			and businesses.user_id = auth.uid()
	)
);
