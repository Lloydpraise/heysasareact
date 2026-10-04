import { LayoutGrid, TrendingDown, Megaphone, Package, Clock, HeartPulse } from 'lucide-react';

// Tab list for the analytics top nav, ported from analytics.js's section
// switcher. Only 'market' has a real section component so far — see
// AnalyticsPage.jsx's SECTION_COMPONENTS map.
export const ANALYTICS_SECTIONS = [
  { id: 'overview', Icon: LayoutGrid, label: 'Overview', description: 'A quick look at your leads, replies, and sales.' },
  { id: 'market', Icon: TrendingDown, label: 'Market', description: 'See what customers ask about and what matters to them.' },
  { id: 'ads', Icon: Megaphone, label: 'Ad Impact', description: 'Find out which ads bring in leads and sales.' },
  { id: 'demand', Icon: Package, label: 'Demand', description: 'See which products and services leads want most.' },
  { id: 'timing', Icon: Clock, label: 'Timing', description: 'See when leads are most likely to message you.' },
  { id: 'health', Icon: HeartPulse, label: 'Health', description: 'Check how quickly and consistently your team replies.' },
];