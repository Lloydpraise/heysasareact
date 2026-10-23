import { Bot, Send, Wallet, Wifi, WifiOff } from 'lucide-react';
import { comma } from '../../utils/analyticsHelpers';
import { goToTab, openPreferences } from './homeCopy';

const DOT = {
  green: 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]',
  amber: 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]',
  red: 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.18)]',
  grey: 'bg-slate-300',
};

function Pill({ icon: Icon, label, state, tone, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] max-md:min-h-[48px]">
      <Icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="block truncate text-[14px] font-bold leading-tight text-slate-900">{state}</span>
      </span>
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden="true" />
    </button>
  );
}

// "What is HeySasa doing right now": four live switches in one slim row. Details live on each page.
export default function RightNowCard({ summary, connected }) {
  const live = summary?.live;
  const messagesLeft = live?.messages_left;
  const unknownBalance = messagesLeft === null || messagesLeft === undefined;
  const lowBalance = !unknownBalance && messagesLeft < 200;

  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      <Pill
        icon={connected ? Wifi : WifiOff} label="WhatsApp"
        state={connected ? 'Connected' : 'Disconnected'} tone={connected ? 'green' : 'red'}
        onClick={() => openPreferences('whatsapp')}
      />
      <Pill
        icon={Send} label="Follow-ups"
        state={!live ? '–' : live.followups_on ? (live.queued_now ? `${comma(live.queued_now)} queued` : 'On') : 'Paused'}
        tone={!live ? 'grey' : live.followups_on ? 'green' : 'amber'}
        onClick={() => goToTab('lists-campaigns')}
      />
      <Pill
        icon={Bot} label="Chat AI"
        state={!live ? '–' : live.chat_on ? 'Replying' : 'Off'}
        tone={!live ? 'grey' : live.chat_on ? 'green' : 'grey'}
        onClick={() => goToTab('playground')}
      />
      <Pill
        icon={Wallet} label="Balance"
        state={unknownBalance ? '–' : `~${comma(messagesLeft)} msgs`}
        tone={unknownBalance ? 'grey' : messagesLeft <= 0 ? 'red' : lowBalance ? 'amber' : 'green'}
        onClick={() => openPreferences('billing')}
      />
    </div>
  );
}
