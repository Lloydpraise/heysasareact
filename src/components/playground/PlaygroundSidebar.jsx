import { PLAYGROUND_SECTIONS } from '../../constants/playgroundConfig';
import { History, MessageSquare, SlidersHorizontal } from 'lucide-react';

const SECTION_ICONS = {
  test: SlidersHorizontal,
  replay: MessageSquare,
  history: History,
};

export default function PlaygroundSidebar({ activeSection, setActiveSection, productCount }) {
  return (
    <div className="flex flex-shrink-0 flex-col gap-2 border-b border-slate-200 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4 md:flex-row md:items-center md:justify-between md:gap-3">
      <nav className="flex w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-auto">
        {PLAYGROUND_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors sm:px-3 ${
                isActive ? 'bg-[#28A745] text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Icon size={12.5} /> {section.label}
            </button>
          );
        })}
      </nav>

      {productCount !== null && (
        <div className="flex items-center gap-2 text-sm md:justify-end">
          <span className={`h-2 w-2 rounded-full ${productCount > 0 ? 'bg-[#28A745]' : 'bg-slate-300'}`} />
          <span className="text-[10px] font-medium text-slate-400 sm:text-[10.5px]">{productCount > 0 ? `${productCount} products connected` : 'No products connected'}</span>
        </div>
      )}
    </div>
  );
}