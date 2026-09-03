export const PLAYGROUND_SECTIONS = [
  { id: 'test', label: 'Test & Tune' },
  { id: 'replay', label: 'Replay' },
  { id: 'history', label: 'Version History' },
];

// One-click scenarios covering the non-linear cases that actually broke
// the old bot — vague pricing, negotiation, frustration, language switches,
// out-of-stock pivots. Each is a short exchange, not just one message, so
// the model has to actually hold a thread rather than answer in isolation.
export const STRESS_TEST_SCENARIOS = [
  {
    id: 'vague_price',
    label: 'Vague price ask',
    messages: ['how much?'],
  },
  {
    id: 'negotiation',
    label: 'Price negotiation',
    messages: ['nice bag. price?', "that's too much, last price?"],
  },
  {
    id: 'frustrated',
    label: 'Frustrated customer',
    messages: ['I messaged yesterday and nobody replied, this is annoying'],
  },
  {
    id: 'non_linear_switch',
    label: 'Topic switch mid-flow',
    messages: ['do you have the black sandals in 42?', 'actually wait, do you deliver to Kisumu?', 'ok back to the sandals, is 42 available'],
  },
  {
    id: 'sheng_switch',
    label: 'Sheng / code-switch',
    messages: ['niaje, mko na hizo viatu za red bado?'],
  },
  {
    id: 'wholesale',
    label: 'Wholesale inquiry',
    messages: ['do you do bulk orders for a shop?'],
  },
  {
    id: 'out_of_stock_pivot',
    label: 'Out-of-stock pivot',
    messages: ['is the blue one in size 40 available?'],
  },
];