import { useState } from 'react';
import { Megaphone, Mic, Image as ImageIcon, MoreVertical, ThumbsUp } from 'lucide-react';
import {
  stateConfig,
  qualityLabel,
  formatInterest,
  readReceiptIcon,
  intentColor,
  timeAgo,
} from '../../../utils/leadHelpers';

function LeadRow({ lead, isActive, onClick, selectMode, selected, onToggleSelect, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sc = stateConfig(lead.lead_state);
  const ql = qualityLabel(lead.lead_quality);
  const rr = lead.read_receipt ? readReceiptIcon(lead.read_receipt) : null;
  const isPersonal = lead.lead_type === 'personal';
  const score = lead.intent_score;
  const isWon = lead.lead_state === 'won';

  const signals = [
    lead.sent_voice_note && { key: 'voice', Icon: Mic },
    lead.sent_media && { key: 'media', Icon: ImageIcon },
    lead.sent_reaction && { key: 'reaction', Icon: ThumbsUp },
  ].filter(Boolean);

  return (
    <div
      className={`relative w-full text-left flex gap-2 rounded-xl border-l-[3px] p-3 transition-colors ${
        isActive ? 'bg-[#28A745]/5' : 'hover:bg-slate-50'
      }`}
      style={{ borderLeftColor: sc.hex }}
    >
      {selectMode && (
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(lead.id)} onClick={(event) => event.stopPropagation()} className="mt-1 h-4 w-4 shrink-0 accent-[#28A745]" aria-label={`Select ${lead.name}`} />
      )}
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 gap-3 text-left">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
          isPersonal ? 'bg-slate-400' : 'bg-[#28A745]'
        }`}
      >
        {lead.name.charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-slate-900">{lead.name}</span>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {lead.unread_count > 0 ? (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#28A745] px-1 text-[10px] font-bold text-white">
                {lead.unread_count}
              </span>
            ) : rr ? (
              <span className={`text-[10px] font-semibold ${rr.colorClass}`} title={rr.title}>
                {rr.glyph}
              </span>
            ) : null}
            <span className="text-[9.5px] font-medium text-slate-400">{timeAgo(lead.last_seen)}</span>
          </div>
        </div>

        <div className="mt-0.5 truncate text-[11.5px] text-slate-500">
          {lead.context_summary || lead.customer_intent || lead.phone}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Tag className={isWon ? 'bg-[#28A745]/10 text-[#27500A]' : 'bg-slate-100 text-slate-600'}>{sc.label}</Tag>
          {ql === 'Hot' && <Tag className="bg-red-50 text-red-600">Hot</Tag>}
          {ql === 'Warm' && !isWon && <Tag className="bg-[#FF8C00]/10 text-[#FF8C00]">Warm</Tag>}
          {lead.is_ad_lead && (
            <Tag className="bg-slate-100 text-slate-600">
              <Megaphone size={9} className="inline -mt-px mr-0.5" /> Ad
            </Tag>
          )}
          {(lead.product_interests || []).slice(0, 1).map((p) => (
            <Tag key={p} className="bg-slate-100 text-slate-600">
              {formatInterest(p)}
            </Tag>
          ))}
          {signals.length > 0 && (
            <span className="flex items-center gap-0.5 text-slate-400">
              {signals.map(({ key, Icon }) => (
                <Icon key={key} size={11} />
              ))}
            </span>
          )}
        </div>

        {score !== null && score !== undefined && !isPersonal && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100" title={`Intent score: ${score}/100`}>
            <div className={`h-full rounded-full ${intentColor(score)}`} style={{ width: `${score}%` }} />
          </div>
        )}
      </div>
      </button>
      <div className="relative shrink-0">
        <button type="button" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label={`Actions for ${lead.name}`} title="Lead actions">
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            <button type="button" onClick={() => { setMenuOpen(false); onEdit?.(); }} className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Edit lead</button>
            <button type="button" onClick={() => { setMenuOpen(false); onDelete?.(); }} className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50">Delete lead</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ className, children }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

export { LeadRow };
export default LeadRow;
