drop policy if exists "Enable UPDATE for authenticated users on campaigns" on public.campaigns;

create policy "Enable UPDATE for authenticated users on campaigns"
on public.campaigns
for update
to authenticated
using (true)
with check (true);
