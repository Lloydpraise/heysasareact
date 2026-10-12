import { ComposedChart, Bar, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import AnCard, { SectionLabel } from '../shared/AnCard';
import { periodRangeLabel } from '../../../utils/analyticsPeriods';

const GRAIN_TITLE = { hour: 'by hour', day: 'by day', week: 'by week' };

function ChartTooltip({ active, payload, period }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] shadow-lg">
      <div className="mb-1 font-semibold text-slate-800">{row.full}</div>
      <div className="text-slate-600">
        <span className="font-bold text-slate-900">{row.current ?? 0}</span> new {row.current === 1 ? 'lead' : 'leads'}
      </div>
      <div className="text-slate-400">{row.previous} {period.prevNoun}</div>
    </div>
  );
}

// New leads over the chosen period. The x axis follows the pills: hours for a day, days for a week, real
// date ranges (1-7 Oct) for a month. The faint line is the same stretch of the previous period.
export default function LeadVolumeCard({ chart, period }) {
  const total = chart.reduce((s, r) => s + (r.current || 0), 0);
  const hasAny = total > 0 || chart.some((r) => r.previous > 0);
  const dense = chart.length > 8;

  return (
    <AnCard>
      <SectionLabel>{`Lead volume · ${GRAIN_TITLE[period.grain]}`}</SectionLabel>
      <div className="-mt-2 mb-3 text-[11px] text-slate-400">{periodRangeLabel(period)}</div>
      {!hasAny ? (
        <div className="py-10 text-center text-[12.5px] text-slate-400">No new leads in this period yet.</div>
      ) : (
        <div style={{ width: '100%', height: 190 }}>
          <ResponsiveContainer>
            <ComposedChart data={chart} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
                axisLine={false}
                tickLine={false}
                interval={dense ? 2 : 0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--chart-cursor)' }} content={<ChartTooltip period={period} />} />
              <Bar dataKey="current" radius={[4, 4, 0, 0]} fill="var(--chart-green)" maxBarSize={32} />
              <Line type="monotone" dataKey="previous" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[var(--chart-green)]" />{period.noun}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0 w-3.5 border-t-2 border-dashed border-slate-400" />{period.prevNoun}</span>
      </div>
    </AnCard>
  );
}
