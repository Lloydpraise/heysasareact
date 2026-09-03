// listsCampaigns/constants.js
import { Flame, Snowflake, ShoppingCart, Star, Ban } from 'lucide-react';

// ---------- Status & color tokens ----------
export const LEAD_STATUS = {
  READY: 'ready',
  IN_CAMPAIGN: 'in_campaign',
  OPTED_OUT: 'opted_out',
};

export const STATUS_COLORS = {
  [LEAD_STATUS.READY]: '#28A745',       // brand green — reused, not a new token
  [LEAD_STATUS.IN_CAMPAIGN]: '#F5A623', // amber
  [LEAD_STATUS.OPTED_OUT]: '#E5484D',   // red
};

export const AUTO_BADGE_COLOR = '#28A745'; // brand green — shared with analytics and campaign actions

// ---------- Module A: Automation Rules ----------
// Each rule carries a declarative factors schema so RuleConfigureDrawer renders
// generically — add a rule or a factor here, no new components needed.
export const AUTOMATION_RULES = [
  {
    id: 'hot_inquiries',
    name: 'Hot Inquiries',
    icon: Flame,
    description: 'Groups leads who clicked ads or asked for pricing recently.',
    factors: [
      { key: 'window_days', label: 'Inquiry window', type: 'number', unit: 'days', default: 7 },
      { key: 'require_price_request', label: 'Must have asked for price', type: 'boolean', default: true },
    ],
  },
  {
    id: 'cold_dormant',
    name: 'Cold / Dormant Leads',
    icon: Snowflake,
    description: 'Groups leads whose last incoming message passed the inactivity window.',
    factors: [
      { key: 'inactivity_days', label: 'No reply for', type: 'number', unit: 'days', default: 14 },
    ],
  },
  {
    id: 'cart_abandoners',
    name: 'Cart Abandoners / Pending Payment',
    icon: ShoppingCart,
    description: 'Groups leads sent payment info who haven\u2019t completed a purchase.',
    factors: [
      { key: 'no_purchase_window_days', label: 'No purchase within', type: 'number', unit: 'days', default: 3 },
    ],
  },
  {
    id: 'post_purchase',
    name: 'Post-Purchase / Repeat Buyers',
    icon: Star,
    description: 'Groups contacts with verified successful purchases.',
    factors: [
      { key: 'min_purchases', label: 'Minimum purchases', type: 'number', unit: 'orders', default: 1 },
    ],
  },
  {
    id: 'low_intent',
    name: 'Low Intent / Unqualified',
    icon: Ban,
    description: 'Groups contacts flagged as wrong fit or non-responsive.',
    factors: [
      { key: 'flag_source', label: 'Flagged by', type: 'select', options: ['agent', 'ai', 'both'], default: 'both' },
    ],
  },
];

export const RULE_GRACE_PERIOD_DAYS = 30;

export const MOCK_LISTS = [
  {
    id: 'hot-inquiries',
    name: 'Hot Inquiries',
    type: 'auto',
    archived: false,
    totalContacts: 42,
    estPipelineValue: 186000,
    breakdown: { ready: 31, in_campaign: 8, opted_out: 3 },
  },
  {
    id: 'manual-vip',
    name: 'VIP Follow-up',
    type: 'manual',
    archived: false,
    totalContacts: 18,
    estPipelineValue: 92000,
    breakdown: { ready: 13, in_campaign: 4, opted_out: 1 },
  },
];

export const MOCK_CAMPAIGNS = [
  {
    id: 'cold-reactivation-demo',
    name: 'Cold Lead Reactivation',
    status: 'active',
    listName: 'Hot Inquiries',
    sequenceMode: 'conditional',
    gateway: 'Baileys',
    dailyCap: 100,
    sentToday: 58,
    enrolled: 42,
    sent: 27,
    responseRate: 24,
    repliesCount: 10,
    revenue: 68000,
    steps: [],
  },
];

// ---------- Module C: Campaign Runner ----------
export const SEQUENCE_MODE = { LINEAR: 'linear', CONDITIONAL: 'conditional' };
export const SEQUENCE_TYPE = {
  BROADCAST: 'broadcast',
  EDUCATIONAL: 'educational',
};

export const EDUCATIONAL_FREQUENCY = [
  { value: 'daily', label: 'Daily', minGapHours: 24 },
  { value: 'weekly', label: 'Weekly', minGapHours: 168 },
  { value: 'biweekly', label: 'Bi-weekly', minGapHours: 336 },
];

export const BROADCAST_GAP_OPTIONS = [
  { value: 4, label: '4 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '1 day' },
  { value: 48, label: '2 days' },
  { value: 72, label: '3 days' },
];

export const MERGE_FIELDS = [
  { key: 'first_name', label: 'First name' },
  { key: 'product_interest', label: 'Product interest' },
  { key: 'price', label: 'Price' },
];

export const CAMPAIGN_TEMPLATES = [
  {
    id: 'cold_reactivation',
    name: '14-Day Cold Lead Reactivation',
    meta: '3 Steps \u00b7 Conditional \u00b7 Dormant Inquiries',
    sequenceMode: SEQUENCE_MODE.CONDITIONAL,
    steps: [
      { content: 'Hi {{first_name}}, we noticed you were interested in {{product_interest}} a while back \u2014 still on the hunt?', delayHours: 0 },
      { content: 'Here\u2019s a quick update on {{product_interest}}: {{price}}. Want more details?', delayHours: 48 },
      { content: 'Last check-in \u2014 this offer on {{product_interest}} closes soon.', delayHours: 96 },
    ],
  },
  {
    id: 'flash_sale',
    name: 'Price Drop / Flash Sale Urgency',
    meta: '2 Steps \u00b7 Linear \u00b7 Price-sensitive leads',
    sequenceMode: SEQUENCE_MODE.LINEAR,
    steps: [
      { content: '{{first_name}}, price on {{product_interest}} just dropped to {{price}}. Free delivery today.', delayHours: 0 },
      { content: 'This price on {{product_interest}} ends tonight \u2014 want us to hold one for you?', delayHours: 24 },
    ],
  },
  {
    id: 'post_purchase',
    name: 'Post-Purchase Review & Cross-Sell',
    meta: '3 Steps \u00b7 Linear \u00b7 Past buyers',
    sequenceMode: SEQUENCE_MODE.LINEAR,
    steps: [
      { content: 'Hi {{first_name}}, how are you enjoying your {{product_interest}}?', delayHours: 72 },
      { content: 'Mind leaving us a quick review? It really helps.', delayHours: 24 },
      { content: 'Since you liked {{product_interest}}, thought you\u2019d want a look at what\u2019s new.', delayHours: 168 },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Blank Sequence',
    meta: 'Start from scratch',
    sequenceMode: SEQUENCE_MODE.LINEAR,
    steps: [{ content: '', delayHours: 0 }],
  },
];