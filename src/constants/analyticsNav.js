import { LayoutGrid, TrendingDown, Megaphone, Package, Clock, HeartPulse } from 'lucide-react';

// Tab list for the analytics top nav, ported from analytics.js's section
// switcher. Only 'market' has a real section component so far — see
// AnalyticsPage.jsx's SECTION_COMPONENTS map.
export const ANALYTICS_SECTIONS = [
  { id: 'overview', Icon: LayoutGrid, label: 'Overview' },
  { id: 'market', Icon: TrendingDown, label: 'Market' },
  { id: 'ads', Icon: Megaphone, label: 'Ad Impact' },
  { id: 'demand', Icon: Package, label: 'Demand' },
  { id: 'timing', Icon: Clock, label: 'Timing' },
  { id: 'health', Icon: HeartPulse, label: 'Health' },
];