import { supabase } from '../lib/supabase';
import { fetchWhatsAppSessions } from './businessService';
import { fetchManualListLeadIds, fetchLeadCampaignEnrollment } from './listsCampaignsService';

const EVOLUTION_API_URL = (import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '';
const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const PRIORITY_TABS = {
  hot: {
    label: '🔥 Hot',
    description: 'High intent — need action now',
    filter: (lead) => lead.intent_score >= 70 && lead.lead_state !== 'won' && lead.lead_state !== 'lost',
    sort: (a, b) => (b.intent_score || 0) - (a.intent_score || 0),
  },
  unread: {
    label: '📬 Unread',
    description: 'Waiting for your reply',
    filter: (lead) => (lead.unread_count || 0) > 0,
    sort: (a, b) => new Date(b.last_seen) - new Date(a.last_seen),
  },
  stalled: {
    label: '⏰ Stalled',
    description: 'Gone quiet — rescue now',
    filter: (lead) => lead.lead_state === 'stalled' || lead.lead_state === 'ghosted',
    sort: (a, b) => (a.intent_score || 0) - (b.intent_score || 0),
  },
  approval: {
    label: '✍️ Approval',
    description: 'Follow-up messages ready to send',
    filter: (lead) => lead.followup?.pending_approval === true,
    sort: (a, b) => new Date(a.followup?.next_due || 0) - new Date(b.followup?.next_due || 0),
  },
  ad_leads: {
    label: '📣 Ad leads',
    description: 'Leads from paid campaigns',
    filter: (lead) => lead.is_ad_lead === true,
    sort: (a, b) => (b.intent_score || 0) - (a.intent_score || 0),
  },
};

function hasLiveData() {
  return !!supabase;
}

function getBusinessId(businessId) {
  if (businessId) return businessId;
  if (typeof window !== 'undefined') {
    return window.currentBusinessId || localStorage.getItem('business_id') || null;
  }
  return null;
}

function normalizeReceiptStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (['read', 'played'].includes(normalized)) return 'read';
  if (['delivered', 'delivery_ack', 'delivery-ack'].includes(normalized)) return 'delivered';
  if (['replied'].includes(normalized)) return 'replied';
  return 'sent';
}

function normalizeLead(lead) {
  const leadType = ['business', 'personal'].includes(lead.lead_type)
    ? lead.lead_type
    : lead.is_business_chat === false ? 'personal' : 'business';

  return {
    id: lead.id,
    name: lead.name || 'Unknown',
    phone: lead.phone || '',
    lead_state: lead.lead_state || 'new',
    lead_type: leadType,
    lead_quality: lead.lead_quality || 'warm',
    is_ad_lead: !!lead.is_ad_lead,
    ad_id: lead.ad_id || null,
    ad_platform: lead.ad_platform || null,
    ad_headline: lead.ad_headline || null,
    ad_body: lead.ad_body || null,
    ad_thumbnail_url: lead.ad_thumbnail_url || null,
    original_ad_id: lead.original_ad_id || null,
    unread_count: lead.unread_count || 0,
    last_seen: lead.last_seen || new Date().toISOString(),
    context_summary: lead.context_summary || '',
    customer_intent: lead.customer_intent || '',
    psychology: lead.psychology || '',
    conv_stage: lead.conv_stage || 'New Lead',
    follow_up_count: lead.follow_up_count || 0,
    product_interests: Array.isArray(lead.product_interests) ? lead.product_interests : [],
    cart_state: Array.isArray(lead.cart_state) ? lead.cart_state : [],
    trust_markers: Array.isArray(lead.trust_markers) ? lead.trust_markers : [],
    vibe_check: lead.vibe_check || null,
    next_action_plan: lead.next_action_plan || null,
    product_sold: lead.product_sold || null,
    deal_value: lead.deal_value || null,
    purchase_date: lead.purchase_date || null,
    is_business_chat: lead.is_business_chat !== false,
    read_receipt: normalizeReceiptStatus(lead.read_receipt),
    last_seen_online: lead.presence_updated_at || lead.last_seen_online || null,
    presence_status: lead.presence_status || null,
    presence_updated_at: lead.presence_updated_at || null,
    sent_voice_note: !!lead.sent_voice_note,
    sent_media: !!lead.sent_media,
    sent_reaction: !!lead.sent_reaction,
    intent_score: lead.intent_score ?? null,
    competitor_mentions: Array.isArray(lead.competitor_mentions) ? lead.competitor_mentions : [],
    objection_tags: Array.isArray(lead.objection_tags) ? lead.objection_tags : [],
    pre_purchase_questions: Array.isArray(lead.pre_purchase_questions) ? lead.pre_purchase_questions : [],
    followup: lead.followup_status
      ? {
          status: lead.followup_status,
          current_step: lead.followup_current_step || 0,
          sent_steps: Array.isArray(lead.followup_sent_steps) ? lead.followup_sent_steps : [],
          pending_approval: !!lead.followup_pending_approval,
          draft: lead.followup_draft || null,
          next_due: lead.followup_next_due || null,
        }
      : {
          status: 'not_enrolled',
          current_step: 0,
          sent_steps: [],
          pending_approval: false,
          draft: null,
          next_due: null,
        },
    transcript: [],
  };
}

async function fetchLiveLeads(businessId) {
  const id = getBusinessId(businessId);
  if (!supabase) {
    console.error('[leadsService] Supabase client not initialized.');
    return null;
  }
  if (!id) {
    console.error('[leadsService] fetchLiveLeads missing businessId.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('v_lead_summary')
      .select(`
        id,
        name,
        phone,
        business_id,
        lead_state,
        lead_type,
        lead_quality,
        is_ad_lead,
        ad_id,
        ad_platform,
        ad_headline,
        ad_body,
        ad_thumbnail_url,
        original_ad_id,
        unread_count,
        last_seen,
        context_summary,
        customer_intent,
        psychology,
        conv_stage,
        follow_up_count,
        product_interests,
        cart_state,
        trust_markers,
        vibe_check,
        next_action_plan,
        product_sold,
        deal_value,
        purchase_date,
        do_not_contact,
        follow_up_opted_in,
        follow_up_opted_in_at,
        follow_up_opted_out_at,
        consent_message_sent_at,
        is_business_chat,
        social_id,
        read_receipt,
        last_seen_online,
        sent_voice_note,
        sent_media,
        sent_reaction,
        intent_score,
        competitor_mentions,
        objection_tags,
        pre_purchase_questions,
        nlp_enriched_at,
        structural_enriched_at,
        followup_status,
        followup_current_step,
        followup_sent_steps,
        followup_pending_approval,
        followup_draft,
        followup_next_due
      `)
      .eq('business_id', id)
      .order('intent_score', { ascending: false, nullsLast: true });

    if (error) throw error;

    const manualListLeadIds = await fetchManualListLeadIds(id);
    const { data: enrolledRows, error: enrolledError } = await supabase
      .from('campaign_enrollments')
      .select('lead_id')
      .in('status', ['pending', 'active']);
    if (enrolledError) throw enrolledError;
    const enrolledLeadIds = new Set((enrolledRows || []).map((row) => row.lead_id));
    const leads = (data || []).filter((lead) => !manualListLeadIds.has(lead.id) || enrolledLeadIds.has(lead.id)).map(normalizeLead);
    const enrolledLeads = await Promise.all(leads.filter((lead) => enrolledLeadIds.has(lead.id)).map(async (lead) => ({
      id: lead.id,
      campaignEnrollment: await fetchLeadCampaignEnrollment(id, lead.id),
    })));
    const enrollmentByLeadId = new Map(enrolledLeads.map((item) => [item.id, item.campaignEnrollment]).filter((item) => item[1]));
    const leadsWithCampaigns = leads.map((lead) => ({ ...lead, campaignEnrollment: enrollmentByLeadId.get(lead.id) || null }));
    const contactIds = leadsWithCampaigns.map((lead) => lead.id).filter(Boolean);
    if (!contactIds.length) return leadsWithCampaigns;

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, presence_status, presence_updated_at')
      .eq('business_id', id)
      .in('id', contactIds);
    if (contactsError) throw contactsError;

    const presenceById = new Map((contacts || []).map((contact) => [contact.id, contact]));
    return leadsWithCampaigns.map((lead) => {
      const presence = presenceById.get(lead.id);
      return presence
        ? {
            ...lead,
            presence_status: presence.presence_status || null,
            presence_updated_at: presence.presence_updated_at || null,
            last_seen_online: presence.presence_updated_at || null,
          }
        : lead;
    });
  } catch (error) {
    console.error('[leadsService] fetchLiveLeads failed:', error.message);
    return null;
  }
}

async function fetchChatTranscript(leadId) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, direction, role, type, content, raw_payload, created_at, status, is_read')
      .eq('contact_id', leadId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    return (data || []).map(normalizeStoredMessage);
  } catch (error) {
    console.error('[leadsService] fetchChatTranscript failed:', error.message);
    return [];
  }
}

export function subscribeToLeadData(businessId, onChange) {
  if (!supabase || !businessId) return () => {};

  const channel = supabase
    .channel(`lead-data-${businessId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contacts', filter: `business_id=eq.${businessId}` },
      onChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations', filter: `business_id=eq.${businessId}` },
      onChange
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToChatMessages(leadId, onChange) {
  if (!supabase || !leadId) return () => {};

  const channel = supabase
    .channel(`chat-messages-${leadId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `contact_id=eq.${leadId}` },
      onChange
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

function getMediaDetails(payload = {}, fallbackType = '') {
  const image = payload.imageMessage || payload.image || {};
  const video = payload.videoMessage || payload.video || {};
  const document = payload.documentMessage || payload.document || {};
  const media = image.url || video.url || document.url || payload.mediaUrl || payload.media_url;
  const thumbnail = image.jpegThumbnail || image.thumbnail || payload.thumbnail;

  return {
    mediaType: image.mimetype ? 'image' : video.mimetype ? 'video' : document.mimetype ? 'document' : fallbackType,
    mediaUrl: media || null,
    mediaThumbnail: thumbnail ? `data:image/jpeg;base64,${thumbnail}` : null,
  };
}

function normalizeStoredMessage(message) {
  const payload = message.content || {};
  return {
    id: message.id,
    sender: message.direction === 'out' ? 'business' : 'lead',
    text: typeof message.content === 'string'
      ? message.content
      : payload.text || payload.body || payload.caption || payload.imageMessage?.caption || message.type || '[Unsupported message]',
    timestamp: message.created_at,
    status: normalizeReceiptStatus(message.status),
    isRead: message.is_read || ['read', 'played'].includes(String(message.status || '').toLowerCase()),
    rawMessage: message.raw_payload,
    ...getMediaDetails(payload, message.type),
  };
}

async function markChatMessagesRead(leadId) {
  if (!supabase || !leadId) return;

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('contact_id', leadId)
    .eq('direction', 'in');

  if (error) throw error;
}

async function sendChatMessage({ phone, text }) {
  const businessId = getBusinessId();
  if (!businessId) throw new Error('No business selected.');
  if (!phone) throw new Error('This lead has no phone number.');

  const sessions = await fetchWhatsAppSessions(businessId);
  const session = sessions.find((item) => item.status === 'connected' && item.instance_name);
  if (!session) throw new Error('No connected WhatsApp instance is available.');

  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(session.instance_name)}`, {
    method: 'POST',
    headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      number: phone.replace(/\D/g, ''),
      text,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || result?.error || 'Could not send WhatsApp message.');

  return result;
}

function normalizeEvolutionMessage(message) {
  const key = message?.key || {};
  const payload = message?.message || message?.content || {};
  const timestamp = message?.messageTimestamp || message?.timestamp || message?.created_at;
  const numericTimestamp = Number(timestamp);
  const parsedTimestamp = timestamp
    ? new Date(numericTimestamp && numericTimestamp < 100000000000 ? numericTimestamp * 1000 : timestamp)
    : new Date();
  const isoTimestamp = Number.isNaN(parsedTimestamp.getTime()) ? new Date().toISOString() : parsedTimestamp.toISOString();

  return {
    id: key.id || message?.id || `evolution-${isoTimestamp}-${Math.random()}`,
    sender: key.fromMe || message?.fromMe ? 'business' : 'lead',
    text: payload.conversation
      || payload.extendedTextMessage?.text
      || payload.imageMessage?.caption
      || payload.videoMessage?.caption
      || payload.documentMessage?.caption
      || message?.body
      || message?.text
      || message?.type
      || '[Unsupported message]',
    timestamp: isoTimestamp,
    status: normalizeReceiptStatus(message?.status),
    isRead: ['read', 'played'].includes(String(message?.status || '').toLowerCase()),
    rawMessage: message,
    ...getMediaDetails(payload, message?.messageType || message?.type),
  };
}

async function loadChatMessageMedia(message) {
  if (message.mediaUrl || message.mediaThumbnail || !message.rawMessage) return message;

  const businessId = getBusinessId();
  const sessions = await fetchWhatsAppSessions(businessId);
  const session = sessions.find((item) => item.status === 'connected' && item.instance_name);
  if (!session) return message;

  const response = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${encodeURIComponent(session.instance_name)}`, {
    method: 'POST',
    headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message.rawMessage }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return message;

  const base64 = result.base64 || result.data?.base64;
  const mimetype = result.mimetype || result.data?.mimetype || 'image/jpeg';
  return base64 ? { ...message, mediaUrl: `data:${mimetype};base64,${base64}` } : message;
}

function getEvolutionMessageList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of ['messages', 'data', 'records', 'items']) {
    const messages = getEvolutionMessageList(payload[key]);
    if (messages.length) return messages;
  }
  return [];
}

function getEvolutionChatList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of ['chats', 'data', 'records', 'items']) {
    const chats = getEvolutionChatList(payload[key]);
    if (chats.length) return chats;
  }
  return [];
}

function getChatPhone(chat) {
  const remoteJid = chat?.remoteJid || chat?.id || chat?.jid || chat?.key?.remoteJid || '';
  const phone = String(remoteJid).split('@')[0].replace(/\D/g, '');
  return phone || null;
}

function getEvolutionChatName(chat, fallback) {
  return chat?.name || chat?.pushName || chat?.profileName || chat?.profile_name || chat?.username || chat?.notify || fallback || 'Unknown contact';
}

function normalizeEvolutionChat(chat) {
  const phone = getChatPhone(chat);
  const lastMessage = chat?.lastMessage || chat?.messages?.[0] || {};
  const normalizedLastMessage = normalizeEvolutionMessage(lastMessage);
  const lastSeen = chat?.conversationTimestamp || chat?.updatedAt || normalizedLastMessage.timestamp;
  const numericLastSeen = Number(lastSeen);
  const parsedLastSeen = new Date(numericLastSeen && numericLastSeen < 100000000000 ? numericLastSeen * 1000 : lastSeen);

  return normalizeLead({
    id: phone ? `evolution-${phone}` : null,
    name: getEvolutionChatName(chat, phone),
    phone,
    unread_count: Number(chat?.unreadCount || chat?.unreadMessages || 0),
    last_seen: Number.isNaN(parsedLastSeen.getTime()) ? new Date().toISOString() : parsedLastSeen.toISOString(),
    context_summary: normalizedLastMessage.text,
    is_business_chat: true,
    read_receipt: normalizeReceiptStatus(chat?.lastMessage?.status),
  });
}

async function loadEvolutionChats() {
  const businessId = getBusinessId();
  if (!businessId) throw new Error('No business selected.');

  const sessions = await fetchWhatsAppSessions(businessId);
  const session = sessions.find((item) => item.status === 'connected' && item.instance_name);
  if (!session) throw new Error('No connected WhatsApp instance is available.');

  const response = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${encodeURIComponent(session.instance_name)}`, {
    method: 'POST',
    headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || result?.error || 'Could not load WhatsApp chats.');

  return getEvolutionChatList(result)
    .filter((chat) => {
      const remoteJid = String(chat?.remoteJid || chat?.id || chat?.jid || chat?.key?.remoteJid || '');
      return remoteJid.endsWith('@s.whatsapp.net') && !remoteJid.includes('-');
    })
    .map(normalizeEvolutionChat)
    .filter((chat) => chat.phone);
}

async function syncEvolutionChats(existingLeads = []) {
  const businessId = getBusinessId();
  if (!businessId) throw new Error('No business selected.');

  const chats = await loadEvolutionChats();
  const uniqueChats = [...new Map(chats.map((chat) => [chat.phone, chat])).values()];
  if (!supabase) return { leads: uniqueChats, newConversations: uniqueChats.length };

  const { data: storedContacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, phone, name')
    .eq('business_id', businessId);
  if (contactsError) throw contactsError;

  const contactByPhone = new Map((storedContacts || [])
    .map((contact) => [String(contact.phone || '').replace(/\D/g, ''), contact])
    .filter(([phone]) => phone));
  const localPhones = new Set(existingLeads.map((lead) => String(lead.phone || '').replace(/\D/g, '')).filter(Boolean));
  const newContactInputs = uniqueChats
    .filter((chat) => !contactByPhone.has(chat.phone))
    .map((chat) => ({ ...chat, name: getEvolutionChatName(chat, chat.phone) }));

  let createdLeads = [];
  if (newContactInputs.length) {
    const created = await createBulkLeads(newContactInputs);
    if (!created.ok) throw new Error(created.error || 'Could not save chats as leads.');
    createdLeads = created.leads;
    createdLeads.forEach((lead) => contactByPhone.set(String(lead.phone || '').replace(/\D/g, ''), lead));
  }

  await Promise.all(uniqueChats.map(async (chat) => {
    const contact = contactByPhone.get(chat.phone);
    const profileName = chat.name && chat.name !== chat.phone ? chat.name : null;
    if (!contact || !profileName || !(!contact.name || !String(contact.name).trim())) return;

    const { error } = await supabase
      .from('contacts')
      .update({ name: profileName })
      .eq('id', contact.id)
      .eq('business_id', businessId);
    if (error) throw error;
    contact.name = profileName;
  }));

  const contactsForChats = uniqueChats
    .map((chat) => contactByPhone.get(chat.phone))
    .filter(Boolean);
  const contactIds = [...new Set(contactsForChats.map((contact) => contact.id))];
  let newConversations = 0;

  if (contactIds.length) {
    const { data: storedConversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, contact_id')
      .eq('business_id', businessId)
      .in('contact_id', contactIds);
    if (conversationsError) throw conversationsError;

    const conversationContactIds = new Set((storedConversations || []).map((conversation) => conversation.contact_id));
    const conversationInputs = contactsForChats
      .filter((contact) => !conversationContactIds.has(contact.id))
      .map((contact) => ({ business_id: businessId, contact_id: contact.id, stage: 'new' }));

    if (conversationInputs.length) {
      const { error } = await supabase.from('conversations').insert(conversationInputs);
      if (error) throw error;
      newConversations = conversationInputs.length;
    }
  }

  return {
    leads: createdLeads.filter((lead) => !localPhones.has(String(lead.phone || '').replace(/\D/g, ''))),
    newConversations,
  };
}

async function loadPastChatMessages({ phone }) {
  const businessId = getBusinessId();
  if (!businessId) throw new Error('No business selected.');
  if (!phone) throw new Error('This lead has no phone number.');

  const sessions = await fetchWhatsAppSessions(businessId);
  const session = sessions.find((item) => item.status === 'connected' && item.instance_name);
  if (!session) throw new Error('No connected WhatsApp instance is available.');

  const remoteJid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
  const pageSize = 100;
  const maxPages = 100;
  const messagesById = new Map();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${encodeURIComponent(session.instance_name)}`, {
      method: 'POST',
      headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: { key: { remoteJid } },
        page,
        offset: pageSize,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.message || result?.error || 'Could not load past WhatsApp messages.');

    const pageMessages = getEvolutionMessageList(result);
    const previousSize = messagesById.size;
    pageMessages.forEach((message) => {
      const normalized = normalizeEvolutionMessage(message);
      messagesById.set(normalized.id, normalized);
    });

    if (pageMessages.length < pageSize || messagesById.size === previousSize) break;
  }

  return [...messagesById.values()].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

async function approveFollowUpDraft(leadId, draft) {
  if (!supabase) return { ok: false };

  try {
    const { error } = await supabase
      .from('follow_up_queue')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_message: draft,
      })
      .eq('contact_id', leadId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[leadsService] approveFollowUpDraft failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function sendConsentMessage(leadId, message) {
  if (!supabase) return { ok: true };

  try {
    const { error } = await supabase
      .from('contacts')
      .update({
        consent_message_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) throw error;
    return { ok: true, message };
  } catch (error) {
    console.error('[leadsService] sendConsentMessage failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function createLead(leadInput = {}) {
  if (!supabase) return { ok: false, error: 'Supabase client is not initialized.' };

  const businessId = getBusinessId();
  if (!businessId) return { ok: false, error: 'No business id found for this account.' };

  const payload = {
    business_id: businessId,
    name: (leadInput.name || '').trim() || 'New Lead',
    phone: (leadInput.phone || '').trim() || '+254',
    lead_state: leadInput.lead_state || 'new',
    lead_quality: leadInput.lead_quality || 'warm',
    lead_type: leadInput.lead_type || 'business',
    is_ad_lead: false,
  };

  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return { ok: true, lead: normalizeLead(data) };
  } catch (error) {
    console.error('[leadsService] createLead failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function createBulkLeads(leadInputs = []) {
  if (!supabase) return { ok: false, error: 'Supabase client is not initialized.' };

  const businessId = getBusinessId();
  if (!businessId) return { ok: false, error: 'No business id found for this account.' };

  const payload = (leadInputs || [])
    .filter(Boolean)
    .map((leadInput) => ({
      business_id: businessId,
      name: (leadInput.name || '').trim() || 'New Lead',
      phone: (leadInput.phone || '').trim() || '+254',
      lead_state: leadInput.lead_state || 'new',
      lead_quality: leadInput.lead_quality || 'warm',
      lead_type: leadInput.lead_type || 'business',
      is_ad_lead: false,
    }));

  if (!payload.length) return { ok: false, error: 'No valid leads to import.' };

  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert(payload)
      .select();

    if (error) throw error;

    return { ok: true, leads: (data || []).map(normalizeLead) };
  } catch (error) {
    console.error('[leadsService] createBulkLeads failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function updateLeadState(leadId, newState) {
  if (!supabase) return { ok: false };

  const validStates = ['new', 'engaged', 'warm', 'stalled', 'ghosted', 'won', 'lost', 'do_not_contact'];
  if (!validStates.includes(newState)) return { ok: false, error: 'invalid state' };

  try {
    const { error } = await supabase
      .from('contacts')
      .update({ lead_state: newState })
      .eq('id', leadId);

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[leadsService] updateLeadState failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function updateLead(leadId, { name, phone, lead_state: leadState, lead_type: leadType, is_business_chat: isBusinessChat }) {
  if (!supabase) return { ok: true };
  const validStates = ['new', 'engaged', 'warm', 'stalled', 'ghosted', 'won', 'lost', 'do_not_contact'];
  if (leadState && !validStates.includes(leadState)) return { ok: false, error: 'invalid state' };

  try {
    const changes = {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(leadState !== undefined ? { lead_state: leadState } : {}),
      ...(leadType !== undefined ? { lead_type: leadType } : {}),
      ...(isBusinessChat !== undefined ? { is_business_chat: isBusinessChat } : {}),
    };
    const { error } = await supabase
      .from('contacts')
      .update(changes)
      .eq('id', leadId);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[leadsService] updateLead failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function deleteLead(leadId) {
  if (!supabase) return { ok: true };

  try {
    for (const table of ['messages', 'conversations', 'follow_up_queue']) {
      const { error } = await supabase.from(table).delete().eq('contact_id', leadId);
      if (error) throw error;
    }
    const { error } = await supabase.from('contacts').delete().eq('id', leadId);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[leadsService] deleteLead failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function analyzeLead(leadId) {
  return analyzeContacts([leadId]);
}

async function analyzeContacts(contactIds = []) {
  if (!supabase) return { ok: true, running: false };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('You must be signed in to analyse contacts.');

    const normalizedContactIds = [...new Set((contactIds || []).filter((contactId) => Number.isInteger(Number(contactId))).map(Number))];
    const response = await fetch(`${BACKEND_API_URL}/analysis/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ contactIds: normalizedContactIds }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error || 'Could not analyse contacts.');
    return { ok: true, ...result };
  } catch (error) {
    console.error('[leadsService] analyzeContacts failed:', error.message);
    return { ok: false, error: error.message };
  }
}

async function markAsBought(leadId, { products = [], dealValue = 0, closedBy = 'human' }) {
  if (!supabase) {
    // Mock: just return success in dev
    return { ok: true };
  }

  try {
    const productTitle = products.map((p) => p.title).join(', ') || 'Products';

    const { error } = await supabase
      .from('contacts')
      .update({
        lead_state: 'won',
        product_sold: productTitle,
        deal_value: dealValue,
        purchase_date: new Date().toISOString(),
        purchase_closed_by: closedBy, // 'ai' or 'human'
      })
      .eq('id', leadId);

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[leadsService] markAsBought failed:', error.message);
    return { ok: false, error: error.message };
  }
}

function getPriorityTabCounts(leads) {
  const counts = {};
  for (const [tabId, tab] of Object.entries(PRIORITY_TABS)) {
    counts[tabId] = leads.filter(tab.filter).length;
  }
  return counts;
}

function getPriorityTabLeads(leads, tabId) {
  const tab = PRIORITY_TABS[tabId];
  if (!tab) return leads;
  return [...leads].filter(tab.filter).sort(tab.sort);
}

export const leadsService = {
  PRIORITY_TABS,
  hasLiveData,
  getBusinessId,
  createLead,
  createBulkLeads,
  fetchLiveLeads,
  fetchChatTranscript,
  subscribeToLeadData,
  subscribeToChatMessages,
  markChatMessagesRead,
  sendChatMessage,
  syncEvolutionChats,
  loadPastChatMessages,
  loadChatMessageMedia,
  approveFollowUpDraft,
  sendConsentMessage,
  updateLeadState,
  updateLead,
  deleteLead,
  analyzeLead,
  analyzeContacts,
  markAsBought,
  getPriorityTabCounts,
  getPriorityTabLeads,
  _mapLead: normalizeLead,
};

if (typeof window !== 'undefined') {
  window.leadsService = leadsService;
}

export default leadsService;
