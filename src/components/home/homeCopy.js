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

export function openPreferences(section) {
  window.dispatchEvent(new CustomEvent('heysasa:open-preferences', { detail: { section } }));
}
export function goToTab(tab) {
  window.dispatchEvent(new CustomEvent('heysasa:navigate', { detail: { tab } }));
}
