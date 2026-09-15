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
  stalled:  { label: 'Cold',     dotClass: 'bg-[#FF8C00]', textClass: 'text-[#FF8C00]' },
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

export function getLeadDisplayName(name, phone) {
  return String(name || '').trim() || String(phone || '').trim() || 'Unknown contact';
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