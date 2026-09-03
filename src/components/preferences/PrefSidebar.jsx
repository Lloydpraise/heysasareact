import { PREF_SECTIONS } from '../../constants/preferencesConfig';

import { ArrowLeft } from 'lucide-react';

export function PrefSidebar({ sections = PREF_SECTIONS, activeSection, setActiveSection, onClose }) {
  return (
    <aside className="w-full shrink-0 rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl md:w-72">
      <div className="mb-4 flex items-center justify-between gap-2 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">Preferences</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
            aria-label="Back to section"
          >
            <ArrowLeft size={16} />
          </button>
        )}
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-1 md:overflow-visible">
        {sections.map((section) => {
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveSection(section.id);
                onClose?.();
              }}
              className={`min-w-[150px] rounded-2xl border px-3 py-3 text-left transition-all md:w-full ${
                isActive
                  ? 'border-[#28A745]/30 bg-[#28A745]/10 text-[#0F172A] shadow-sm'
                  : 'border-transparent bg-transparent text-[#475569] hover:border-white/80 hover:bg-white/60'
              }`}
            >
              <div className="text-sm font-semibold">{section.label}</div>
              <div className="mt-1 text-[11px] text-[#64748B]">{section.sub}</div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default PrefSidebar;