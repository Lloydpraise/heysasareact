import { FileText, List, Megaphone, SlidersHorizontal } from 'lucide-react';

const CAMPAIGN_SECTIONS = [
  { id: 'lists', label: 'List Manager', Icon: List },
  { id: 'campaigns', label: 'Campaign Runner', Icon: Megaphone },
  { id: 'templates', label: 'Templates', Icon: FileText },
  { id: 'rules', label: 'Automation Rules', Icon: SlidersHorizontal },
];

export default function TopNav({ activeSection, onSectionChange }) {
  return (
    <div className="flex flex-shrink-0 flex-col gap-2 border-b border-slate-200 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4 md:flex-row md:items-center md:justify-between md:gap-3">
      <div className="flex w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-auto">
        {CAMPAIGN_SECTIONS.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors sm:px-3 ${
                active ? 'bg-[#28A745] text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Icon size={12.5} /> {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
