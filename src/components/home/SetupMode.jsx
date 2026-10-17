import { useEffect, useState } from 'react';
import { WhatsAppConnectionFlow } from '../preferences/sections/WhatsAppConnectionFlow';
import { saveWhatsAppSession } from '../../services/businessService';
import { applySwitches, fetchDiscoveredProducts, getSetupDefaults, saveSetupAnswers, startSetup } from '../../services/setupService';
import { useBilling } from '../../hooks/useBilling';
import { useWhatsAppHistory } from '../../hooks/useWhatsAppHistory';
import { DEFAULT_HOURS, firstOpenQuestion, openPreferences } from './homeCopy';
import ObBackdrop from './onboarding/ObBackdrop';
import { Dots, QuietButton } from './onboarding/Controls';
import WelcomeBeat from './onboarding/WelcomeBeat';
import WakeBeat from './onboarding/WakeBeat';
import ReconnectBeat from './onboarding/ReconnectBeat';
import RevealBeat from './onboarding/RevealBeat';
import WinBeat from './onboarding/WinBeat';
import RivalBeat from './onboarding/RivalBeat';
import ConfirmBeat from './onboarding/ConfirmBeat';
import CrewBeat from './onboarding/CrewBeat';
import LiveBeat from './onboarding/LiveBeat';
import { useOnboardingWin } from './onboarding/useOnboardingWin';

// Day one is a short film, not a form. Welcome, connect, wake it up, then six beats while the analysis runs quietly
// behind them: the x-ray, the first win, you against your competitors, a one-tap check, your AI sales force, and the
// finale. Everything the setup asks is still asked or defaulted, only with far less effort.
//
// Kept from the earlier setup: an answered question is never asked again (when all three are answered the one-tap
// check is skipped), a half-finished setup opens where it stopped, and a number that drops half way through gets a
// clear "reconnect, your progress is saved" screen.
const FULL = ['reveal', 'win', 'rival', 'confirm', 'crew', 'live'];
const DOT_COUNT = 2 + FULL.length;

export default function SetupMode({ businessId, status, refresh, sessions, refreshSessions, onFinish }) {
  const [flowOpen, setFlowOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [beatId, setBeatId] = useState('reveal');
  // Decided once, when setup opens, so the screens never shift under the owner while the answers are saved.
  const [allAnswered] = useState(() => firstOpenQuestion(status?.answers) >= 3);

  const [hours, setHours] = useState(status?.answers?.hours || DEFAULT_HOURS);
  const [handoff, setHandoff] = useState(status?.answers?.handoff?.length ? status.answers.handoff : ['asks_for_call', 'ready_to_pay']);
  const [products, setProducts] = useState(null);
  const [crossed, setCrossed] = useState([]);
  const [saving, setSaving] = useState(false);
  const [defaults, setDefaults] = useState(null);
  const [crewBusy, setCrewBusy] = useState(false);
  const [crewNote, setCrewNote] = useState('');
  const [retrying, setRetrying] = useState(false);

  const { topUp, canTopUp } = useBilling(businessId);

  const connected = sessions.length > 0;
  const session = sessions[0];
  const idle = !status || status.status === 'idle';
  const thin = status?.status === 'done' && status?.thin === true;   // almost no chats yet: nothing to show off
  const order = FULL.filter((id) => !(thin && (id === 'reveal' || id === 'win')) && !(allAnswered && id === 'confirm'));
  // Beats are tracked by name, not position, so the list changing (thin, answered) can never skip a screen.
  const beat = order.find((id) => FULL.indexOf(id) >= FULL.indexOf(beatId)) || 'live';
  const next = () => setBeatId(order.find((id) => FULL.indexOf(id) > FULL.indexOf(beat)) || 'live');

  const begin = async () => {
    setError('');
    setStarting(true);
    try { await startSetup(businessId); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setStarting(false); }
  };
  // The chat history is pulled from WhatsApp first; the setup runner starts once it has landed.
  const history = useWhatsAppHistory(begin);
  const wake = () => (session?.history_loaded_at ? begin() : history.loadHistory());

  const finish = async () => {
    try { await saveSetupAnswers(businessId, { finished: true }); } catch { /* Home still opens; it asks again next time */ }
    await refresh();
    onFinish?.();
  };

  const retry = async () => { setRetrying(true); try { await begin(); } finally { setRetrying(false); } };

  // First win: only looked up once the owner reaches that screen.
  const win = useOnboardingWin(businessId, !idle && connected && beat === 'win');

  // Products found in the chats, for the one-tap check.
  const productCount = status?.counters?.products || 0;
  useEffect(() => {
    if (beat !== 'confirm' || !productCount) return undefined;
    let cancelled = false;
    fetchDiscoveredProducts(businessId).then((rows) => { if (!cancelled) setProducts(rows); }).catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
  }, [beat, productCount, businessId]);

  // The recommended settings, and whether the brand voice is ready for auto chat.
  const personaReady = defaults?.chat?.persona_ready === true;
  useEffect(() => {
    if (beat !== 'crew') return undefined;
    let cancelled = false;
    let timer = null;
    const load = () => getSetupDefaults(businessId)
      .then((d) => { if (!cancelled) { setDefaults(d); if (d?.chat?.persona_ready !== true) timer = setTimeout(load, 10000); } })
      .catch(() => { if (!cancelled) timer = setTimeout(load, 10000); });
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [beat, businessId]);

  const confirm = async () => {
    setSaving(true); setError('');
    try {
      const answers = { hours, handoff };
      if (products?.length) answers.products = { approve: products.filter((p) => !crossed.includes(p.id)).map((p) => p.id), dismiss: crossed };
      await saveSetupAnswers(businessId, answers);
      next();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const startWorking = async () => {
    setCrewBusy(true); setError(''); setCrewNote('');
    try {
      if (!defaults?.followups?.on || (personaReady && !defaults?.chat?.on)) {
        const result = await applySwitches(businessId, { followups: true, ...(personaReady ? { chat: true } : {}) });
        if (result.warnings?.includes('subscription_inactive')) setCrewNote('Your plan is not active yet, so nothing is sent until it is.');
      }
      next();
    } catch (e) { setError(e.message); }
    finally { setCrewBusy(false); }
  };

  const connectFlow = (
    <WhatsAppConnectionFlow
      open={flowOpen}
      onClose={() => setFlowOpen(false)}
      onConnected={async (connection) => {
        await saveWhatsAppSession({ businessId, phoneNumber: connection.number, instanceName: connection.instanceName, label: connection.label });
        await refreshSessions();
      }}
    />
  );

  let dot = 0;
  let screen;
  if (!connected) {
    // Never connected, or the number dropped half way through. Either way the one thing to do is connect again.
    screen = idle
      ? <WelcomeBeat onConnect={() => setFlowOpen(true)} />
      : <ReconnectBeat onReconnect={() => setFlowOpen(true)} />;
  } else if (idle) {
    dot = 1;
    screen = <WakeBeat onWake={wake} busy={starting || history.loading} label={history.loading ? 'Reading your chats...' : 'Starting...'} error={error || history.error} />;
  } else {
    dot = 2 + FULL.indexOf(beat);
    const counters = status?.counters || {};
    if (beat === 'reveal') {
      screen = <RevealBeat status={status} onNext={next} canNext={Number(counters.customers) > 0 || status.status === 'done' || Boolean(status.home_ready)} onRetry={retry} retrying={retrying} />;
    } else if (beat === 'win') {
      screen = <WinBeat lead={win.lead} readyCount={Number(counters.ready_to_buy) || 0} value={win.value} currency={win.currency} loading={!win.done} onNext={next} />;
    } else if (beat === 'rival') {
      screen = <RivalBeat onNext={next} />;
    } else if (beat === 'confirm') {
      screen = (
        <ConfirmBeat hours={hours} onHours={setHours} handoff={handoff}
          onHandoff={(id) => setHandoff((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))}
          products={products} crossed={crossed} onCross={(id) => setCrossed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))}
          onConfirm={confirm} onSkip={next} saving={saving} error={error} />
      );
    } else if (beat === 'crew') {
      screen = (
        <CrewBeat defaults={defaults} onStart={startWorking} busy={crewBusy} error={error} note={crewNote}
          lowBalance={defaults?.wallet?.has_balance === false}
          onTopUp={() => (canTopUp ? topUp() : openPreferences('billing'))} />
      );
    } else {
      screen = <LiveBeat onEnter={finish} />;
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl py-2 sm:py-6">
      <div className="ob relative flex min-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-[26px] bg-[#0A0F0C] text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] max-sm:rounded-[20px]">
        <ObBackdrop />
        <div className="relative z-10 px-5 pt-5"><Dots total={DOT_COUNT} index={dot} /></div>
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
          <div key={`${connected}-${idle}-${beat}`} className="w-full">{screen}</div>
        </div>
        <div className="relative z-10 flex justify-center pb-4">
          {beat !== 'live' && connected && <QuietButton onClick={finish}>Skip for now</QuietButton>}
        </div>
      </div>
      {connectFlow}
    </div>
  );
}
