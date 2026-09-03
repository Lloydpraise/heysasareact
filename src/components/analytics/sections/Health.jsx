import { Mic, Image as ImageIcon, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import { pct, comma } from '../../../utils/analyticsHelpers';
import KpiTile from '../shared/KpiTile';
import AnCard, { SectionLabel } from '../shared/AnCard';
import Donut from '../shared/Donut';
import DTable from '../shared/DTable';
import InsightNote from '../shared/InsightNote';

// Ported from analytics.js's renderHealth() + _drawerHealth().
export default function Health() {
  const { data, openDrawer } = useAnalyticsContext();
  if (!data) return null;

  const h = data.convHealth || {};
  const rr = data.readReceipts || { sent: 0, delivered: 0, read: 0, replied: 0 };
  const steps = data.followupStepConversion || [];
  const maxReplies = Math.max(...steps.map((s) => s.replies), 1);
  const closeBreakdown = data.humanVsAiClose || { ai: 0, human: 0 };
  const aiTotal = closeBreakdown.ai + closeBreakdown.human;
  const aiPct = pct(closeBreakdown.ai, aiTotal);
  const avgReplyTime = h.avg_reply_time_min === null || h.avg_reply_time_min === undefined ? 'No replies yet' : `${h.avg_reply_time_min}m`;
  const aiManaged = h.pct_ai_managed === null || h.pct_ai_managed === undefined ? 'Not tracked' : `${h.pct_ai_managed}%`;

  const flowSteps = [
    { label: 'Sent', count: rr.sent, color: '#94a3b8' },
    { label: 'Delivered', count: rr.delivered, color: '#3b82f6' },
    { label: 'Read', count: rr.read, color: '#f59e0b' },
    { label: 'Replied', count: rr.replied, color: '#22c55e' },
  ];
  const maxFlow = flowSteps[0].count || 1;

  const openHealthDrawer = () =>
    openDrawer(
      'Health breakdown',
      <>
        <DTable
          rows={[
            { label: 'Average reply time', value: h.avg_reply_time_min == null ? 'No replies yet' : `${h.avg_reply_time_min} min` },
            { label: 'Never replied rate', value: `${h.pct_never_replied}% of leads` },
            { label: 'Gone cold rate', value: `${h.pct_gone_cold}% of pipeline` },
            { label: 'Opt-outs', value: `${h.opt_out_count} leads` },
            { label: 'Delivery failures', value: `${data.deliveryFailures} messages` },
            { label: 'Consent acceptance', value: `${data.consentAcceptRate}%` },
          ]}
        />
        <div className="mt-5 rounded-lg bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-500">
          Maintaining reply times under 15 minutes significantly boosts conversion likelihood. Use AI auto-replies for
          off-hours to hold attention while you sleep.
        </div>
      </>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          tone={h.avg_reply_time_min != null && h.avg_reply_time_min <= 15 ? 'green' : 'amber'}
          label="Avg reply time"
          value={avgReplyTime}
          valueClassName={h.avg_reply_time_min == null ? 'text-[18px]' : 'text-[32px]'}
          sub="target: under 15 min"
          onClick={openHealthDrawer}
        />
        <KpiTile tone={h.open_unread === 0 ? 'green' : 'red'} label="Unread now" value={h.open_unread} sub="leads awaiting reply" />
        <KpiTile
          tone={h.pct_ai_managed >= 50 ? 'green' : 'amber'}
          label="AI handled"
          value={aiManaged}
          valueClassName={h.pct_ai_managed == null ? 'text-[18px]' : 'text-[32px]'}
          sub={h.pct_ai_managed == null ? 'AI attribution not connected' : 'fully resolved by AI'}
        />
        <KpiTile tone={h.pct_gone_cold <= 15 ? 'green' : 'amber'} label="Gone cold" value={`${h.pct_gone_cold}%`} sub="need follow-up now" />
      </div>

      <AnCard>
        <SectionLabel info="Track how many of your sent messages are delivered, read, and then replied to. Requires Evolution API read receipt data.">
          Message journey {'\u2014'} read receipts
        </SectionLabel>
        <div className="flex items-center gap-2">
          {flowSteps.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center gap-2">
              {i > 0 && <span className="flex-shrink-0 text-slate-300">&rsaquo;</span>}
              <div className="flex-1">
                <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct(s.count, maxFlow)}%`, background: s.color }} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] font-bold text-slate-900">{comma(s.count)}</span>
                  <span className="text-[10.5px] font-medium text-slate-400">{s.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.deliveryFailures > 0 && (
          <InsightNote tone="warn">
            {'\u26a0\ufe0f'} <strong>{data.deliveryFailures} messages</strong> failed to deliver {'\u2014'} wrong numbers, blocked
            contacts, or no data. Review these leads.
          </InsightNote>
        )}
      </AnCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnCard>
          <SectionLabel info="Replies triggered and conversions won per follow-up step. Find your highest-impact steps.">
            Follow-up step performance
          </SectionLabel>
          {steps.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-slate-400">No follow-up data yet.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {steps.map((s) => (
                <div key={s.step} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {s.step}
                  </span>
                  <span className="w-24 flex-shrink-0 truncate text-[11.5px] text-slate-600">{s.name}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-50">
                    <div
                      className="flex h-full items-center rounded pl-2 text-[10px] font-bold text-white transition-all duration-700"
                      style={{ width: `${pct(s.replies, maxReplies)}%`, background: '#3B6D11' }}
                    >
                      {s.replies}
                    </div>
                  </div>
                  <span className="w-9 flex-shrink-0 text-right text-[11px] font-bold text-[#28A745]">+{s.conversions}</span>
                </div>
              ))}
            </div>
          )}
        </AnCard>

        <div className="flex flex-col gap-4">
          <AnCard>
            <SectionLabel info="Conversion attribution — how many deals closed with AI only vs. human handoff.">
              AI vs human closes
            </SectionLabel>
            <div className="flex items-center gap-4">
              <Donut segments={[{ pct: aiPct, color: '#3B6D11' }, { pct: 100 - aiPct, color: '#f1f5f9' }]} size={80} thickness={14} />
              <div className="flex-1">
                <div className="mb-1.5 flex gap-2">
                  <Pill className="bg-[#28A745]/10 text-[#27500A]">AI: {closeBreakdown.ai}</Pill>
                  <Pill className="bg-slate-100 text-slate-600">Human: {closeBreakdown.human}</Pill>
                </div>
                <div className="text-[11.5px] leading-relaxed text-slate-500">{aiPct}% of conversions handled entirely by AI.</div>
              </div>
            </div>
          </AnCard>

          <AnCard>
            <SectionLabel>WhatsApp engagement signals</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              <Signal icon={<Mic size={16} />} num={data.voiceNoteLeads} label="Voice notes" />
              <Signal icon={<ImageIcon size={16} />} num={data.mediaLeads} label="Media" />
              <Signal icon={<ThumbsUp size={16} />} num={data.reactionCount} label="Reactions" />
              <Signal icon={<CheckCircle2 size={16} />} num={`${data.consentAcceptRate}%`} label="Consent rate" />
            </div>
          </AnCard>
        </div>
      </div>
    </div>
  );
}

function Signal({ icon, num, label }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-2.5 text-center">
      <span className="text-slate-400">{icon}</span>
      <span className="text-[13px] font-bold text-slate-900">{num}</span>
      <span className="text-[9px] font-medium text-slate-400">{label}</span>
    </div>
  );
}

function Pill({ className, children }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${className}`}>{children}</span>;
}