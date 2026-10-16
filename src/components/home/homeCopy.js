// Plain words for Home (grade 6). The backend keeps its own names; owners see these.
export const HANDOFF_OPTIONS = [
  { id: 'asks_for_call', label: 'They ask for a call' },
  { id: 'ready_to_pay', label: 'They are ready to pay' },
  { id: 'asks_unknown_price', label: 'They ask for a price I have not set' },
  { id: 'angry_or_upset', label: 'They sound upset' },
  { id: 'asks_for_human', label: 'They ask for a real person' },
];

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DEFAULT_HOURS = { open: '08:00', close: '18:00', days: [1, 2, 3, 4, 5, 6] };

export const STEP_TEXT = {
  idle: 'Ready when you are.',
  waiting_history: 'Reading your WhatsApp chats...',
  running: 'Finding your real customers and who is ready to buy...',
};

// A short "what happened" line for the plain counters.
export const COUNTER_LABELS = [
  { key: 'chats', label: 'chats found' },
  { key: 'customers', label: 'real customers' },
  { key: 'ready_to_buy', label: 'ready to buy' },
  { key: 'products', label: 'products found' },
];

// Where the owner stopped answering the three setup questions: 0 hours, 1 hand-off, 2 products, 3 = all answered.
// Skipped questions are not saved, so they are asked again next time. That is on purpose: Home opens where they stopped.
export function firstOpenQuestion(answers = {}) {
  if (!answers.hours) return 0;
  if (!answers.handoff?.length) return 1;
  if (!answers.products_checked) return 2;
  return 3;
}

// The four steps of day one, as shown in the strip at the top of setup mode.
export const SETUP_STEPS = ['Connect WhatsApp', 'Sort your chats', 'A few questions', 'Switch on'];

export function openLead(leadId) {
  window.dispatchEvent(new CustomEvent('heysasa:open-lead', { detail: { leadId } }));
}
export function openPreferences(section) {
  window.dispatchEvent(new CustomEvent('heysasa:open-preferences', { detail: { section } }));
}
export function goToTab(tab) {
  window.dispatchEvent(new CustomEvent('heysasa:navigate', { detail: { tab } }));
}
