import { useCallback, useEffect, useState } from 'react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { useBilling } from '../../hooks/useBilling';
import { applySwitches, getSetupDefaults } from '../../services/setupService';
import { goToTab, openPreferences } from './homeCopy';
import HelpGuide from './guides/HelpGuide';
import AudiencePicker from './AudiencePicker';

const primary = 'rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f8d3d] disabled:opacity-50';
const quiet = 'rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700';
const same = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x));

// The one place to switch auto chat on or off, choose who it answers, and set the daily limit.
// Always visible on Home (it does not disappear when it is on) and in Preferences.
export default function AutoChatCard({ businessId, flat = false }) {
  const { topUp, canTopUp } = useBilling(businessId);
  const [chat, setChat] = useState(null);
  const [wallet, setWallet] = useState(true);
  const [audience, setAudience] = useState(['ads', 'hot']);
  const [cap, setCap] = useState(30);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await getSetupDefaults(businessId);
      setChat(d.chat); setWallet(d.wallet?.has_balance !== false);
      setAudience(d.chat.audience?.length ? d.chat.audience : ['all']); setCap(d.chat.daily_cap || 30);
      setError('');
    } catch (e) { setError(e.message); }
  }, [businessId]);

  // Load once, then keep looking every 10 seconds while the brand voice is still learning (auto chat unlocks when it is ready).
  const ready = chat?.persona_ready;
  useEffect(() => {
    const first = async () => { await load(); };
    first();
    const timer = setInterval(() => { if (!ready) load(); }, 10000);
    return () => clearInterval(timer);
  }, [load, ready]);

  const run = async (request, doneText) => {
    setBusy(true); setError(''); setNote('');
    try {
      const result = await applySwitches(businessId, request);
      const w = result.warnings || [];
      if (w.includes('subscription_inactive')) setNote('Your plan is not active yet, so nothing will be sent until it is.');
      else if (w.includes('chat_setup_incomplete')) setNote('Auto chat is on, but its starting skills did not finish loading. Please switch it off and on again.');
      else if (doneText) setNote(doneText);
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const turnOn = () => run({ chat: true, overrides: { chat: { audience, daily_cap: Number(cap) } } }, 'Auto chat is on.');
  const turnOff = () => run({ chat: false }, 'Auto chat is off. You answer every customer yourself.');
  const save = () => run({ chat: true, overrides: { chat: { audience, daily_cap: Number(cap) } } }, 'Saved.');

  if (!chat) {
    const Shell = flat ? 'div' : AnCard;
    return <Shell><div className="py-6 text-center text-sm text-slate-400">{error || 'Loading...'}</div></Shell>;
  }

  const on = chat.on;
  const dirty = on && (!same(audience, chat.audience) || Number(cap) !== chat.daily_cap);
  const blocked = !on && !chat.persona_ready;
  const capOk = Number.isInteger(Number(cap)) && Number(cap) >= 1 && Number(cap) <= 1000;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">Answer customers right away <HelpGuide id="auto-chat" /></h3>
          <p className="mt-1 text-sm text-slate-500">HeySasa replies in seconds, also at night and when you are busy. If you reply yourself, it steps back.</p>
        </div>
        <button type="button" role="switch" aria-checked={on} aria-label="Auto chat" disabled={busy || blocked || (!on && !capOk)}
          onClick={on ? turnOff : turnOn}
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${on ? 'bg-[#28A745]' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      <p className={`mt-2 text-sm font-medium ${on ? 'text-[#27500A]' : 'text-slate-500'}`}>{on ? 'On' : 'Off'}</p>
      {blocked && <p className="mt-1 text-xs text-slate-500">HeySasa is still learning how your business talks. This unlocks in a few minutes.</p>}

      <AudiencePicker value={audience} onChange={setAudience} disabled={busy} />

      <label className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">Chats per day<span className="block text-xs font-normal text-slate-500">HeySasa stops answering new chats after this many in a day.</span></span>
        <input type="number" min="1" max="1000" aria-label="Chats per day" value={cap} onChange={(e) => setCap(e.target.value)}
          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm" />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {on && <button type="button" className={primary} disabled={busy || !dirty || !capOk} onClick={save}>Save changes</button>}
        {!on && <button type="button" className={primary} disabled={busy || blocked || !capOk} onClick={turnOn}>Turn on</button>}
        <button type="button" className={quiet} onClick={() => goToTab('playground')}>Try it first in Test chat</button>
      </div>

      {!wallet && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>Your balance is empty. Until you top up, HeySasa cannot answer customers.</span>
          <button type="button" className="rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
            onClick={() => (canTopUp ? topUp() : openPreferences('billing'))}>{canTopUp ? 'Top up' : 'See billing'}</button>
        </div>
      )}
      {note && <p className="mt-3 text-sm text-amber-700">{note}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </>
  );
  return flat ? <div>{body}</div> : <AnCard><SectionLabel>Auto chat</SectionLabel>{body}</AnCard>;
}
