import { timeAgo } from '../../../utils/leadHelpers';
import InfoTooltip from './InfoTooltip';

// Replaces analytics.js's .an-card CSS class. `label` + `info` render the
// small section header row (with an optional InfoTooltip passed as
// children of a separate SectionLabel — kept as a sibling here so cards
// without a label can still just wrap raw content).
//
// `cacheUpdatedAt`: pass this on any card whose data comes from
// business_analytics_cache (topQuestions/objections/competitorMentions/
// sentimentTrend). If the value isn't present yet (see mockAnalytics.js's
// note — the live service doesn't return it yet), the badge just doesn't
// render, so this degrades gracefully until that field is added upstream.
export default function AnCard({ children, onClick, cacheUpdatedAt, className = '' }) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`rounded-[14px] border border-slate-200 bg-white p-5 ${
        clickable ? 'cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : ''
      } ${className}`}
    >
      {children}
      {cacheUpdatedAt && (
        <div className="mt-3 text-[10px] font-medium text-slate-300">Updated {timeAgo(cacheUpdatedAt)} ago</div>
      )}
    </div>
  );
}

export function SectionLabel({ children, info }) {
  return (
    <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
      {children}
      {info && <InfoTooltip text={info} />}
    </div>
  );
}