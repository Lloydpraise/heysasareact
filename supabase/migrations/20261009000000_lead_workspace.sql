-- Lead workspace: calls, tasks/reminders, meetings (with a reminder sequence), and a per-lead activity timeline.
-- Additive only. Nothing existing is altered. Safe to run more than once.
--
-- Access rule everywhere: a row is visible/writable only for businesses the signed-in user owns
-- (public.my_business_ids(), the same helper v_lead_summary uses).

-- ── Activity timeline ─────────────────────────────────────────────────────────
-- One row per thing that happened to a lead that the app itself did or the user did
-- (calls, tasks, meetings, notes, bought...). "Came in", "analysed", follow-ups sent, campaign steps and
-- chat-AI turns are NOT written here: the app reads those straight from where they already live.
create table if not exists public.lead_timeline (
  id           uuid primary key default gen_random_uuid(),
  business_id  text   not null,
  contact_id   bigint not null references public.contacts(id) on delete cascade,
  event_type   text   not null,
  summary      text,
  detail       jsonb  not null default '{}'::jsonb,
  actor        text   not null default 'user',
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists lead_timeline_contact_idx on public.lead_timeline (contact_id, occurred_at desc);
create index if not exists lead_timeline_business_idx on public.lead_timeline (business_id, occurred_at desc);

-- ── Calls ─────────────────────────────────────────────────────────────────────
create table if not exists public.lead_calls (
  id               uuid primary key default gen_random_uuid(),
  business_id      text   not null,
  contact_id       bigint not null references public.contacts(id) on delete cascade,
  outcome          text   not null,
  notes            text,
  duration_minutes integer,
  next_steps       text[] not null default '{}',
  called_by        uuid default auth.uid(),
  called_at        timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index if not exists lead_calls_contact_idx on public.lead_calls (contact_id, called_at desc);
create index if not exists lead_calls_business_idx on public.lead_calls (business_id, called_at desc);

-- ── Tasks and reminders ───────────────────────────────────────────────────────
create table if not exists public.lead_tasks (
  id           uuid primary key default gen_random_uuid(),
  business_id  text   not null,
  contact_id   bigint not null references public.contacts(id) on delete cascade,
  kind         text   not null default 'task' check (kind in ('task', 'reminder')),
  title        text   not null,
  notes        text,
  due_at       timestamptz,
  status       text   not null default 'open' check (status in ('open', 'done', 'cancelled')),
  source       text   not null default 'manual',
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists lead_tasks_contact_idx on public.lead_tasks (contact_id, status, due_at);
create index if not exists lead_tasks_business_idx on public.lead_tasks (business_id, status, due_at);

-- ── Meetings and their reminder sequence ──────────────────────────────────────
create table if not exists public.lead_meetings (
  id           uuid primary key default gen_random_uuid(),
  business_id  text   not null,
  contact_id   bigint not null references public.contacts(id) on delete cascade,
  title        text   not null,
  kind         text   not null default 'call' check (kind in ('call', 'video', 'in_person')),
  starts_at    timestamptz not null,
  duration_minutes integer not null default 30,
  location     text,
  notes        text,
  status       text   not null default 'scheduled' check (status in ('scheduled', 'attended', 'no_show', 'cancelled')),
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  outcome_at   timestamptz
);
create index if not exists lead_meetings_contact_idx on public.lead_meetings (contact_id, starts_at desc);
create index if not exists lead_meetings_business_idx on public.lead_meetings (business_id, starts_at);

-- One row per WhatsApp reminder. The backend sender (meetingReminders.js) sends the due ones.
--   key: 'day_before' | 'two_hours' | 'thirty_min' | 'no_show'
--   'no_show' is created as 'held' and only released when the owner marks the meeting a no-show,
--   so nobody who attended ever gets a "we missed you" message.
create table if not exists public.lead_meeting_reminders (
  id           uuid primary key default gen_random_uuid(),
  business_id  text   not null,
  contact_id   bigint not null references public.contacts(id) on delete cascade,
  meeting_id   uuid   not null references public.lead_meetings(id) on delete cascade,
  key          text   not null,
  message      text   not null,
  send_at      timestamptz not null,
  status       text   not null default 'queued' check (status in ('queued', 'held', 'sending', 'sent', 'failed', 'cancelled')),
  error        text,
  attempts     integer not null default 0,
  claimed_at   timestamptz,
  sent_at      timestamptz,
  whatsapp_message_id text,
  created_at   timestamptz not null default now()
);
create index if not exists lead_meeting_reminders_due_idx on public.lead_meeting_reminders (status, send_at);
create index if not exists lead_meeting_reminders_meeting_idx on public.lead_meeting_reminders (meeting_id);

-- ── Row level security ────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['lead_timeline', 'lead_calls', 'lead_tasks', 'lead_meetings', 'lead_meeting_reminders']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (business_id in (select public.my_business_ids())) with check (business_id in (select public.my_business_ids()))',
      t || '_owner_all', t);
  end loop;
end $$;

-- ── Schedule a meeting + its reminder sequence in one go ──────────────────────
-- p_reminders: [{ "key": "day_before", "offset_minutes": -1440, "message": "..." }, ...]
-- A reminder whose send time is already past is dropped. A key of 'no_show' is stored 'held'
-- (offset is from the meeting END; it is released by mark_lead_meeting()).
create or replace function public.schedule_lead_meeting(
  p_business_id text,
  p_contact_id bigint,
  p_title text,
  p_starts_at timestamptz,
  p_duration_minutes integer,
  p_kind text,
  p_location text,
  p_notes text,
  p_reminders jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meeting uuid;
  v_ends timestamptz;
  r jsonb;
  v_key text;
  v_send timestamptz;
  v_created integer := 0;
begin
  if p_business_id not in (select my_business_ids()) then raise exception 'not allowed'; end if;
  if not exists (select 1 from contacts where id = p_contact_id and business_id = p_business_id) then
    raise exception 'lead not found for this business';
  end if;
  if p_starts_at is null then raise exception 'meeting time is required'; end if;

  v_ends := p_starts_at + make_interval(mins => greatest(coalesce(p_duration_minutes, 30), 5));

  insert into lead_meetings (business_id, contact_id, title, kind, starts_at, duration_minutes, location, notes)
  values (p_business_id, p_contact_id, coalesce(nullif(trim(p_title), ''), 'Meeting'), coalesce(p_kind, 'call'),
          p_starts_at, greatest(coalesce(p_duration_minutes, 30), 5), nullif(trim(p_location), ''), nullif(trim(p_notes), ''))
  returning id into v_meeting;

  for r in select * from jsonb_array_elements(coalesce(p_reminders, '[]'::jsonb))
  loop
    v_key := coalesce(r->>'key', 'reminder');
    if nullif(trim(r->>'message'), '') is null then continue; end if;
    if v_key = 'no_show' then
      v_send := v_ends + make_interval(mins => coalesce((r->>'offset_minutes')::int, 15));
      insert into lead_meeting_reminders (business_id, contact_id, meeting_id, key, message, send_at, status)
      values (p_business_id, p_contact_id, v_meeting, v_key, trim(r->>'message'), v_send, 'held');
      v_created := v_created + 1;
    else
      v_send := p_starts_at + make_interval(mins => coalesce((r->>'offset_minutes')::int, -60));
      if v_send > now() + interval '1 minute' then
        insert into lead_meeting_reminders (business_id, contact_id, meeting_id, key, message, send_at, status)
        values (p_business_id, p_contact_id, v_meeting, v_key, trim(r->>'message'), v_send, 'queued');
        v_created := v_created + 1;
      end if;
    end if;
  end loop;

  insert into lead_timeline (business_id, contact_id, event_type, summary, detail)
  values (p_business_id, p_contact_id, 'meeting_scheduled',
          'Meeting scheduled: ' || coalesce(nullif(trim(p_title), ''), 'Meeting'),
          jsonb_build_object('meeting_id', v_meeting, 'starts_at', p_starts_at, 'kind', p_kind, 'reminders', v_created));

  return v_meeting;
end $$;

-- ── Attended / no-show / cancelled ────────────────────────────────────────────
create or replace function public.mark_lead_meeting(p_meeting_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare m lead_meetings%rowtype;
begin
  if p_status not in ('attended', 'no_show', 'cancelled') then raise exception 'invalid status'; end if;
  select * into m from lead_meetings where id = p_meeting_id;
  if not found then raise exception 'meeting not found'; end if;
  if m.business_id not in (select my_business_ids()) then raise exception 'not allowed'; end if;

  update lead_meetings set status = p_status, outcome_at = now() where id = p_meeting_id;

  if p_status = 'no_show' then
    -- release the held "we missed you" message, to go out now; stop any reminders still waiting
    update lead_meeting_reminders set status = 'cancelled' where meeting_id = p_meeting_id and status = 'queued';
    update lead_meeting_reminders set status = 'queued', send_at = now() where meeting_id = p_meeting_id and key = 'no_show' and status = 'held';
  else
    update lead_meeting_reminders set status = 'cancelled' where meeting_id = p_meeting_id and status in ('queued', 'held');
  end if;

  insert into lead_timeline (business_id, contact_id, event_type, summary, detail)
  values (m.business_id, m.contact_id, 'meeting_' || p_status,
          case p_status when 'attended' then 'Meeting attended' when 'no_show' then 'Meeting no-show' else 'Meeting cancelled' end || ': ' || m.title,
          jsonb_build_object('meeting_id', p_meeting_id));
end $$;

grant execute on function public.schedule_lead_meeting(text, bigint, text, timestamptz, integer, text, text, text, jsonb) to authenticated;
grant execute on function public.mark_lead_meeting(uuid, text) to authenticated;
