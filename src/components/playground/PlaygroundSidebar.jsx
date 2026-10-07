import { PLAYGROUND_SECTIONS } from '../../constants/playgroundConfig';
import { History, MessageSquare, SlidersHorizontal, Sparkles, Zap } from 'lucide-react';
import ScrollTabs from '../shared/ScrollTabs';

const SECTION_ICONS = {
  test: SlidersHorizontal,
  replay: MessageSquare,
  skills: Zap,
  history: History,
};

export default function PlaygroundSidebar({ activeSection, setActiveSection, productCount, onGeneratePersona, isGeneratingPersona }) {
  // The persona button and product count live at the far end of the same tab row
  // (scrolls with it on phones) so the chat below gets the extra height.
  const trailing = (
    <div className="ml-auto flex shrink-0 items-center gap-3 pl-3 pr-1">
      {productCount !== null && (
        <div className="flex shrink-0 items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${productCount > 0 ? 'bg-[#28A745]' : 'bg-slate-300'}`} />
          <span className="whitespace-nowrap text-[10.5px] font-medium text-slate-400 max-md:text-[12.5px]">{productCount > 0 ? `${productCount} products connected` : 'No products connected'}</span>
        </div>
      )}
      <button
        type="button"
        disabled={isGeneratingPersona}
        onClick={onGeneratePersona}
        className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#28A745]/20 bg-[#F0FDF4] px-3 py-1.5 text-[11px] font-semibold text-[#1f8d3d] shadow-sm transition hover:bg-[#DCFCE7] disabled:cursor-not-allowed disabled:opacity-60 max-md:px-4 max-md:py-2.5 max-md:text-[13.5px]"
      >
        <Sparkles size={12} />
        {isGeneratingPersona ? 'Generating…' : <><span className="md:hidden">New AI persona</span><span className="max-md:hidden">Generate New AI Persona</span></>}
      </button>
    </div>
  );

  return (
    <div className="flex flex-shrink-0 items-center border-b border-slate-200 bg-white/70 px-3 py-2.5 backdrop-blur-xl sm:px-4">
      <ScrollTabs tabs={PLAYGROUND_SECTIONS.map((section) => ({ ...section, Icon: SECTION_ICONS[section.id] }))} active={activeSection} onChange={setActiveSection} trailing={trailing} className="md:w-full" />
    </div>
  );
}
