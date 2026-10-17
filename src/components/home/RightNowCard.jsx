import { Bot, Send, Wallet, Wifi, WifiOff } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { comma } from '../../utils/analyticsHelpers';
import { goToTab, openPreferences } from './homeCopy';

const DOT = {
  green: 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]',
  amber: 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]',
  red: 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.18)]',
  grey: 'bg-slate-300',
};

function StatusTile({ icon: Icon, label, state, detail, tone, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] max-md:min-h-[44px]">
      <div className="flex items-center justify-between">
        <Icon size={16} className="text-slate-400" aria-hidden="true" />
        <span className={`h-2 w-2 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      </div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-[17px] font-bold leading-tight text-slate-900">{state}</div>
      {detail && <div className="text-[11.5px] text-slate-400">{detail}</div>}
    </button>
  );
}

function Count({ value, label }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3 text-center">
      <div className="text-[22px] font-bold leading-none text-slate-900">{value === undefined ? '–' : comma(value)}</div>
      <div className="mt-1 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

// "What is HeySasa doing right now": four live switches, then what it did in the last day.
export default function RightNowCard({ summary, connected }) {
  const live = summary?.live;
  const nextText = live?.next_send_at
    ? `next at ${new Date(live.next_send_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;
  const messagesLeft = live?.messages_left;
  const lowBalance = messagesLeft !== null && messagesLeft !== undefined && messagesLeft < 200;

  return (
    <AnCard>
      <SectionLabel>HeySasa right now</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        <StatusTile
          icon={connected ? Wifi : WifiOff} label="WhatsApp"
          state={connected ? 'Connected' : 'Disconnected'} tone={connected ? 'green' : 'red'}
          detail={connected ? 'reading every chat' : 'tap to reconnect'}
          onClick={() => openPreferences('whatsapp')}
        />
        <StatusTile
          icon={Send} label="Follow-ups"
          state={!live ? '–' : live.followups_on ? 'On' : 'Paused'} tone={!live ? 'grey' : live.followups_on ? 'green' : 'amber'}
          detail={!live ? '' : live.followups_on ? (live.queued_now ? `${comma(live.queued_now)} queued${nextText ? ` · ${nextText}` : ''}` : 'nothing queued') : 'not sending'}
          onClick={() => goToTab('lists-campaigns')}
        />
        <StatusTile
          icon={Bot} label="Chat AI"
          state={!live ? '–' : live.chat_on ? 'Replying' : 'Off'} tone={!live ? 'grey' : live.chat_on ? 'green' : 'grey'}
          detail={!live ? '' : live.chat_on ? `${comma(live.chat_chats_24h)} chats today` : 'you answer every chat'}
          onClick={() => goToTab('playground')}
        />
        <StatusTile
          icon={Wallet} label="Balance"
          state={messagesLeft === null || messagesLeft === undefined ? '–' : `~${comma(messagesLeft)}`}
          tone={messagesLeft === null || messagesLeft === undefined ? 'grey' : messagesLeft <= 0 ? 'red' : lowBalance ? 'amber' : 'green'}
          detail="messages left"
          onClick={() => openPreferences('billing')}
        />
      </div>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Last 24 hours</div>
      <div className="mt-2 grid grid-cols-3 gap-2.5">
        <Count value={summary?.sent_24h} label="follow-ups sent" />
        <Count value={live?.chat_replies_24h} label="AI replies" />
        <Count value={live?.new_leads_24h} label="new leads" />
      </div>
    </AnCard>
  );
}
