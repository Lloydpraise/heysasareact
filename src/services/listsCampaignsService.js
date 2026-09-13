// listsCampaigns/listsCampaignsService.js
import { supabase } from '../lib/supabase';
import { parseDateTimeLocalInTimeZone } from '../utils/businessTime';

// ============================================================
// Module A — Automation Rules
// ============================================================
export async function fetchAutomationRules(businessId) {
  const { data, error } = await supabase
    .from('segmentation_rules')
    .select('rule_id, enabled, disabled_at, factors')
    .eq('business_id', businessId);
  if (error) throw error;
  return data; // [{ rule_id, enabled, disabled_at, factors }]
}

export async function toggleAutomationRule(businessId, ruleId, enabled) {
  if (!supabase || !businessId) return;
  const { error } = await supabase.from('segmentation_rules').upsert({
    business_id: businessId,
    rule_id: ruleId,
    enabled,
    disabled_at: enabled ? null : new Date().toISOString(),
  }, { onConflict: 'business_id,rule_id' });
  if (error) throw error;

  // Auto-lists mirror rule state: create/restore the list row on ON, archive it on OFF.
  const { error: listError } = await supabase.from('lists').upsert({
    business_id: businessId,
    rule_id: ruleId,
    type: 'auto',
    archived: !enabled,
    disabled_at: enabled ? null : new Date().toISOString(),
  }, { onConflict: 'business_id,rule_id' });
  if (listError) throw listError;
}

export async function updateRuleFactors(businessId, ruleId, factors) {
  if (!supabase || !businessId) return;
  const { error } = await supabase
    .from('segmentation_rules')
    .update({ factors })
    .eq('business_id', businessId)
    .eq('rule_id', ruleId);
  if (error) throw error;
}

export function daysUntilDeletion(disabledAt) {
  if (!disabledAt) return null;
  const elapsed = (Date.now() - new Date(disabledAt).getTime()) / 86400000;
  return Math.max(0, Math.ceil(30 - elapsed));
}

// ============================================================
// Module B — List Manager
// ============================================================
export async function fetchLists(businessId) {
  const { data, error } = await supabase
    .from('v_list_summary')
    .select('*')
    .eq('business_id', businessId);
  if (error) throw error;

  return data.map((row) => {
    const memberCount = row.total_contacts ?? 0;
    const sendableCount = row.ready_count ?? memberCount;

    return {
      id: row.list_id,
      name: row.name,
      type: row.type,
      ruleId: row.rule_id,
      archived: row.archived,
      disabledAt: row.disabled_at,
      totalContacts: memberCount,
      memberCount,
      sendableCount,
      estPipelineValue: row.est_pipeline_value,
      breakdown: {
        ready: row.ready_count,
        in_campaign: row.in_campaign_count,
        opted_out: row.opted_out_count,
      },
    };
  });
}

export async function createManualList(businessId, name) {
  const { data, error } = await supabase
    .from('lists')
    .insert({ business_id: businessId, name, type: 'manual' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createManualListWithContacts(businessId, name, contacts) {
  if (!supabase || !businessId) throw new Error('No business selected.');
  const { data: list, error: listError } = await supabase
    .from('lists')
    .insert({ business_id: businessId, name, type: 'manual' })
    .select()
    .single();
  if (listError) throw listError;

  const contactPayload = contacts.map((contact) => ({
    business_id: businessId,
    name: contact.name.trim(),
    phone: contact.phone.trim(),
    lead_state: 'new',
    lead_quality: 'warm',
    lead_type: 'business',
    is_ad_lead: false,
  }));
  const { data: createdContacts, error: contactsError } = await supabase
    .from('contacts')
    .insert(contactPayload)
    .select('id');
  if (contactsError) throw contactsError;

  const memberships = (createdContacts || []).map((contact) => ({
    list_id: list.id,
    lead_id: contact.id,
  }));

  if (memberships.length) {
    const { error: membershipError } = await supabase
      .from('list_members')
      .insert(memberships);
    if (membershipError) throw membershipError;
  }
  return list;
}
// ============================================================
// Module C — Campaign Runner
// ============================================================
export async function fetchListsForCampaignPicker(businessId) {
  const rows = await fetchLists(businessId);
  return rows.map((list) => ({
    ...list,
    isAuto: list.type === 'auto',
    memberCount: list.memberCount ?? list.totalContacts ?? 0,
    sendableCount: list.sendableCount ?? list.memberCount ?? list.totalContacts ?? 0,
  }));
}

export async function fetchCampaignListLocks(businessId, editingCampaignId = null) {
  if (!businessId) return {};

  const { data, error } = await supabase
    .from('v_campaign_summary')
    .select('campaign_id, list_id, name, status')
    .eq('business_id', businessId)
    .eq('status', 'active');
  if (error) throw error;

  return (data || []).reduce((locks, campaign) => {
    if (campaign.campaign_id !== editingCampaignId && campaign.list_id) {
      locks[campaign.list_id] = campaign.name;
    }
    return locks;
  }, {});
}

export async function previewCampaignAudience(businessId, listIds) {
  if (!businessId || !listIds?.length) {
    return { totalMembers: 0, sendableCount: 0, excludedCount: 0 };
  }

  const rows = await fetchListsForCampaignPicker(businessId);
  const selected = rows.filter((list) => listIds.includes(list.id));
  const totalMembers = selected.reduce((sum, list) => sum + (list.memberCount ?? 0), 0);
  const sendableCount = selected.reduce((sum, list) => sum + (list.sendableCount ?? 0), 0);
  const excludedCount = Math.max(0, totalMembers - sendableCount);

  return {
    totalMembers,
    sendableCount,
    excludedCount,
  };
}

export async function fetchCampaigns(businessId) {
  const { data: campaigns, error } = await supabase
    .from('v_campaign_summary')
    .select('*')
    .eq('business_id', businessId);
  if (error) throw error;

  if (!campaigns?.length) return [];

  const { data: allSteps, error: stepsError } = await supabase
    .from('v_campaign_step_summary')
    .select('*')
    .in('campaign_id', campaigns.map((c) => c.campaign_id));
  if (stepsError) throw stepsError;

  return campaigns.map((row) => ({
    id: row.campaign_id,
    name: row.name,
    status: row.status,
    listId: row.list_id,
    listName: row.list_name,
    sequenceMode: row.sequence_mode,
    gateway: row.gateway_type,
    dailyCap: row.daily_cap,
    sentToday: Number(row.sent_today ?? 0),
    enrolled: Number(row.enrolled_count ?? 0),
    sent: Number(row.sent_count ?? 0),
    responseRate: Number(row.response_rate ?? 0),
    repliesCount: Number(row.replies_count ?? 0),
    revenue: Number(row.realized_revenue ?? 0),
    smartTiming: row.smart_timing ?? true,
    aiRewriteEnabled: row.ai_rewrite_enabled,
    autoApprove: row.auto_approve,
    steps: allSteps
      .filter((s) => s.campaign_id === row.campaign_id)
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => ({
        id: s.step_id,
        content: s.content,
        delayHours: s.delay_hours,
        condition: s.condition,
        sentCount: s.sent_count,
        repliedCount: s.replied_count,
        optOuts: s.opt_outs,
      })),
  }));
}

export async function toggleCampaignAiRewrite(campaignId, enabled) {
  const { error } = await supabase.from('campaigns').update({ ai_rewrite_enabled: enabled }).eq('id', campaignId);
  if (error) throw error;
}

export async function toggleCampaignAutoApprove(campaignId, enabled) {
  const { error } = await supabase.from('campaigns').update({ auto_approve: enabled }).eq('id', campaignId);
  if (error) throw error;
}

export async function launchCampaign(
  businessId,
  {
    listId,
    listIds,
    name,
    sequenceMode,
    sequenceType,
    steps,
    smartTiming,
    gatewayType,
    dailyCap,
    firstMessageSendAt,
    timezone,
    aiRewriteEnabled,
    autoApprove,
  }
) {
  const primaryListId = listIds?.[0] ?? listId;
  const safeSequenceMode = sequenceMode ?? (sequenceType === 'educational' ? 'conditional' : 'linear');
  if (!Array.isArray(steps) || steps.length === 0 || steps.some((step) => !step?.content?.trim())) {
    throw new Error('Add at least one message before launching the campaign.');
  }

  // firstMessageSendAt was accepted here but never used — every enrollment
  // got next_send_at: null below, which campaignScheduler.js's
  // .lte('next_send_at', now) can never match (NULL is never <= anything
  // in Postgres). Campaigns silently never sent regardless of what the
  // "Send timing" picker in MessageSequenceBuilder showed. Parse it now
  // and actually use it for the first enrollment's next_send_at.
  const firstSendAt = firstMessageSendAt
    ? parseDateTimeLocalInTimeZone(firstMessageSendAt, timezone || 'Africa/Nairobi')
    : new Date();
  const firstSendAtIso = Number.isNaN(firstSendAt.getTime()) ? new Date().toISOString() : firstSendAt.toISOString();

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      business_id: businessId,
      list_id: primaryListId,
      name,
      sequence_mode: safeSequenceMode,
      smart_timing: smartTiming ?? true,
      status: 'active',
      gateway_type: gatewayType ?? 'Baileys',
      daily_cap: Number(dailyCap ?? 40),
      // AI toggle: off (default) sends each step's written content as-is.
      // On, the sender treats it as a suggestion and has AI expand/
      // personalize it before sending.
      ai_rewrite_enabled: Boolean(aiRewriteEnabled),
      // Auto-approve: on (default) sends automatically when due. Off
      // requires manual approval in the dashboard before each step sends.
      auto_approve: Boolean(autoApprove),
    })
    .select()
    .single();
  if (error) throw error;

  const stepRows = (steps || []).map((s, i) => ({
    campaign_id: campaign.id,
    step_number: i + 1,
    content: s.content,
    delay_hours: Number(s.delayHours ?? s.gapHours ?? 0),
    condition: i === 0 ? null : s.condition ?? null,
  }));
  const { error: stepsError } = await supabase.from('campaign_steps').insert(stepRows);
  if (stepsError) {
    await supabase.from('campaigns').delete().eq('id', campaign.id);
    throw stepsError;
  }

  const targetListIds = Array.from(new Set([primaryListId, ...(listIds || [])].filter(Boolean)));

  if (targetListIds.length) {
    const { data: members, error: membersError } = await supabase
      .from('list_members')
      .select('lead_id')
      .in('list_id', targetListIds);

    if (membersError) throw membersError;

    const leadIds = [...new Set((members || []).map((member) => member.lead_id).filter(Boolean))];

    await syncCampaignEnrollments(campaign.id, businessId, leadIds, firstSendAtIso);
  }

  return campaign;
}

export async function updateCampaign(
  campaignId,
  {
    businessId,
    listId,
    listIds,
    name,
    sequenceMode,
    sequenceType,
    steps,
    smartTiming,
    firstMessageSendAt,
    timezone,
    dailyCap,
    aiRewriteEnabled,
    autoApprove,
  }
) {
  const primaryListId = listIds?.[0] ?? listId;
  const safeSequenceMode = sequenceMode ?? (sequenceType === 'educational' ? 'conditional' : 'linear');
  if (!Array.isArray(steps) || steps.length === 0 || steps.some((step) => !step?.content?.trim())) {
    throw new Error('Add at least one message before saving the campaign.');
  }
  const { error } = await supabase
    .from('campaigns')
    .update({
      list_id: primaryListId,
      name,
      sequence_mode: safeSequenceMode,
      smart_timing: smartTiming ?? true,
      daily_cap: Number(dailyCap ?? 40),
      ai_rewrite_enabled: Boolean(aiRewriteEnabled),
      auto_approve: Boolean(autoApprove),
    })
    .eq('id', campaignId);
  if (error) throw error;

  const { data: existingSteps, error: existingStepsError } = await supabase
    .from('campaign_steps')
    .select('id')
    .eq('campaign_id', campaignId);
  if (existingStepsError) throw existingStepsError;

  const incomingSteps = steps || [];
  const incomingIds = incomingSteps.map((step) => step.id).filter(Boolean);
  const stepsToDelete = (existingSteps || []).map((step) => step.id).filter((id) => !incomingIds.includes(id));
  if (stepsToDelete.length) {
    const { error: deleteStepsError } = await supabase
      .from('campaign_steps')
      .delete()
      .in('id', stepsToDelete);
    if (deleteStepsError) throw deleteStepsError;
  }

  for (const [index, step] of incomingSteps.entries()) {
    const stepPayload = {
      step_number: index + 1,
      content: step.content,
      delay_hours: Number(step.delayHours ?? step.gapHours ?? 0),
      condition: index === 0 ? null : step.condition ?? null,
    };
    const query = step.id
      ? supabase.from('campaign_steps').update(stepPayload).eq('id', step.id).eq('campaign_id', campaignId)
      : supabase.from('campaign_steps').insert({ campaign_id: campaignId, ...stepPayload });
    const { error: stepError } = await query;
    if (stepError) throw stepError;

    const { error: queuedMessageError } = await supabase
      .from('follow_up_queue')
      .update({ final_message: stepPayload.content })
      .eq('campaign_id', campaignId)
      .eq('campaign_step', stepPayload.step_number)
      .in('status', ['pending', 'ready_to_send']);
    if (queuedMessageError) throw queuedMessageError;
  }

  const targetListIds = Array.from(new Set([primaryListId, ...(listIds || [])].filter(Boolean)));
  if (!targetListIds.length) {
    await syncCampaignEnrollments(campaignId, businessId, [], new Date().toISOString());
    return { id: campaignId };
  }

  const { data: members, error: membersError } = await supabase
    .from('list_members')
    .select('lead_id')
    .in('list_id', targetListIds);
  if (membersError) throw membersError;

  const leadIds = [...new Set((members || []).map((member) => member.lead_id).filter(Boolean))];
  const firstSendAt = firstMessageSendAt
    ? parseDateTimeLocalInTimeZone(firstMessageSendAt, timezone || 'Africa/Nairobi')
    : new Date();
  const firstSendAtIso = Number.isNaN(firstSendAt.getTime()) ? new Date().toISOString() : firstSendAt.toISOString();
  await syncCampaignEnrollments(campaignId, businessId, leadIds, firstSendAtIso);

  return { id: campaignId };
}

async function syncCampaignEnrollments(campaignId, businessId, leadIds, firstSendAtIso) {
  const candidateLeadIds = [...new Set(
    (leadIds || [])
      .map((leadId) => Number(leadId))
      .filter((leadId) => Number.isSafeInteger(leadId))
  )];
  let validLeadIds = candidateLeadIds;

  if (candidateLeadIds.length) {
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('business_id', businessId)
      .in('id', candidateLeadIds);
    if (contactsError) throw contactsError;
    validLeadIds = (contacts || []).map((contact) => Number(contact.id));
  }

  const { data: activeCampaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .neq('id', campaignId);
  if (campaignsError) throw campaignsError;

  const otherCampaignIds = (activeCampaigns || []).map((campaign) => campaign.id);
  let occupiedLeadIds = new Set();
  if (otherCampaignIds.length) {
    const { data: occupied, error: occupiedError } = await supabase
      .from('campaign_enrollments')
      .select('lead_id')
      .in('campaign_id', otherCampaignIds)
      .in('status', ['pending', 'active']);
    if (occupiedError) throw occupiedError;
    occupiedLeadIds = new Set((occupied || []).map((row) => row.lead_id));
  }

  const eligibleLeadIds = validLeadIds.filter((leadId) => !occupiedLeadIds.has(leadId));
  const { data: existing, error: existingError } = await supabase
    .from('campaign_enrollments')
    .select('lead_id, status')
    .eq('campaign_id', campaignId);
  if (existingError) throw existingError;

  const activeOrPendingExisting = (existing || []).filter((row) => ['pending', 'active'].includes(row.status));
  const eligibleSet = new Set(eligibleLeadIds);
  const toRemove = activeOrPendingExisting
    .map((row) => row.lead_id)
    .filter((leadId) => !eligibleSet.has(leadId));
  if (toRemove.length) {
    const { error: removeError } = await supabase
      .from('campaign_enrollments')
      .delete()
      .eq('campaign_id', campaignId)
      .in('lead_id', toRemove)
      .in('status', ['pending', 'active']);
    if (removeError) throw removeError;
  }

  const existingLeadIds = new Set((existing || []).map((row) => row.lead_id));
  const newEnrollmentRows = eligibleLeadIds
    .filter((leadId) => !existingLeadIds.has(leadId))
    .map((leadId) => ({
      campaign_id: campaignId,
      lead_id: leadId,
      status: 'active',
      current_step: 0,
      next_send_at: firstSendAtIso,
    }));
  if (newEnrollmentRows.length) {
    const { error: enrollmentError } = await supabase
      .from('campaign_enrollments')
      .insert(newEnrollmentRows);
    if (enrollmentError) throw enrollmentError;
  }
}

export async function pauseCampaign(campaignId, currentlyActive) {
  if (!supabase) return;
  const { error } = await supabase
    .from('campaigns')
    .update({ status: currentlyActive ? 'paused' : 'active' })
    .eq('id', campaignId);
  if (error) throw error;
}

export async function deleteCampaign(campaignId) {
  if (!supabase || !campaignId) return;

  // campaign_steps, campaign_enrollments, and campaign_step_events all
  // cascade automatically at the DB level when the campaigns row is
  // deleted. follow_up_queue.campaign_id is ON DELETE SET NULL (not
  // cascade) so already-sent messages stay in history — but pending/
  // ready_to_send/skipped/failed rows are campaign machinery, not real
  // history, so those get removed explicitly here.
  const { error: queueError } = await supabase
    .from('follow_up_queue')
    .delete()
    .eq('campaign_id', campaignId)
    .neq('status', 'sent');
  if (queueError) throw queueError;

  const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
  if (error) throw error;
}

// ============================================================
// Module D — Activity Log (send visibility across all campaigns)
// ============================================================
export async function fetchCampaignActivity(businessId, { campaignId, limit = 100 } = {}) {
  if (!businessId) return [];

  let query = supabase
    .from('follow_up_queue')
    .select(`
      id, status, approval_status, skip_reason, last_dispatch_error, dispatch_attempts,
      campaign_step, sequence_step, final_message, draft_message,
      scheduled_at, processed_at, created_at, campaign_id,
      campaigns:campaign_id ( name ),
      contacts:contact_id ( name, phone )
    `)
    .eq('business_id', businessId)
    .not('campaign_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    campaignName: row.campaigns?.name ?? '(deleted campaign)',
    contactName: row.contacts?.name || row.contacts?.phone || 'Unknown lead',
    step: row.campaign_step ?? row.sequence_step,
    status: row.status,
    approvalStatus: row.approval_status,
    errorReason: ['failed', 'skipped', 'cancelled'].includes(row.status)
      ? (row.last_dispatch_error || row.skip_reason)
      : null,
    dispatchAttempts: row.dispatch_attempts ?? 0,
    message: row.final_message || row.draft_message,
    scheduledAt: row.scheduled_at,
    processedAt: row.processed_at,
    createdAt: row.created_at,
  }));
}

export function subscribeToCampaignActivity(businessId, onChange) {
  if (!supabase || !businessId) return () => {};

  const channel = supabase
    .channel(`campaign-activity-${businessId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'follow_up_queue', filter: `business_id=eq.${businessId}` },
      (payload) => {
        // Only campaign-sourced rows matter for this view
        if (payload.new?.campaign_id || payload.old?.campaign_id) onChange?.(payload);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// Realtime capacity tracking — no polling interval needed.
export function subscribeToLists(businessId, onChange) {
  if (!supabase || !businessId) return () => {};

  const channel = supabase
    .channel(`lists-${businessId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `business_id=eq.${businessId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'list_members' }, (payload) => {
      const changedListId = payload.new?.list_id ?? payload.old?.list_id;
      if (changedListId) onChange?.(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts', filter: `business_id=eq.${businessId}` }, onChange)
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToCampaigns(businessId, onChange) {
  if (!supabase || !businessId) return () => {};

  const channel = supabase
    .channel(`campaigns-${businessId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns', filter: `business_id=eq.${businessId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_steps' }, (payload) => {
      const campaignId = payload.new?.campaign_id ?? payload.old?.campaign_id;
      if (campaignId) onChange?.(payload);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToCapacity(businessId, onChange) {
  const channel = supabase
    .channel(`capacity-${businessId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'daily_send_counters', filter: `business_id=eq.${businessId}` },
      (payload) => onChange(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}