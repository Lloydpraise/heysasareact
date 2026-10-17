import { Megaphone, Package, Sparkles, Users } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { useAssistant } from '../../context/useAssistant';
import { comma } from '../../utils/analyticsHelpers';
import { goToTab } from './homeCopy';

const btn = 'mt-auto inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white hover:bg-slate-700 max-md:min-h-[40px]';

function Opportunity({ icon: Icon, value, label, cta, onClick }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-slate-200 bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#28A745]"><Icon size={17} aria-hidden="true" /></span>
      <div className="text-[28px] font-bold leading-none tracking-tight text-slate-900">{value}</div>
      <div className="text-[12.5px] leading-snug text-slate-500">{label}</div>
      <button type="button" onClick={onClick} className={btn}>{cta}</button>
    </div>
  );
}

// "How can I achieve more": only things that are true right now, each with one button. Turning the two helpers on
// is handled by the switches card above, so it is not repeated here. With nothing to suggest, only the Ask card shows.
export default function DoMoreCards({ summary }) {
  const assistant = useAssistant();
  const o = summary?.opportunities;
  if (!o) return null;

  const cards = [];
  if (o.ad_leads_untouched > 0) cards.push(<Opportunity key="ads" icon={Megaphone} value={comma(o.ad_leads_untouched)} label="ad leads were never followed up" cta="Start a follow-up" onClick={() => goToTab('lists-campaigns')} />);
  if (o.dormant_leads > 0) cards.push(<Opportunity key="dormant" icon={Users} value={comma(o.dormant_leads)} label="interested people went quiet for 2+ weeks" cta="Win them back" onClick={() => goToTab('lists-campaigns')} />);
  if (o.products_without_price > 0) cards.push(<Opportunity key="price" icon={Package} value={comma(o.products_without_price)} label="products have no price, so HeySasa cannot quote them" cta="Set prices" onClick={() => goToTab('products')} />);

  return (
    <div>
      <SectionLabel>Do more</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards}
        <AnCard className="flex flex-col gap-2 !border-[#28A745]/30 bg-gradient-to-br from-emerald-50 to-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#28A745] text-white"><Sparkles size={17} aria-hidden="true" /></span>
          <div className="text-[15px] font-bold leading-snug text-slate-900">Not sure what to do next?</div>
          <div className="text-[12px] text-slate-500">Ask HeySasa. It reads your numbers and tells you.</div>
          <button type="button" className={`${btn} !bg-[#28A745] hover:!bg-[#1f8d3d]`}
            onClick={() => assistant.open({ surface: 'general', seedText: 'What should I do next to sell more?' })}>Ask HeySasa</button>
        </AnCard>
      </div>
    </div>
  );
}
