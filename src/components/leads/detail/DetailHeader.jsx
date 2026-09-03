import { MessageCircle, Phone, ExternalLink, ShoppingBag, User2, Megaphone } from 'lucide-react';
import { stateConfig, qualityLabel, timeAgo } from '../../../utils/leadHelpers';
import whatsappIcon from '../../../assets/images/whatsappicon.svg';

// Header block for the detail panel: avatar, name, state/quality badges,
// ad-source badge (if this lead came from an ad), and quick actions
// (open chat drawer, call, WhatsApp, mark as bought).
//
// Props:
//   lead        — full lead object (see mockLeads.js for shape)
//   onOpenChat  — () => void, opens ChatDrawer
//   onMarkBought — () => void, opens the "mark as bought" flow (modal/form
//                  lives in LeadsPage or a future BoughtModal — this button
//                  just triggers it)
export default function DetailHeader({ lead, onOpenChat, onMarkBought }) {
  const state = stateConfig(lead.lead_state);
  const quality = qualityLabel(lead.lead_quality);
  const initial = (lead.name || '?').trim().charAt(0).toUpperCase();
  const waLink = lead.phone ? `https://wa.me/${lead.phone.replace(/[^\d]/g, '')}` : null;
  const telLink = lead.phone ? `tel:${lead.phone}` : null;

  const isWon = lead.lead_state === 'won';
  const canMarkBought = lead.lead_type === 'business' && !isWon;

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#28A745] to-[#1e7a35] text-lg font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden">
              <h2 className="truncate text-[17px] font-bold leading-tight text-slate-900">{lead.name}</h2>
              <span className={`flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold ${state.textClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${state.dotClass}`} />
                {state.label}
              </span>
              {quality && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
                  {quality}
                </span>
              )}
              {lead.lead_type === 'personal' && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
                  <User2 size={10} /> Personal
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12.5px] text-slate-400">{lead.phone}</p>

            {lead.is_ad_lead && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#F7FBF9] px-2.5 py-1.5 text-[11.5px] text-slate-600">
                <Megaphone size={13} className="mt-0.5 flex-shrink-0 text-[#28A745]" />
                <span className="min-w-0 truncate">
                  <span className="font-semibold text-slate-700">{lead.ad_platform}</span>
                  {lead.ad_headline ? ` \u2014 ${lead.ad_headline}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenChat}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#28A745]"
              aria-label="Open chat"
              title="Open chat"
            >
              <img src={whatsappIcon} alt="Chat" className="h-4 w-4 opacity-50" />
            </button>
            {telLink && (
              <a
                href={telLink}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#28A745]"
                aria-label="Call"
                title="Call"
              >
                <Phone size={16} />
              </a>
            )}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#28A745]"
                aria-label="Open in WhatsApp"
                title="Open in WhatsApp"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          {canMarkBought && (
            <button
              type="button"
              onClick={onMarkBought}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#28A745] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#1e7a35] md:w-auto"
            >
              <ShoppingBag size={13} /> Mark as bought
            </button>
          )}
        </div>
      </div>

      {isWon && lead.product_sold && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#F7FBF9] px-3 py-2 text-[12.5px]">
          <ShoppingBag size={14} className="text-[#28A745]" />
          <span className="font-semibold text-slate-700">{lead.product_sold}</span>
          {lead.deal_value != null && (
            <span className="text-slate-500">{'\u2014'} KES {lead.deal_value.toLocaleString()}</span>
          )}
          {lead.purchase_date && (
            <span className="ml-auto text-slate-400">{timeAgo(lead.purchase_date)} ago</span>
          )}
        </div>
      )}

      {lead.context_summary && (
        <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{lead.context_summary}</p>
      )}
    </div>
  );
}