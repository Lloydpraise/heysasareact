do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'list_members'
      and column_name = 'contact_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'list_members'
      and column_name = 'lead_id'
  ) then
    alter table public.list_members rename column contact_id to lead_id;
  end if;
end
$$;