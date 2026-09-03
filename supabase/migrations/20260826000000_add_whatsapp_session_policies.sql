alter table public.whatsapp_sessions enable row level security;

create policy "Users can view their WhatsApp sessions"
on public.whatsapp_sessions
for select
using (
	exists (
		select 1
		from public.businesses
		where businesses.business_id = whatsapp_sessions.business_id
			and businesses.user_id = auth.uid()
	)
);

create policy "Users can update their WhatsApp sessions"
on public.whatsapp_sessions
for update
using (
	exists (
		select 1
		from public.businesses
		where businesses.business_id = whatsapp_sessions.business_id
			and businesses.user_id = auth.uid()
	)
)
with check (
	exists (
		select 1
		from public.businesses
		where businesses.business_id = whatsapp_sessions.business_id
			and businesses.user_id = auth.uid()
	)
);

create policy "Users can create their WhatsApp sessions"
on public.whatsapp_sessions
for insert
with check (
	exists (
		select 1
		from public.businesses
		where businesses.business_id = whatsapp_sessions.business_id
			and businesses.user_id = auth.uid()
	)
);

create policy "Users can delete their WhatsApp sessions"
on public.whatsapp_sessions
for delete
using (
	exists (
		select 1
		from public.businesses
		where businesses.business_id = whatsapp_sessions.business_id
			and businesses.user_id = auth.uid()
	)
);
