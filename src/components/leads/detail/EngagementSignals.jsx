import { Mic, Image, Smile } from 'lucide-react';
import { timeAgo, intentTone, unansweredCount } from '../../../utils/leadHelpers';

// The row of signal tiles right under "Let HeySasa do it": intent score (a coloured tile: hot red 70+, medium
// orange 40-69, cold blue below), last seen, last online, and how many of their messages are still waiting for a reply on
// WhatsApp. Purely presentational, reads straight off the lead.
const TILE_TONE = {
  hot: 'border-red-500 bg-red-500 text-white',
  medium: 'border-[#FF8C00] bg-[#FF8C00] text-white',
  cold: 'border-sky-500 bg-sky-500 text-white',
  none: 'border-slate-200 bg-white text-slate-800',
};

export default function EngagementSignals({ lead }) {
  const presenceStatus = String(lead.presence_status || '').toLowerCase();
  const score = lead.intent_score;
  const tone = intentTone(score);
  const hasScore = tone.key !== 'none';
  const unanswered = unansweredCount(lead);

  const tiles = [
    {
      key: 'last_seen',
      label: 'Last seen',
      value: lead.last_seen ? `${timeAgo(lead.last_seen)} ago` : '\u2014',
    },
    {
      key: 'online',
      label: 'Last online',
      value: ['online', 'available'].includes(presenceStatus)
        ? 'Online now'
        : lead.presence_updated_at
          ? `${timeAgo(lead.presence_updated_at)} ago`
          : lead.last_seen_online
            ? `${timeAgo(lead.last_seen_online)} ago`
            : 'Unknown',
    },
  ];

  const flags = [
    { key: 'voice', active: lead.sent_voice_note, Icon: Mic, label: 'Sent voice note' },
    { key: 'media', active: lead.sent_media, Icon: Image, label: 'Sent media' },
    { key: 'reaction', active: lead.sent_reaction, Icon: Smile, label: 'Sent reaction' },
  ].filter((f) => f.active);

  return (
    <div className="flex flex-wrap items-stretch gap-2 px-4 py-3 md:px-6">
      <div
        title={hasScore ? `${tone.label} intent (${Math.round(Number(score))}/100)` : 'Not scored yet'}
        className={`flex min-w-[110px] flex-1 flex-col gap-1 rounded-xl border px-3 py-2 ${TILE_TONE[tone.key]}`}
      >
        <span className={`text-[10.5px] font-medium uppercase tracking-wide ${hasScore ? 'text-white/80' : 'text-slate-400'}`}>Intent score</span>
        <span className="text-[13.5px] font-bold">{hasScore ? Math.round(Number(score)) : '\u2014'}</span>
      </div>

      {tiles.map((t) => (
        <div key={t.key} className="flex min-w-[110px] flex-1 flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{t.label}</span>
          <span className="text-[13.5px] font-bold text-slate-800">{t.value}</span>
        </div>
      ))}

      {unanswered > 0 && (
        <div className="flex min-w-[110px] flex-1 flex-col gap-1 rounded-xl border border-[#28A745]/30 bg-[#28A745]/10 px-3 py-2">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-[#218c3a]">Unanswered</span>
          <span className="text-[13.5px] font-bold text-[#218c3a]">{unanswered}</span>
        </div>
      )}

      {flags.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
          {flags.map(({ key, Icon, label }) => (
            <span key={key} title={label} className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F7FBF9] text-[#28A745]">
              <Icon size={13} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
