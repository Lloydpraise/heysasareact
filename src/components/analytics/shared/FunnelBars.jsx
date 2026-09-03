import { comma } from '../../../utils/analyticsHelpers';

// Ported from analytics.js's funnelRows building in renderOverview() and
// the mini-funnel in _drawerAd(). `opacityScale` lets the ad drawer reuse
// this with its own 4-step opacity ramp instead of the 5-step default.
const DEFAULT_OPACITIES = [1, 0.8, 0.62, 0.46, 0.34];

export default function FunnelBars({ rows, showDrop = true, opacityScale = DEFAULT_OPACITIES }) {
  const top = rows[0]?.count || 0;

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row, i) => {
        const w = top ? Math.round((row.count / top) * 100) : 0;
        const drop = i > 0 && rows[i - 1].count ? Math.round((row.count / rows[i - 1].count) * 100) : 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 flex-shrink-0 truncate text-[11.5px] font-medium text-slate-600">{row.stage}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-50">
              <div
                className="flex h-full items-center rounded-md pl-2.5 text-[11px] font-bold text-white transition-all duration-700"
                style={{ width: `${w}%`, background: `rgba(59,109,17,${opacityScale[i] ?? 0.3})` }}
              >
                {comma(row.count)}
              </div>
            </div>
            <span className="w-9 flex-shrink-0 text-right text-[11px] font-semibold text-slate-400">{w}%</span>
            {showDrop && (i > 0 ? (
              <span className="w-11 flex-shrink-0 text-right text-[10.5px] font-semibold text-red-400">{'\u2193'}{100 - drop}%</span>
            ) : (
              <span className="w-11 flex-shrink-0" />
            ))}
          </div>
        );
      })}
    </div>
  );
}