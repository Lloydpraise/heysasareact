import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import KpiTile from '../shared/KpiTile';
import AnCard, { SectionLabel } from '../shared/AnCard';
import HBarList from '../shared/HBarList';
import Heatmap from '../shared/Heatmap';
import InsightNote from '../shared/InsightNote';

// Ported from analytics.js's renderTiming().
export default function Timing() {
  const { data } = useAnalyticsContext();
  if (!data) return null;

  const dist = data.leadResponseDist || [];
  const heatmap = data.heatmap;
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

      {heatmap && (
        <AnCard>
          <SectionLabel info="Darker = more messages. Use this to schedule your follow-ups and AI sending windows.">
            Activity heatmap
          </SectionLabel>
          <Heatmap grid={heatmap} />
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
          <HBarList rows={dist} colors={['#3B6D11']} labelKey="bucket" />
        </AnCard>
      )}
    </div>
  );
}