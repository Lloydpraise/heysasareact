import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAssistant } from '../../context/useAssistant';
import { openPreferences } from './homeCopy';

const hello = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

// The top of Home after setup: a greeting, whether WhatsApp is connected, and Ask HeySasa one tap away.
export default function HomeHeader({ connected }) {
  const assistant = useAssistant();
  const [greeting] = useState(hello);   // fixed for this visit, so the page does not change under the owner

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{greeting}</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-[#28A745]' : 'bg-red-500'}`} aria-hidden="true" />
          {connected ? 'WhatsApp is connected. HeySasa is working.' : (
            <>
              WhatsApp is disconnected.{' '}
              <button type="button" onClick={() => openPreferences('whatsapp')} className="font-semibold text-red-600 underline">Reconnect</button>
            </>
          )}
        </p>
      </div>
      <button type="button" onClick={() => assistant.open()}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        <Sparkles className="h-4 w-4 text-[#28A745]" aria-hidden="true" />
        Ask HeySasa
      </button>
    </div>
  );
}
