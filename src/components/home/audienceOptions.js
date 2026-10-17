// The three groups the owner can pick, and how a tap changes the list. Pure, so it needs no screen to test.

export const AUDIENCE_OPTIONS = [
  { id: 'ads', label: 'Leads from my ads', plain: 'People who messaged you after seeing one of your ads.' },
  { id: 'hot', label: 'Leads ready to buy', plain: 'People HeySasa sees are close to buying (the Hot tab).' },
  { id: 'all', label: 'All my business leads', plain: 'Everyone who writes to you about your business.' },
];

// Pure, so it can be tested without a screen. Returns the new list after the owner taps one option.
export function toggleAudience(current = [], id) {
  if (id === 'all') return current.includes('all') ? current : ['all'];
  const without = current.filter((x) => x !== 'all' && x !== id);
  const next = current.includes(id) ? without : [...without, id];
  return next.length ? next : current;   // never leave it empty
}
