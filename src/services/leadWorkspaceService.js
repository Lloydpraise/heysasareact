import { supabase } from '../lib/supabase';
import { createManualList } from './listsCampaignsService';

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

// ── Outcomes, steps and reminder plans (one place, so the UI and the data always agree) ──────────────────

export const CALL_OUTCOMES = [
  { id: 'interested', label: 'Interested', tone: 'good', hint: 'Spoke to them, they want to move forward' },
  { id: 'needs_info', label: 'Needs more info', tone: 'default', hint: 'Answered, has questions to be answered' },
  { id: 'callback', label: 'Call back later', tone: 'default', hint: 'Busy now, asked for another time' },
  { id: 'not_now', label: 'Not now', tone: 'warn', hint: 'Spoke to them, timing is wrong' },
  { id: 'no_answer', label: 'No answer', tone: 'default', hint: 'Rang, nobody picked up' },
  { id: 'voicemail', label: 'Voicemail', tone: 'default', hint: 'Left a message' },
  { id: 'not_interested', label: 'Not interested', tone: 'bad', hint: 'Spoke to them, they said no' },
  { id: 'wrong_number', label: 'Wrong number', tone: 'bad', hint: 'Not the right person or number' },
];

export const CALL_OUTCOME_LABELS = Object.fromEntries(CALL_OUTCOMES.map((outcome) => [outcome.id, outcome.label]));

export const MEETING_REMINDER_PLAN = [
  { key: 'day_before', label: '1 day before', offsetMinutes: -1440, defaultOn: true },
  { key: 'two_hours', label: '2 hours before', offsetMinutes: -120, defaultOn: true },
  { key: 'thirty_min', label: '30 minutes before', offsetMinutes: -30, defaultOn: true },
  { key: 'no_show', label: 'No-show nudge (only sent if you mark them a no-show)', offsetMinutes: 15, defaultOn: true, afterEnd: true },
];

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
}

function bySortedDate(a, b) {
  return new Date(b.at) - new Date(a.at);
}

function clip(text, max = 140) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

// ── Reading everything about one lead ────────────────────────────────────────────────────────────────────

async function readMemberships(leadId) {
  const { data, error } = await supabase
    .from('list_members')
    .select('created_at, lists ( id, name, type, rule_id, archived )')
    .eq('lead_id', leadId);
  if (error) throw error;
  return (data || [])
    .map((row) => ({ addedAt: row.created_at, ...(row.lists || {}) }))
    .filter((list) => list.id && !list.archived)
    .map((list) => ({ id: list.id, name: list.name, type: list.type, ruleId: list.rule_id || null, addedAt: list.addedAt }));
}

async function readEnrollments(leadId) {
  const { data, error } = await supabase
    .from('campaign_enrollments')
    .select('id, campaign_id, status, current_step, next_send_at, enrolled_at')
    .eq('lead_id', leadId);
  if (error) throw error;
  return data || [];
}

async function readCampaigns(businessId, campaignIds, listIds) {
  if (!campaignIds.length && !listIds.length) return [];
  let query = supabase
    .from('v_campaign_summary')
    .select('campaign_id, name, status, list_id, list_name, sequence_mode')
    .eq('business_id', businessId);
  const filters = [];
  if (campaignIds.length) filters.push(`campaign_id.in.(${campaignIds.join(',')})`);
  if (listIds.length) filters.push(`list_id.in.(${listIds.join(',')})`);
  query = query.or(filters.join(','));
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function readStepCounts(campaignIds) {
  if (!campaignIds.length) return new Map();
  const { data, error } = await supabase
    .from('v_campaign_step_summary')
    .select('campaign_id, step_number')
    .in('campaign_id', campaignIds);
  if (error) throw error;
  const totals = new Map();
  (data || []).forEach((row) => totals.set(row.campaign_id, Math.max(totals.get(row.campaign_id) || 0, Number(row.step_number) || 0)));
  return totals;
}

async function readQueue(businessId, leadId) {
  const { data, error } = await supabase
    .from('follow_up_queue')
    .select('id, campaign_id, campaign_step, sequence_step, touchpoint_type, status, final_message, draft_message, processed_at, scheduled_at, skip_reason')
    .eq('business_id', businessId)
    .eq('contact_id', leadId)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw error;
  return data || [];
}

async function readStepEvents(enrollmentIds) {
  if (!enrollmentIds.length) return [];
  const { data, error } = await supabase
    .from('campaign_step_events')
    .select('id, enrollment_id, sent_at, replied_at, reacted_at, reaction_emoji, reply_intent, opted_out_at')
    .in('enrollment_id', enrollmentIds);
  if (error) throw error;
  return data || [];
}

async function readOwnTable(table, businessId, leadId, orderColumn, limit = 100) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('business_id', businessId)
    .eq('contact_id', leadId)
    .order(orderColumn, { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function readAiTurns(businessId, leadId) {
  const { data, error } = await supabase
    .from('chat_ai_turns')
    .select('id, status, reply, skip_reason, mode, created_at')
    .eq('business_id', businessId)
    .eq('contact_id', leadId)
    .eq('mode', 'live')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw error;
  return data || [];
}

async function readFirstInbound(leadId) {
  const { data, error } = await supabase
    .from('messages')
    .select('created_at, content')
    .eq('contact_id', leadId)
    .eq('direction', 'in')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function readReminders(meetingIds) {
  if (!meetingIds.length) return [];
  const { data, error } = await supabase
    .from('lead_meeting_reminders')
    .select('id, meeting_id, key, message, send_at, status, sent_at, error')
    .in('meeting_id', meetingIds);
  if (error) throw error;
  return data || [];
}

function firstText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content.text || content.caption || '';
}

// Everything the lead workspace shows, in one call. Each source is read on its own: if one fails (a table
// the signed-in user cannot read, a migration not run yet) the rest still show, and `problems` says what was missed.
export async function fetchLeadWorkspace(businessId, lead) {
  requireClient();
  if (!businessId || !lead?.id) throw new Error('A business and a lead are required.');
  const leadId = lead.id;
  const problems = [];
  const safe = async (label, run, fallback) => {
    try { return await run(); } catch (error) { problems.push({ source: label, message: error.message || String(error) }); return fallback; }
  };

  const [memberships, enrollments, queue, calls, tasks, meetings, timeline, aiTurns, firstInbound] = await Promise.all([
    safe('lists', () => readMemberships(leadId), []),
    safe('campaign enrolments', () => readEnrollments(leadId), []),
    safe('follow-ups', () => readQueue(businessId, leadId), []),
    safe('calls', () => readOwnTable('lead_calls', businessId, leadId, 'called_at'), []),
    safe('tasks', () => readOwnTable('lead_tasks', businessId, leadId, 'created_at'), []),
    safe('meetings', () => readOwnTable('lead_meetings', businessId, leadId, 'starts_at'), []),
    safe('activity', () => readOwnTable('lead_timeline', businessId, leadId, 'occurred_at', 200), []),
    safe('chat AI', () => readAiTurns(businessId, leadId), []),
    safe('first message', () => readFirstInbound(leadId), null),
  ]);

  const listIds = memberships.map((list) => list.id);
  const enrolledCampaignIds = [...new Set(enrollments.map((row) => row.campaign_id))];
  const [campaignRows, stepEvents, reminders] = await Promise.all([
    safe('campaigns', () => readCampaigns(businessId, enrolledCampaignIds, listIds), []),
    safe('campaign replies', () => readStepEvents(enrollments.map((row) => row.id)), []),
    safe('meeting reminders', () => readReminders(meetings.map((meeting) => meeting.id)), []),
  ]);
  const stepTotals = await safe('campaign steps', () => readStepCounts(campaignRows.map((row) => row.campaign_id)), new Map());

  const campaignById = new Map(campaignRows.map((row) => [row.campaign_id, row]));
  const enrollmentByCampaign = new Map(enrollments.map((row) => [row.campaign_id, row]));

  // Which follow-up is each list on, and which one is this lead actually in.
  const lists = memberships.map((list) => {
    const campaign = campaignRows.find((row) => row.list_id === list.id && row.status === 'active')
      || campaignRows.find((row) => row.list_id === list.id);
    const enrollment = campaign ? enrollmentByCampaign.get(campaign.campaign_id) : null;
    return {
      ...list,
      followup: campaign
        ? {
            campaignId: campaign.campaign_id,
            name: campaign.name,
            status: campaign.status,
            enrolled: Boolean(enrollment && ['pending', 'active'].includes(enrollment.status)),
          }
        : null,
    };
  });

  const followups = enrollments
    .filter((row) => campaignById.has(row.campaign_id))
    .map((row) => {
      const campaign = campaignById.get(row.campaign_id);
      return {
        enrollmentId: row.id,
        campaignId: row.campaign_id,
        name: campaign.name,
        campaignStatus: campaign.status,
        enrollmentStatus: row.status,
        currentStep: Number(row.current_step) || 0,
        totalSteps: stepTotals.get(row.campaign_id) || 0,
        nextSendAt: row.next_send_at,
        enrolledAt: row.enrolled_at,
        viaList: lists.find((list) => list.followup?.campaignId === row.campaign_id)?.name || null,
      };
    })
    .sort((a, b) => (a.enrollmentStatus === 'active' ? -1 : 1) - (b.enrollmentStatus === 'active' ? -1 : 1));

  // ── Build the activity timeline ──────────────────────────────────────────────────────────────────────
  const events = [];
  const push = (event) => { if (event.at) events.push(event); };

  const cameIn = lead.created_at || lead.added_date;
  push({
    id: 'came-in',
    type: 'came_in',
    at: cameIn,
    title: lead.is_ad_lead ? 'Came in from an ad' : 'Lead came in',
    detail: lead.is_ad_lead ? clip([lead.ad_platform, lead.ad_headline].filter(Boolean).join(' — ')) : '',
  });
  if (firstInbound) {
    push({ id: 'first-message', type: 'message', at: firstInbound.created_at, title: 'First message from them', detail: clip(firstText(firstInbound.content)) });
  }
  if (lead.nlp_enriched_at) {
    push({ id: 'analysed', type: 'analysed', at: lead.nlp_enriched_at, title: 'Analysed by HeySasa', detail: lead.intent_score != null ? `Intent score ${lead.intent_score}/100` : '' });
  }
  if (lead.purchase_date) {
    push({
      id: 'bought',
      type: 'bought',
      at: lead.purchase_date,
      title: 'Marked as bought',
      detail: [lead.product_sold, lead.deal_value != null ? `KES ${Number(lead.deal_value).toLocaleString()}` : ''].filter(Boolean).join(' — '),
    });
  }

  memberships.forEach((list) => push({
    id: `list-${list.id}`,
    type: 'list',
    at: list.addedAt,
    title: `Added to list: ${list.name}`,
    detail: list.type === 'auto' ? 'Automatic list' : 'Manual list',
  }));

  enrollments.forEach((row) => {
    const campaign = campaignById.get(row.campaign_id);
    push({ id: `enrol-${row.id}`, type: 'campaign', at: row.enrolled_at, title: `Put on campaign: ${campaign?.name || 'campaign'}`, detail: '' });
  });

  queue.filter((row) => ['sent', 'failed'].includes(row.status)).forEach((row) => {
    const campaign = row.campaign_id ? campaignById.get(row.campaign_id) : null;
    const step = row.campaign_step || row.sequence_step;
    const message = clip(row.final_message || row.draft_message);
    if (row.status === 'sent') {
      push({
        id: `queue-${row.id}`,
        type: 'followup',
        at: row.processed_at || row.scheduled_at,
        title: campaign ? `Follow-up sent · ${campaign.name}${step ? ` · step ${step}` : ''}` : 'Follow-up sent',
        detail: message,
      });
    } else {
      push({
        id: `queue-${row.id}`,
        type: 'followup_failed',
        at: row.processed_at || row.scheduled_at,
        title: 'Follow-up could not be sent',
        detail: row.skip_reason ? String(row.skip_reason).replace(/_/g, ' ') : message,
      });
    }
  });

  stepEvents.forEach((event) => {
    if (event.replied_at) push({ id: `reply-${event.id}`, type: 'reply', at: event.replied_at, title: 'Replied to a follow-up', detail: event.reply_intent ? String(event.reply_intent).replace(/_/g, ' ') : '' });
    if (event.reacted_at) push({ id: `react-${event.id}`, type: 'reply', at: event.reacted_at, title: `Reacted ${event.reaction_emoji || ''} to a follow-up`.trim(), detail: '' });
    if (event.opted_out_at) push({ id: `optout-${event.id}`, type: 'followup_failed', at: event.opted_out_at, title: 'Opted out of follow-ups', detail: '' });
  });

  aiTurns.filter((turn) => ['replied', 'handoff'].includes(turn.status)).forEach((turn) => push({
    id: `ai-${turn.id}`,
    type: 'ai',
    at: turn.created_at,
    title: turn.status === 'handoff' ? 'Chat AI handed over to you' : 'Chat AI replied',
    detail: clip(turn.reply),
  }));

  calls.forEach((call) => push({
    id: `call-${call.id}`,
    type: 'call',
    at: call.called_at,
    title: `Call · ${CALL_OUTCOME_LABELS[call.outcome] || call.outcome}`,
    detail: clip([call.notes, call.next_steps?.length ? `Next: ${call.next_steps.join(', ')}` : ''].filter(Boolean).join(' — '), 220),
  }));

  tasks.forEach((task) => push({
    id: `task-${task.id}`,
    type: task.kind === 'reminder' ? 'reminder' : 'task',
    at: task.created_at,
    title: `${task.kind === 'reminder' ? 'Reminder' : 'Task'} set: ${task.title}`,
    detail: task.due_at ? `Due ${new Date(task.due_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : '',
  }));

  // Everything the app wrote to the timeline itself. Calls, tasks and meetings already appear above from their own
  // tables, so only notes and the rest are added here.
  timeline
    .filter((row) => !['call_logged', 'task_created', 'reminder_set', 'meeting_scheduled'].includes(row.event_type))
    .forEach((row) => push({
      id: `tl-${row.id}`,
      type: row.event_type.startsWith('meeting') ? 'meeting' : row.event_type === 'note' ? 'note' : 'other',
      at: row.occurred_at,
      title: row.summary || row.event_type.replace(/_/g, ' '),
      detail: row.detail?.text ? clip(row.detail.text, 220) : '',
    }));

  meetings.forEach((meeting) => push({
    id: `meeting-${meeting.id}`,
    type: 'meeting',
    at: meeting.created_at,
    title: `Meeting booked: ${meeting.title}`,
    detail: `For ${new Date(meeting.starts_at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
  }));

  const remindersByMeeting = new Map();
  reminders.forEach((reminder) => {
    remindersByMeeting.set(reminder.meeting_id, [...(remindersByMeeting.get(reminder.meeting_id) || []), reminder]);
  });

  return {
    lists,
    followups,
    calls,
    tasks,
    meetings: meetings.map((meeting) => ({ ...meeting, reminders: (remindersByMeeting.get(meeting.id) || []).sort((a, b) => new Date(a.send_at) - new Date(b.send_at)) })),
    events: events.sort(bySortedDate),
    problems,
  };
}

// ── Writing ──────────────────────────────────────────────────────────────────────────────────────────────

export async function recordTimeline(businessId, leadId, eventType, summary, detail = {}) {
  requireClient();
  const { error } = await supabase
    .from('lead_timeline')
    .insert({ business_id: businessId, contact_id: leadId, event_type: eventType, summary, detail });
  if (error) throw error;
}

export async function logCall({ businessId, leadId, outcome, notes, durationMinutes, nextSteps = [] }) {
  requireClient();
  const { data, error } = await supabase
    .from('lead_calls')
    .insert({
      business_id: businessId,
      contact_id: leadId,
      outcome,
      notes: notes?.trim() || null,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      next_steps: nextSteps,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createTask({ businessId, leadId, kind = 'task', title, dueAt, notes, source = 'manual' }) {
  requireClient();
  if (!title?.trim()) throw new Error('Add a title.');
  const { data, error } = await supabase
    .from('lead_tasks')
    .insert({
      business_id: businessId,
      contact_id: leadId,
      kind,
      title: title.trim(),
      notes: notes?.trim() || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      source,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setTaskStatus(taskId, status) {
  requireClient();
  const { error } = await supabase
    .from('lead_tasks')
    .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
    .eq('id', taskId);
  if (error) throw error;
}

export async function addNote(businessId, leadId, text) {
  if (!text?.trim()) throw new Error('Write a note first.');
  await recordTimeline(businessId, leadId, 'note', 'Note added', { text: text.trim() });
}

// Adds one or many leads to an existing manual list, or to a brand new one when `newListName` is given.
export async function addLeadsToList({ businessId, leadIds, listId, newListName }) {
  requireClient();
  const ids = [...new Set((leadIds || []).filter(Boolean))];
  if (!ids.length) throw new Error('Choose at least one lead.');
  let targetId = listId;
  let name = null;
  if (!targetId) {
    if (!newListName?.trim()) throw new Error('Choose a list or name a new one.');
    const created = await createManualList(businessId, newListName.trim());
    targetId = created.id;
    name = created.name;
  }
  const { error } = await supabase
    .from('list_members')
    .upsert(ids.map((leadId) => ({ list_id: targetId, lead_id: leadId })), { onConflict: 'list_id,lead_id', ignoreDuplicates: true });
  if (error) throw error;
  return { id: targetId, name };
}

export async function fetchManualLists(businessId) {
  requireClient();
  const { data, error } = await supabase
    .from('lists')
    .select('id, name, type')
    .eq('business_id', businessId)
    .eq('type', 'manual')
    .eq('archived', false)
    .order('name');
  if (error) throw error;
  return data || [];
}

// Books the meeting and its WhatsApp reminder sequence in one go (see the schedule_lead_meeting SQL function).
export async function scheduleMeeting({ businessId, leadId, title, startsAt, durationMinutes, kind, location, notes, reminders }) {
  requireClient();
  const { data, error } = await supabase.rpc('schedule_lead_meeting', {
    p_business_id: businessId,
    p_contact_id: leadId,
    p_title: title,
    p_starts_at: new Date(startsAt).toISOString(),
    p_duration_minutes: Number(durationMinutes) || 30,
    p_kind: kind,
    p_location: location || null,
    p_notes: notes || null,
    p_reminders: reminders,
  });
  if (error) throw error;
  return data;
}

export async function markMeeting(meetingId, status) {
  requireClient();
  const { error } = await supabase.rpc('mark_lead_meeting', { p_meeting_id: meetingId, p_status: status });
  if (error) throw error;
}

// ── "Let HeySasa do it": asks the backend to write the message for this lead's next action ──────────────────

export async function draftNextMessage({ businessId, leadId, goal }) {
  requireClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sign in again to use HeySasa.');
  const response = await fetch(`${BACKEND_API_URL}/leads/${encodeURIComponent(leadId)}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      'X-Business-Id': businessId,
    },
    body: JSON.stringify({ businessId, goal: goal || null }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.text) {
    throw new Error(result.message || result.error || 'HeySasa could not write this message right now.');
  }
  return { text: result.text, usedProducts: result.usedProducts || [] };
}

// ── Meeting reminder wording (editable in the modal before saving) ──────────────────────────────────────────

export function defaultReminderMessage(key, { name, title, startsAt, kind, location }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  const when = new Date(startsAt);
  const day = when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const time = when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const where = kind === 'in_person' && location ? ` at ${location}` : kind === 'video' && location ? ` (${location})` : '';
  const what = title && title !== 'Meeting' ? title : kind === 'call' ? 'our call' : 'our meeting';
  switch (key) {
    case 'day_before':
      return `Hi ${first}, a quick reminder about ${what} tomorrow, ${day} at ${time}${where}. Reply here if you need to change the time.`;
    case 'two_hours':
      return `Hi ${first}, ${what} is in 2 hours, at ${time}${where}. See you then!`;
    case 'thirty_min':
      return `Hi ${first}, ${what} starts in 30 minutes (${time})${where}. Ready when you are.`;
    case 'no_show':
      return `Hi ${first}, we missed you today. No worries, would you like to pick another time? Just reply with what suits you.`;
    default:
      return `Hi ${first}, a reminder about ${what} on ${day} at ${time}${where}.`;
  }
}
