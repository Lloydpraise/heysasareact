import { useCallback, useEffect, useState } from 'react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { useBilling } from '../../hooks/useBilling';
import { applySwitches, getSetupDefaults } from '../../services/setupService';
import { goToTab, openPreferences } from './homeCopy';
import HelpGuide from './guides/HelpGuide';
import AudiencePicker from './AudiencePicker';

const primary = 'rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f8d3d] disabled:opacity-50';
const quiet = 'rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700';

// The list of settings in plain words. Number settings can be changed on the spot; everything else is shown as is.
function Lines({ lines, overrides, onChange }) {
  return (
    <ul className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
      {lines.map((line) => (
        <li key={line.key} className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">{line.label}</span>
            {line.edit?.type === 'number' ? (
              <input type="number" min={line.edit.min} max={line.edit.max} aria-label={line.label}
                value={overrides[line.edit.field] ?? line.edit.current}
                onChange={(e) => onChange(line.edit.field, Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm" />
            ) : <span className="text-slate-600">{line.value}</span>}
          </div>
          <p className="text-xs text-slate-500">{line.plain}</p>
        </li>
      ))}
    </ul>
  );
}

function SwitchBlock({ title, help, blurb, on, disabledText, busy, open, onToggleOpen, onTurnOn, onTurnOff, lines, overrides, onChange, moreLabel, onMore, children }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">{title}{help && <HelpGuide id={help} />}</h3>
          <p className="mt-1 text-sm text-slate-500">{blurb}</p>
        </div>
        {on && <span className="rounded-full bg-[#28A745]/10 px-2 py-0.5 text-xs font-semibold text-[#27500A]">On</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {on
          ? <button type="button" className={quiet} disabled={busy} onClick={onTurnOff}>Turn off</button>
          : <button type="button" className={primary} disabled={busy || Boolean(disabledText)} onClick={onTurnOn}>Turn on with recommended settings</button>}
        <button type="button" className={quiet} onClick={onToggleOpen} aria-expanded={open}>{open ? 'Hide the settings' : 'See the settings'}</button>
      </div>
      {disabledText && !on && <p className="mt-2 text-xs text-slate-500">{disabledText}</p>}
      {children}
      {open && lines && <Lines lines={lines} overrides={overrides} onChange={onChange} />}
      {open && lines && onMore && (
        <button type="button" onClick={onMore} className="mt-2 text-xs font-medium text-[#27500A] underline">{moreLabel}</button>
      )}
    </div>
  );
}

// Step 3 of setup: the two switches. Recommended settings are used unless the owner changes them, and nothing is hidden.
// On the daily page (`compact`) it is a small "do more" card for a business that skipped setup or switched one off,
// and `hideWhenAllOn` hides it once both are on.
export default function SwitchesCard({ businessId, onFinish, compact = false, hideWhenAllOn = false, hideChat = false }) {
  const { topUp, canTopUp } = useBilling(businessId);
  const [defaults, setDefaults] = useState(null);
  const [open, setOpen] = useState({});
  const [followOverrides, setFollowOverrides] = useState({});
  const [chatOverrides, setChatOverrides] = useState({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setDefaults(await getSetupDefaults(businessId)); setError(''); }
    catch (e) { setError(e.message); }
  }, [businessId]);

  // The brand voice may still be learning: check again until auto chat can be switched on.
  useEffect(() => {
    const first = async () => { await load(); };
    first();
    const timer = setInterval(() => { if (!defaults?.chat?.persona_ready) load(); }, 10000);
    return () => clearInterval(timer);
  }, [load, defaults?.chat?.persona_ready]);

  const run = async (request) => {
    setBusy(true); setError(''); setNote('');
    try {
      const result = await applySwitches(businessId, request);
      if (result.warnings?.includes('subscription_inactive')) setNote('Your plan is not active yet, so nothing will be sent until it is.');
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (!defaults) return hideWhenAllOn ? null : <AnCard><div className="py-6 text-center text-sm text-slate-400">{error || 'Loading...'}</div></AnCard>;
  if (hideWhenAllOn && defaults.followups.on && (hideChat || defaults.chat.on)) return null;
  const audience = chatOverrides.audience ?? defaults.chat.audience ?? ['ads', 'hot'];

  return (
    <AnCard>
      <SectionLabel>{compact ? 'Let HeySasa do more' : 'Let HeySasa start working'}</SectionLabel>
      <div className="space-y-3">
        <SwitchBlock
          title="Follow up with people who went quiet" help="follow-up-plan"
          blurb="HeySasa writes the follow-ups. Every message waits for your OK before it is sent."
          on={defaults.followups.on} busy={busy} open={Boolean(open.follow)}
          onToggleOpen={() => setOpen((o) => ({ ...o, follow: !o.follow }))}
          onTurnOn={() => run({ followups: true, overrides: { followups: followOverrides } })}
          onTurnOff={() => run({ followups: false })}
          lines={defaults.followups.lines} overrides={followOverrides}
          moreLabel="Change the other follow-up settings in Preferences" onMore={() => openPreferences('followup')}
          onChange={(field, value) => setFollowOverrides((o) => ({ ...o, [field]: value }))} />
        {!hideChat && <SwitchBlock
          title="Answer new customers right away" help="auto-chat"
          blurb="HeySasa replies as soon as someone messages you, also at night and when you are busy."
          on={defaults.chat.on} busy={busy} open={Boolean(open.chat)}
          disabledText={defaults.chat.persona_ready ? '' : 'HeySasa is still learning how your business talks. This unlocks in a few minutes.'}
          onToggleOpen={() => setOpen((o) => ({ ...o, chat: !o.chat }))}
          onTurnOn={() => run({ chat: true, overrides: { chat: chatOverrides } })}
          onTurnOff={() => run({ chat: false })}
          lines={defaults.chat.lines} overrides={chatOverrides}
          moreLabel="Try it first in Test chat" onMore={() => goToTab('playground')}
          onChange={(field, value) => setChatOverrides((o) => ({ ...o, [field]: value }))}>
          {!defaults.chat.on && <AudiencePicker value={audience} onChange={(v) => setChatOverrides((o) => ({ ...o, audience: v }))} />}
        </SwitchBlock>}
      </div>
      {defaults.wallet?.has_balance === false && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>Your balance is empty. HeySasa needs a little balance to write follow-ups and answer customers. Until you top up, nothing will be written or sent.</span>
          <button type="button" className="rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
            onClick={() => (canTopUp ? topUp() : openPreferences('billing'))}>{canTopUp ? 'Top up' : 'See billing'}</button>
        </div>
      )}
      {note && <p className="mt-3 text-sm text-amber-700">{note}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {!compact && (
        <div className="mt-4 flex items-center gap-2">
          <button type="button" className={primary} onClick={onFinish}>Take me to Home</button>
          <span className="text-xs text-slate-400">You can change all of this later in Preferences.</span>
        </div>
      )}
    </AnCard>
  );
}
