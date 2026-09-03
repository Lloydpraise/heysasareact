import { Mic, Image, Smile, Circle } from 'lucide-react';
import { timeAgo, intentColor } from '../../../utils/leadHelpers';

// Small strip of engagement "signal tiles" — intent score, last seen, and
// behavioral flags (voice note / media / reaction sent). Purely
// presentational, reads straight off the lead object.
export default function EngagementSignals({ lead }) {
  const presenceStatus = String(lead.presence_status || '').toLowerCase();
  const tiles = [
    {
      key: 'intent',
      label: 'Intent score',
      value: lead.intent_score != null ? `${lead.intent_score}` : '\u2014',
      barClass: lead.intent_score != null ? intentColor(lead.intent_score) : 'bg-slate-200',
    },
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
    <div className="flex flex-wrap items-stretch gap-2 px-6 py-3">
      {tiles.map((t) => (
        <div
          key={t.key}
          className="flex min-w-[110px] flex-1 flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2"
        >
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{t.label}</span>
          <div className="flex items-center gap-1.5">
            {t.barClass && <span className={`h-1.5 w-1.5 rounded-full ${t.barClass}`} />}
            <span className="text-[13.5px] font-bold text-slate-800">{t.value}</span>
          </div>
        </div>
      ))}

      {flags.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
          {flags.map(({ key, Icon, label }) => (
            <span
              key={key}
              title={label}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F7FBF9] text-[#28A745]"
            >
              <Icon size={13} />
            </span>
          ))}
        </div>
      )}

      {lead.unread_count > 0 && (
        <div className="flex items-center gap-1.5 rounded-xl border border-[#FF8C00]/30 bg-[#FFF7ED] px-3 py-2">
          <Circle size={7} className="fill-[#FF8C00] text-[#FF8C00]" />
          <span className="text-[12px] font-semibold text-[#FF8C00]">{lead.unread_count} unread</span>
        </div>
      )}
    </div>
  );
}