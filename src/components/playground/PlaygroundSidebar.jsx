import { PLAYGROUND_SECTIONS } from '../../constants/playgroundConfig';
import { History, MessageSquare, SlidersHorizontal, Zap } from 'lucide-react';
import ScrollTabs from '../shared/ScrollTabs';

const SECTION_ICONS = {
  test: SlidersHorizontal,
  replay: MessageSquare,
  skills: Zap,
  history: History,
};

export default function PlaygroundSidebar({ activeSection, setActiveSection, productCount }) {
  // The product count sits at the far end of the tab row. Regenerate and PDF live in the "..." menu beside the persona pack.
  const trailing = (
    <div className="ml-auto flex shrink-0 items-center gap-3 pl-3 pr-1">
      {productCount !== null && (
        <div className="flex shrink-0 items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${productCount > 0 ? 'bg-[#28A745]' : 'bg-slate-300'}`} />
          <span className="whitespace-nowrap text-[10.5px] font-medium text-slate-400 max-md:text-[12.5px]">{productCount > 0 ? `${productCount} products connected` : 'No products connected'}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-shrink-0 items-center border-b border-slate-200 bg-white/70 px-3 py-2.5 backdrop-blur-xl sm:px-4">
      <ScrollTabs tabs={PLAYGROUND_SECTIONS.map((section) => ({ ...section, Icon: SECTION_ICONS[section.id] }))} active={activeSection} onChange={setActiveSection} trailing={trailing} className="md:w-full" />
    </div>
  );
}
