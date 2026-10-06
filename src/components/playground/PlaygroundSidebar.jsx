import { PLAYGROUND_SECTIONS } from '../../constants/playgroundConfig';
import { History, MessageSquare, SlidersHorizontal, Sparkles } from 'lucide-react';
import ScrollTabs from '../shared/ScrollTabs';

const SECTION_ICONS = {
  test: SlidersHorizontal,
  replay: MessageSquare,
  history: History,
};

export default function PlaygroundSidebar({ activeSection, setActiveSection, productCount, onGeneratePersona, isGeneratingPersona }) {
  return (
    <div className="flex flex-shrink-0 flex-col gap-2 border-b border-slate-200 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4 md:flex-row md:items-center md:justify-between md:gap-3">
      <ScrollTabs tabs={PLAYGROUND_SECTIONS.map((section) => ({ ...section, Icon: SECTION_ICONS[section.id] }))} active={activeSection} onChange={setActiveSection} />

      <div className="flex items-center gap-2 max-md:justify-between md:justify-end">
        <button
          type="button"
          disabled={isGeneratingPersona}
          onClick={onGeneratePersona}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#28A745]/20 bg-[#F0FDF4] px-3 py-1.5 text-[11px] font-semibold text-[#1f8d3d] shadow-sm max-md:h-11 max-md:px-4 max-md:text-[13.5px] transition hover:bg-[#DCFCE7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles size={12} />
          {isGeneratingPersona ? 'Generating…' : <><span className="md:hidden">New AI persona</span><span className="max-md:hidden">Generate New AI Persona</span></>}
        </button>

        {productCount !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${productCount > 0 ? 'bg-[#28A745]' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-medium text-slate-400 max-md:text-[12px] sm:text-[10.5px]">{productCount > 0 ? `${productCount} products connected` : 'No products connected'}</span>
          </div>
        )}
      </div>
    </div>
  );
}