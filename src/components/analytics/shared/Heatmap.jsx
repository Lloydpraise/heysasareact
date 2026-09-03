import { Fragment } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function cellColor(v, max) {
  if (!v) return '#f8fafc';
  const t = v / max;
  if (t < 0.2) return 'rgba(40,167,69,0.15)';
  if (t < 0.4) return 'rgba(40,167,69,0.35)';
  if (t < 0.65) return 'rgba(40,167,69,0.58)';
  if (t < 0.85) return 'rgba(40,167,69,0.78)';
  return '#228a3a';
}

// 7x24 activity heatmap, ported from analytics.js's renderTiming() grid +
// hmColor(). `grid` is a 7-row (Mon..Sun) x 24-col (hour) array of counts.
export default function Heatmap({ grid }) {
  const max = Math.max(...grid.flat(), 1);

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: '32px repeat(24, 14px)' }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center text-[8.5px] font-semibold text-slate-300">
              {h % 4 === 0 ? `${h}h` : ''}
            </div>
          ))}
          {grid.map((row, di) => (
            <Fragment key={di}>
              <div className="flex items-center text-[9.5px] font-semibold text-slate-400">{DAYS[di]}</div>
              {row.map((v, hi) => (
                <div key={hi} title={`${v} messages`} className="h-3.5 w-3.5 rounded-sm" style={{ background: cellColor(v, max) }} />
              ))}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
        <span>Quiet</span>
        {['#f8fafc', 'rgba(40,167,69,0.15)', 'rgba(40,167,69,0.35)', 'rgba(40,167,69,0.58)', '#228a3a'].map((c, i) => (
          <span key={i} className="h-2.5 w-3.5 rounded-sm" style={{ background: c }} />
        ))}
        <span>Busy</span>
      </div>
    </div>
  );
}