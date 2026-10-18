import { useState } from 'react';
import { openPreferences } from './homeCopy';

const hello = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

// The top of Home after setup: a greeting and whether WhatsApp is connected.
// Ask HeySasa is the logo in the top bar, which gently invites a tap while the owner is on this page.
export default function HomeHeader({ connected }) {
  const [greeting] = useState(hello);   // fixed for this visit, so the page does not change under the owner

  return (
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
  );
}
