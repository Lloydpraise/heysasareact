import { useState } from 'react';
import { Megaphone, Mic, Image as ImageIcon, MoreVertical, Pencil, ThumbsUp, Trash2, User } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';
import BottomSheet, { SheetRow } from '../../mobile/BottomSheet';
import {
  stateConfig,
  formatInterest,
  readReceiptIcon,
  intentColor,
  timeAgo,
  formatDate,
  getLeadDisplayName,
  getPhoneDisplay,
  getTemperature,
  isNonCustomer,
  NON_CUSTOMER_LABELS,
} from '../../../utils/leadHelpers';

function LeadRow({ lead, isActive, onClick, selectMode, selected, onToggleSelect, onEdit, onMarkPersonal, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const sc = stateConfig(lead.lead_state);
  const temperature = getTemperature(lead);
  const rr = lead.read_receipt ? readReceiptIcon(lead.read_receipt) : null;
  const isPersonal = isNonCustomer(lead);
  const score = temperature.key === 'hot' || temperature.key === 'warm' || temperature.key === 'cold' ? lead.intent_score : null;
  const isWon = lead.lead_state === 'won';
  const displayName = getLeadDisplayName(lead.name, lead.phone, lead);
  const phone = getPhoneDisplay(lead.phone);
  const cameIn = lead.created_at || lead.added_date;

  const signals = [
    lead.sent_voice_note && { key: 'voice', Icon: Mic },
    lead.sent_media && { key: 'media', Icon: ImageIcon },
    lead.sent_reaction && { key: 'reaction', Icon: ThumbsUp },
  ].filter(Boolean);

  return (
    <div
      className={`relative w-full text-left flex gap-2 rounded-xl border-l-[3px] dark:border-slate-300 p-3 transition-colors max-md:gap-1 max-md:rounded-2xl max-md:border max-md:border-slate-200/70 max-md:bg-white max-md:p-3.5 max-md:shadow-sm ${
        isActive && !isMobile ? 'bg-[#28A745]/5' : 'hover:bg-slate-50'
      }`}
      style={{ borderLeftColor: sc.hex, ...(isMobile ? { borderLeftWidth: 4 } : null) }}
    >
      {selectMode && (
         <input type="checkbox" checked={selected} onChange={() => onToggleSelect(lead.id)} onClick={(event) => event.stopPropagation()} className="mt-1 h-4 w-4 shrink-0 accent-[#28A745] max-md:mt-3 max-md:h-6 max-md:w-6" aria-label={`Select ${displayName}`} />
      )}
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 gap-3 text-left">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white max-md:h-11 max-md:w-11 max-md:text-base ${
          isPersonal ? 'bg-slate-400' : 'bg-[#28A745]'
        }`}
      >
        {displayName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-slate-900 max-md:text-[15.5px]">{displayName}</span>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {lead.unread_count > 0 ? (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#28A745] px-1 text-[10px] font-bold text-white max-md:h-5 max-md:min-w-[20px] max-md:text-[11.5px]">
                {lead.unread_count}
              </span>
            ) : rr ? (
              <span className={`text-[10px] font-semibold ${rr.colorClass}`} title={rr.title}>
                {rr.glyph}
              </span>
            ) : null}
            <span className="text-[9.5px] font-medium text-slate-400 max-md:text-[12px]" title={lead.last_inbound_at ? `They last wrote ${formatDate(lead.last_inbound_at)}` : 'No message from them yet'}>{lead.last_inbound_at ? timeAgo(lead.last_inbound_at) : ''}</span>
          </div>
        </div>

        <div className="mt-0.5 truncate text-[11.5px] text-slate-500 max-md:mt-1 max-md:text-[13.5px]">
          {lead.context_summary || lead.customer_intent || (lead.last_inbound_at ? 'Not analysed yet' : (phone.kind === 'valid' ? phone.text : 'No messages yet'))}
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-400 max-md:text-[12px]">
          {phone.kind === 'valid' ? <span>{phone.text}</span> : (
            <span
              role="button"
              tabIndex={0}
              title={phone.hint || 'Add a phone number to call or add this lead to lists'}
              onClick={(event) => { event.stopPropagation(); onEdit?.(); }}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); onEdit?.(); } }}
              className="cursor-pointer rounded px-1 font-medium text-slate-400 underline decoration-dotted underline-offset-2 hover:bg-slate-100 hover:text-slate-600"
            >
              {phone.text}
            </span>
          )}
          {cameIn && <><span className="text-slate-300">·</span><span title={`Came in ${formatDate(cameIn)}`}>Came in {formatDate(cameIn)}</span></>}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1 max-md:mt-2 max-md:gap-1.5">
          {!isPersonal && <Tag className={isWon ? 'bg-[#28A745]/10 text-[#27500A]' : 'bg-slate-100 text-slate-600'}>{sc.label}</Tag>}
          {isPersonal && NON_CUSTOMER_LABELS[lead.lead_type] && <Tag className="bg-slate-100 text-slate-500">{NON_CUSTOMER_LABELS[lead.lead_type]}</Tag>}
          {temperature.key === 'hot' && <span title={temperature.reason}><Tag className="bg-red-50 text-red-600">Hot</Tag></span>}
          {temperature.key === 'warm' && !isWon && <span title={temperature.reason}><Tag className="bg-[#FF8C00]/10 text-[#FF8C00]">{temperature.label}</Tag></span>}
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
        <button type="button" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 max-md:-mr-1 max-md:h-11 max-md:w-11 max-md:rounded-full" aria-label={`Actions for ${displayName}`} title="Lead actions">
          <MoreVertical size={16} />
        </button>
        {menuOpen && !isMobile && (
          <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            {!isPersonal && <button type="button" onClick={() => { setMenuOpen(false); onMarkPersonal?.(); }} className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Personal</button>}
            <button type="button" onClick={() => { setMenuOpen(false); onEdit?.(); }} className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Edit lead</button>
            <button type="button" onClick={() => { setMenuOpen(false); onDelete?.(); }} className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold text-red-600 hover:bg-red-50">Delete lead</button>
          </div>
        )}
        {isMobile && (
          <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={displayName}>
            <div className="flex flex-col gap-0.5">
              {!isPersonal && <SheetRow icon={User} label="Mark as personal" hint="Hide from follow-ups and analysis" onClick={() => { setMenuOpen(false); onMarkPersonal?.(); }} />}
              <SheetRow icon={Pencil} label="Edit lead" hint="Name, phone, stage and notes" onClick={() => { setMenuOpen(false); onEdit?.(); }} />
              <SheetRow icon={Trash2} label="Delete lead" hint="Removes the lead and its conversation" tone="danger" onClick={() => { setMenuOpen(false); onDelete?.(); }} />
            </div>
          </BottomSheet>
        )}
      </div>
    </div>
  );
}

function Tag({ className, children }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-semibold max-md:rounded-md max-md:px-2 max-md:text-[11.5px] ${className}`}>
      {children}
    </span>
  );
}

export { LeadRow };
export default LeadRow;
