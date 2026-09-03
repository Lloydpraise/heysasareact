alter table public.conversations enable row level security;

drop policy if exists "Users can create conversations" on public.conversations;

create policy "Users can create conversations"
on public.conversations
for insert
with check (
	exists (
		select 1
		from public.businesses
		where businesses.business_id = conversations.business_id
			and businesses.user_id = auth.uid()
	)
);