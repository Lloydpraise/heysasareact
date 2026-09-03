import { useState } from 'react';
import { PersonaPackEditor } from '../PersonaPackEditor';
import { LiveChatPlayground } from '../LiveChatPlayground';

function PersonaPackScaffold() {
  const [activeTab, setActiveTab] = useState('Voice & Tone');

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[1.25rem] border border-white/80 bg-white/70 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-slate-200/80 px-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {['Voice & Tone', 'Business Facts', 'Objections', 'Customer Profiles', 'Sentiment', 'Handoff & Closing'].map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(label)}
            className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium ${activeTab === label ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'text-[#94A3B8]'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {[['Display name', ''], ['Voice tone', ''], ['Typical greeting', '']].map(([label, value]) => (
            <div key={label}>
              <div className="mb-1.5 h-4 w-28 rounded bg-slate-100" />
              <div className="h-9 w-full rounded-xl border border-slate-200/80 bg-slate-50/70" aria-label={`${label} will appear here`}>
                {value}
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center text-sm text-[#94A3B8]">
            Persona pack content appears here when it is populated.
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestSection({ personaPack, liveChat, showToast }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      {personaPack.pack ? <PersonaPackEditor personaPack={personaPack} showToast={showToast} /> : <PersonaPackScaffold />}
      <LiveChatPlayground liveChat={liveChat} />
    </div>
  );
}