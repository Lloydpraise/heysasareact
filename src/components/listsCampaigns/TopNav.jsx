import { FileText, List, Megaphone, SlidersHorizontal } from 'lucide-react';
import ScrollTabs from '../shared/ScrollTabs';

const CAMPAIGN_SECTIONS = [
  { id: 'lists', label: 'Lists', Icon: List },
  { id: 'campaigns', label: 'Campaigns', Icon: Megaphone },
  { id: 'templates', label: 'Templates', Icon: FileText },
  { id: 'rules', label: 'Automations', Icon: SlidersHorizontal },
];

export default function TopNav({ activeSection, onSectionChange }) {
  return (
    <div className="flex flex-shrink-0 flex-col gap-2 border-b border-slate-200 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4 md:flex-row md:items-center md:justify-between md:gap-3">
      <ScrollTabs tabs={CAMPAIGN_SECTIONS} active={activeSection} onChange={onSectionChange} />
    </div>
  );
}
