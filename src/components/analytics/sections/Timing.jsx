import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import KpiTile from '../shared/KpiTile';
import AnCard, { SectionLabel } from '../shared/AnCard';
import HBarList from '../shared/HBarList';
import InsightNote from '../shared/InsightNote';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, index) => {
  const hour = (index + 6) % 24;
  return {
    hour,
    label: new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' }),
  };
});

// Ported from analytics.js's renderTiming().
export default function Timing() {
  const { data } = useAnalyticsContext();
  const [view, setView] = useState('weekly');
  const [selectedDay, setSelectedDay] = useState('Sun');
  if (!data) return null;

  const dist = data.leadResponseDist || [];
  const activityGrid = data.activityByDay || [];
  const weeklyActivity = DAYS.map((day, dayIndex) => {
    const rowIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const messages = (activityGrid[rowIndex] || []).reduce((sum, count) => sum + Number(count || 0), 0);
    return { label: day, messages };
  });
  const selectedDayIndex = DAYS.indexOf(selectedDay);
  const selectedRowIndex = selectedDayIndex === 0 ? 6 : selectedDayIndex - 1;
  const dailyActivity = HOURS.map(({ hour, label }) => ({
    label,
    messages: Number(activityGrid[selectedRowIndex]?.[hour] || 0),
  }));
  const hasActivity = weeklyActivity.some(({ messages }) => messages > 0);
  const hasPeakIntent = data.intentPeakHour !== null && Boolean(data.intentPeakDay);
  const peakIntentLabel = hasPeakIntent ? `${data.intentPeakHour}:00` : 'No peak detected yet';
  const peakIntentSub = hasPeakIntent ? `${data.intentPeakDay} \u2014 highest purchase signals` : 'Waiting for high-intent activity';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiTile
          tone="green"
          label="Peak buying intent"
          value={peakIntentLabel}
          valueClassName={hasPeakIntent ? 'text-[32px]' : 'text-[18px]'}
          sub={peakIntentSub}
        />
        <KpiTile tone="blue" label="Fastest lead response" value={dist[0]?.count ?? 0} sub="replied in under 2 minutes" />
        <KpiTile tone="amber" label="Slow to respond" value={dist[dist.length - 1]?.count ?? 0} sub="took 6+ hours to reply" />
      </div>

      {activityGrid.length > 0 && (
        <AnCard>
          <SectionLabel info="See how many inbound messages arrive on each day or at each hour, based on the selected time view.">
            When leads message you
          </SectionLabel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Activity time view">
              {[
                { id: 'weekly', label: 'Weekly' },
                { id: 'daily', label: 'Daily' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  id={`activity-${id}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={view === id}
                  aria-controls="activity-chart-panel"
                  onClick={() => setView(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    view === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {view === 'daily' && (
              <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Select day">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    id={`activity-day-${day.toLowerCase()}-tab`}
                    type="button"
                    role="tab"
                    aria-selected={selectedDay === day}
                    aria-controls="activity-chart-panel"
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      selectedDay === day ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>
          {hasActivity ? (
            <div
              id="activity-chart-panel"
              role="tabpanel"
              aria-labelledby={view === 'weekly' ? 'activity-weekly-tab' : `activity-day-${selectedDay.toLowerCase()}-tab`}
              className="h-64 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  key={`${view}-${selectedDay}`}
                  data={view === 'weekly' ? weeklyActivity : dailyActivity}
                  margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={view === 'daily' ? 2 : 0}
                    tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={42}
                    tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Messages', angle: -90, position: 'insideLeft', fill: 'var(--chart-label)', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--chart-cursor)' }}
                    formatter={(value) => [value, 'Messages']}
                    labelFormatter={(label) => view === 'weekly' ? label : `${selectedDay}, ${label}`}
                    contentStyle={{ fontSize: 12, borderRadius: 8, background: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-tooltip-border)', color: 'var(--chart-tooltip-fg)' }}
                  />
                  <Bar
                    dataKey="messages"
                    fill="#28A745"
                    radius={[4, 4, 0, 0]}
                    animationDuration={650}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 text-center text-[12.5px] text-slate-400">No message activity recorded yet.</div>
          )}
          <InsightNote>
            {hasPeakIntent ? (
              <>Peak buying intent is at <strong>{data.intentPeakHour}:00 on {data.intentPeakDay}</strong>. Schedule your best
                follow-ups to arrive 30 min before this window.</>
            ) : (
              <>Peak buying intent will appear after enough high-intent activity has been recorded.</>
            )}
          </InsightNote>
        </AnCard>
      )}

      {dist.length > 0 && (
        <AnCard className="max-w-[520px]">
          <SectionLabel info="Lead response time distribution. Fast replies signal high intent. Segment your follow-up urgency by this.">
            How fast leads reply to you
          </SectionLabel>
          <HBarList rows={dist} colors={['var(--chart-green)']} labelKey="bucket" />
        </AnCard>
      )}
    </div>
  );
}