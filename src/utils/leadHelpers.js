// Pure display helpers ported from leads.js. No React, no state — safe to
// unit test on their own and reuse across list/detail/drawer components.

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function timeUntil(iso) {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'overdue';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// lead_state -> label + Tailwind color classes.
// Colors: engaged/won reuse the brand green (#28A745); warm/stalled reuse the
// brand orange accent (#FF8C00) since "going cold" is the app's warning tone;
// new is a neutral blue; lost is red; ghosted/personal are neutral slate.
const STATE_MAP = {
  engaged:  { label: 'Engaged',  dotClass: 'bg-[#28A745]', textClass: 'text-[#28A745]' },
  new:      { label: 'New',      dotClass: 'bg-blue-500',  textClass: 'text-blue-600' },
  warm:     { label: 'Warm',     dotClass: 'bg-[#FF8C00]', textClass: 'text-[#FF8C00]' },
  stalled:  { label: 'Going cold',    dotClass: 'bg-[#FF8C00]', textClass: 'text-[#FF8C00]' },
  ghosted:  { label: 'Ghosted',  dotClass: 'bg-slate-400', textClass: 'text-slate-400' },
  won:      { label: 'Won',      dotClass: 'bg-[#28A745]', textClass: 'text-[#28A745]' },
  lost:     { label: 'Lost',     dotClass: 'bg-red-500',   textClass: 'text-red-600' },
  personal: { label: 'Personal', dotClass: 'bg-slate-300', textClass: 'text-slate-400' },
};

export function stateConfig(state) {
  return STATE_MAP[state] || { label: state, dotClass: 'bg-slate-300', textClass: 'text-slate-400' };
}

// Priority order used to sort the lead list — lower number sorts first.
export const STATE_PRIORITY = { engaged: 0, new: 1, warm: 2, stalled: 3, ghosted: 4, won: 5, lost: 6, personal: 7 };

export function hasUnrepliedCustomerMessage(lead) {
  return lead?.lead_type === 'business'
    && lead?.is_business_chat !== false
    && lead?.awaiting_business_reply === true;
}

export function qualityLabel(q) {
  if (!q) return null;
  const map = { hot: 'Hot', warm: 'Warm', cold: 'Cold' };
  return map[q.toLowerCase()] || null;
}

export function formatInterest(tag) {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isValidPhoneNumber(phone) {
  const value = String(phone || '').trim();
  if (!value || !/^\+?[\d\s().-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14;
}

export function isLikelyWhatsAppIdentifier(phone) {
  const value = String(phone || '').trim();
  const digits = value.replace(/\D/g, '');
  return /^\+?[\d\s().-]+$/.test(value) && digits.length > 14;
}

// What to show where a phone number would go. A real number is shown as is. Anything else (empty, a
// WhatsApp hidden-number ID, or something that is not a number) is shown as a quiet grey "Add number"
// prompt, never as a long meaningless string and never in red.
//   kind: 'valid' | 'missing' | 'hidden' | 'check'
export function getPhoneDisplay(phone) {
  const value = String(phone || '').trim();
  if (isValidPhoneNumber(value)) return { kind: 'valid', text: value, actionable: false };
  if (!value) return { kind: 'missing', text: 'Add number', actionable: true };
  if (isLikelyWhatsAppIdentifier(value)) return { kind: 'hidden', text: 'Add number', actionable: true, hint: 'WhatsApp is hiding this contact\u2019s number. You can still chat; add the number to call or add them to lists.' };
  return { kind: 'check', text: 'Check number', actionable: true, hint: `"${value}" does not look like a phone number.` };
}

const PLACEHOLDER_NAMES = ['voce', 'you', 'unknown', 'unknown contact', 'whatsapp user/no name', 'whatsapp user', 'no name'];

function cleanName(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return PLACEHOLDER_NAMES.includes(normalized) ? '' : text;
}

// Best human label for a lead, in this order: saved name, then an alias (social username, WhatsApp
// business/push name), then the phone number, and only then a plain "Unnamed lead".
// `extra` is optional: { social_username, alias, wa_business_profile }.
export function getLeadDisplayName(name, phone, extra = {}) {
  const direct = cleanName(name);
  if (direct) return direct;

  const profile = extra?.wa_business_profile && typeof extra.wa_business_profile === 'object' ? extra.wa_business_profile : {};
  const alias = cleanName(extra?.alias)
    || cleanName(extra?.social_username)
    || cleanName(profile.name || profile.verifiedName || profile.pushName || profile.push_name);
  if (alias) return alias;

  const number = String(phone || '').trim();
  if (isValidPhoneNumber(number)) return number;
  return 'Unnamed lead';
}

// "8 Aug 2026" in the viewer's own locale and timezone.
export function formatDate(iso, { withTime = false } = {}) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!withTime) return day;
  return `${day}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

// "Came in 8 Aug 2026 \u00b7 59d ago"
export function cameInLabel(lead) {
  const iso = lead?.created_at || lead?.added_date;
  if (!iso) return '';
  const ago = timeAgo(iso);
  return `${formatDate(iso)}${ago && ago !== 'now' ? ` \u00b7 ${ago} ago` : ''}`;
}

export function daysSince(iso) {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / 86400000);
}

// -- Who counts as a customer --
export const NON_CUSTOMER_TYPES = ['personal', 'vendor', 'staff', 'junk'];
export function isNonCustomer(lead) {
  return NON_CUSTOMER_TYPES.includes(lead?.lead_type) || lead?.is_business_chat === false;
}
export const NON_CUSTOMER_LABELS = { personal: 'Personal chat', vendor: 'Vendor / supplier', staff: 'Staff', junk: 'Junk / spam' };

// A lead "has a conversation" once at least one message from them has been stored.
export function hasConversation(lead) {
  return Boolean(lead?.last_inbound_at);
}

// -- Temperature: the one honest definition of hot / warm / cold --
// Hot means ALL of: analysed by the AI, intent score 70+, they messaged you in the last 14 days, still an
// open lead (not won, lost or ghosted), and a real customer. Anything that was 70+ but has gone quiet is
// "Was hot", not hot. A lead that has not been analysed is never given a temperature at all.
export const HOT_MIN_SCORE = 70;
export const WARM_MIN_SCORE = 40;
export const HOT_MAX_QUIET_DAYS = 14;

export function getTemperature(lead) {
  if (!lead || isNonCustomer(lead)) return { key: 'na', label: '', reason: 'Not a customer chat.' };
  if (lead.lead_state === 'won') return { key: 'won', label: 'Won', reason: 'They bought.' };
  if (lead.lead_state === 'lost') return { key: 'lost', label: 'Lost', reason: 'Marked lost.' };
  const analysed = Boolean(lead.nlp_enriched_at);
  const score = lead.intent_score;
  if (!analysed || score === null || score === undefined) {
    return { key: 'unscored', label: 'Not analysed', reason: 'Not analysed yet, so there is no honest score.' };
  }
  const quietDays = daysSince(lead.last_inbound_at);
  const recent = quietDays !== null && quietDays <= HOT_MAX_QUIET_DAYS;
  if (score >= HOT_MIN_SCORE) {
    if (recent && lead.lead_state !== 'ghosted') {
      return { key: 'hot', label: 'Hot', reason: `Intent ${score}/100 and they messaged ${quietDays === 0 ? 'today' : `${quietDays}d ago`}.` };
    }
    return {
      key: 'warm',
      label: 'Was hot',
      reason: quietDays === null
        ? `Intent ${score}/100 but we have no message from them on record.`
        : `Intent ${score}/100 but quiet for ${quietDays} days.`,
    };
  }
  if (score >= WARM_MIN_SCORE) return { key: 'warm', label: 'Warm', reason: `Intent ${score}/100.` };
  return { key: 'cold', label: 'Cold', reason: `Intent ${score}/100.` };
}

export function isReallyHot(lead) {
  return getTemperature(lead).key === 'hot';
}

export function getWhatsAppSessionDisplayName(session) {
  return session?.label || session?.phone_number || session?.instance_name || 'WhatsApp connection';
}

// read_receipt -> glyph + color. Kept as text glyphs (not icons) since
// WhatsApp's own tick convention is instantly recognizable as text.
const READ_RECEIPT_MAP = {
  sent:      { glyph: '\u2713',   colorClass: 'text-slate-400', title: 'Sent' },
  delivered: { glyph: '\u2713\u2713', colorClass: 'text-slate-400', title: 'Delivered' },
  read:      { glyph: '\u2713\u2713', colorClass: 'text-blue-500',  title: 'Read' },
  replied:   { glyph: '\u21a9',   colorClass: 'text-[#28A745]', title: 'Replied' },
};

export function readReceiptIcon(status) {
  return READ_RECEIPT_MAP[status] || READ_RECEIPT_MAP.sent;
}

// intent_score (0-100) -> Tailwind color class for the intent bar / badge.
export function intentColor(score) {
  if (score === null || score === undefined) return 'bg-slate-300';
  if (score >= 75) return 'bg-[#28A745]';
  if (score >= 45) return 'bg-[#FF8C00]';
  return 'bg-red-500';
}

// Builds the small "what's next" label shown under a lead row for its
// follow-up status. Returns null when there's nothing worth showing.
export function getFollowupRowLabel(lead) {
  const fu = lead.followup;
  if (!fu || lead.lead_type === 'personal') return null;

  switch (fu.status) {
    case 'not_enrolled':
      if (lead.follow_up_count === 0 && lead.lead_state !== 'won') {
        return { icon: 'MessageCircle', text: 'Enroll in sequence', colorClass: 'text-slate-400', urgent: false };
      }
      return null;
    case 'consent_sent':
      return { icon: 'Clock', text: 'Awaiting consent', colorClass: 'text-slate-400', urgent: false };
    case 'opted_out':
      return { icon: 'X', text: 'Opted out', colorClass: 'text-slate-400', urgent: false };
    case 'completed':
      return { icon: 'CheckCircle2', text: 'Sequence complete', colorClass: 'text-[#28A745]', urgent: false };
    case 'opted_in':
      if (fu.pending_approval) {
        return { icon: 'Inbox', text: `Step ${fu.current_step} \u00b7 needs review`, colorClass: 'text-[#FF8C00]', urgent: true };
      }
      if (fu.next_due) {
        const overdue = new Date(fu.next_due) < new Date();
        return {
          icon: overdue ? 'AlertTriangle' : 'Clock',
          text: `Step ${fu.current_step} \u00b7 ${overdue ? 'overdue' : 'due ' + timeUntil(fu.next_due)}`,
          colorClass: overdue ? 'text-red-600' : 'text-slate-400',
          urgent: overdue,
        };
      }
      return { icon: 'CheckCircle2', text: `Step ${fu.current_step} active`, colorClass: 'text-[#28A745]', urgent: false };
    default:
      return null;
  }
}