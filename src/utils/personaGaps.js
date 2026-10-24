// Mirror of the backend's PACK_GAPS (src/personaPack.js): the persona fields the AI leans on most. Used only when the
// backend does not send `gaps`, so the persona screen can still ask the owner about empty fields.
export const PERSONA_GAPS = [
  { key: 'tone', question: 'How do you talk to customers? (e.g. warm and casual, short and formal, a mix of English and Swahili)', path: ['persona', 'voice_tone'] },
  { key: 'greeting', question: 'How do you usually greet a new customer?', path: ['persona', 'typical_greeting'] },
  { key: 'products', question: 'What do you sell, in a sentence or two?', path: ['business_context', 'core_offer'] },
  { key: 'customers', question: 'Who usually buys from you?', path: ['business_context', 'target_customer'] },
  { key: 'pricing', question: 'How do customers pay, and what do your main items cost?', path: ['business_context', 'payment_methods'] },
  { key: 'delivery', question: 'How does delivery or pick-up work, and what does it cost?', path: ['business_context', 'delivery_info'] },
  { key: 'faqs', question: 'What do customers often hesitate about (price, trust, timing), and how do you answer?', path: ['objection_playbook'] },
  { key: 'handoff', question: 'When should HeySasa stop and call you in?', path: ['human_handoff_triggers'] },
];

const isEmpty = (v) => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length)
  || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
const dig = (obj, path) => path.reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);

export function computePersonaGaps(pack) {
  return PERSONA_GAPS.filter((gap) => isEmpty(dig(pack || {}, gap.path))).map(({ key, question }) => ({ key, question }));
}
