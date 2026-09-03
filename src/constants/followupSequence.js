// Follow-up sequence template (11 steps) — ported from leads.js DEFAULT_SEQUENCE.
// This is business config, not UI state — safe to import anywhere read-only.

export const DEFAULT_SEQUENCE = [
  { step: 1,  name: 'First Impression',    type: 'product_reminder',    klt: 'Know',    delay_days: 1, desc: 'Reference exactly what they were interested in.' },
  { step: 2,  name: 'Social Proof',        type: 'social_proof',        klt: 'Know',    delay_days: 2, desc: 'Share a real customer story or testimonial.' },
  { step: 3,  name: 'Free Value',          type: 'value_tip',           klt: 'Like',    delay_days: 2, desc: 'Give one genuinely useful tip. No pitch.' },
  { step: 4,  name: 'Expert Insight',      type: 'expert_authority',    klt: 'Like',    delay_days: 3, desc: 'Position the business as the go-to expert.' },
  { step: 5,  name: 'Personalised Offer',  type: 'offer',               klt: 'Like',    delay_days: 3, desc: 'A specific offer tied to their interest.' },
  { step: 6,  name: 'New Angle',           type: 'new_angle',           klt: 'Trust',   delay_days: 3, desc: 'Approach their need from a different angle.' },
  { step: 7,  name: 'Deep Expertise',      type: 'proprietary_content', klt: 'Trust',   delay_days: 4, desc: 'Share business knowledge from the owner.' },
  { step: 8,  name: 'FOMO',                type: 'fomo',                klt: 'Trust',   delay_days: 4, desc: 'Social proof + availability signal.' },
  { step: 9,  name: 'Check In',            type: 'soft_checkin',        klt: 'Trust',   delay_days: 5, desc: 'A warm human check-in. No pitch.' },
  { step: 10, name: 'Final Offer',         type: 'final_offer',         klt: 'Convert', delay_days: 3, desc: 'Best offer. Last one.' },
  { step: 11, name: 'See You Around',      type: 'graceful_exit',       klt: 'Convert', delay_days: 4, desc: 'Warm goodbye. Door always open.' },
];

// KLT stage -> color mapped onto the app's own palette (green/orange system)
// instead of leads.js's original neutral grays, per your call to unify the look.
export const KLT_CONFIG = {
  Know:    { text: 'text-slate-600',  bg: 'bg-slate-100'  },
  Like:    { text: 'text-[#0F172A]',  bg: 'bg-slate-200/60' },
  Trust:   { text: 'text-[#27500A]',  bg: 'bg-[#28A745]/10' }, // brand green, low emphasis
  Convert: { text: 'text-[#27500A]',  bg: 'bg-[#28A745]/15' }, // brand green, high emphasis (closest to a sale)
};

// touchpoint 'type' -> lucide-react icon name, replacing TOUCHPOINT_ICONS' hand-drawn SVGs.
// Import the matching icon component from 'lucide-react' where this is used.
export const TOUCHPOINT_ICON_NAME = {
  product_reminder:    'Clock3',
  social_proof:        'Star',
  value_tip:           'Lightbulb',
  expert_authority:    'BadgeCheck',
  offer:               'Gift',
  new_angle:           'Shuffle',
  proprietary_content: 'BookOpen',
  fomo:                'Flame',
  soft_checkin:        'HeartHandshake',
  final_offer:         'CheckCircle2',
  graceful_exit:       'DoorOpen',
};

export function getCumulativeDays(stepIndex) {
  return DEFAULT_SEQUENCE.slice(0, stepIndex + 1).reduce((sum, s) => sum + s.delay_days, 0);
}