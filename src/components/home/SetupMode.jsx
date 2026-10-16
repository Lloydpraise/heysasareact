import { useState } from 'react';
import { AlertTriangle, MessageCircleMore } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { WhatsAppConnectionFlow } from '../preferences/sections/WhatsAppConnectionFlow';
import { saveWhatsAppSession } from '../../services/businessService';
import { saveSetupAnswers, startSetup } from '../../services/setupService';
import { useWhatsAppHistory } from '../../hooks/useWhatsAppHistory';
import { firstOpenQuestion } from './homeCopy';
import ProgressCard from './ProgressCard';
import SetupQuestions from './SetupQuestions';
import SetupSteps from './SetupSteps';
import SwitchesCard from './SwitchesCard';
import WhoNeedsYou from './WhoNeedsYou';

const primary = 'rounded-full bg-[#28A745] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1f8d3d] disabled:opacity-50';

// Day one on Home. Connect WhatsApp, press the one button, then watch it work while answering a few easy questions.
// The strip at the top always shows where the owner is. Coming back later opens exactly where they stopped.
export default function SetupMode({ businessId, status, refresh, sessions, refreshSessions, onFinish }) {
  const [flowOpen, setFlowOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [questionsDone, setQuestionsDone] = useState(() => firstOpenQuestion(status?.answers) >= 3);

  const connected = sessions.length > 0;
  const session = sessions[0];
  const idle = !status || status.status === 'idle';

  const begin = async () => {
    setError('');
    setStarting(true);
    try { await startSetup(businessId); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setStarting(false); }
  };

  // The chat history is pulled from WhatsApp first; the setup runner starts once it has landed.
  const history = useWhatsAppHistory(begin);
  const press = () => (session?.history_loaded_at ? begin() : history.loadHistory());

  const finish = async () => {
    try { await saveSetupAnswers(businessId, { finished: true }); } catch { /* Home still opens; it asks again next time */ }
    await refresh();
    onFinish?.();
  };

  const sorted = Boolean(status?.home_ready);
  const stepStates = [
    connected ? 'done' : 'active',
    !connected && idle ? 'todo' : sorted ? 'done' : 'active',
    idle ? 'todo' : questionsDone ? 'done' : 'active',
    idle || !questionsDone ? 'todo' : 'active',
  ];
  const steps = <div className="mb-5"><SetupSteps states={stepStates} /></div>;

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

  // Never connected, or the number dropped half way through. Either way the one thing to do is connect again.
  if (!connected) {
    const dropped = !idle;
    return (
      <div className="mx-auto max-w-xl py-6">
        {steps}
        <AnCard className={`text-center ${dropped ? 'border-red-200 bg-red-50' : ''}`}>
          {dropped
            ? <AlertTriangle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
            : <MessageCircleMore className="mx-auto h-10 w-10 text-[#28A745]" aria-hidden="true" />}
          <h2 className="mt-3 text-xl font-bold text-slate-900">{dropped ? 'Your WhatsApp was disconnected' : 'Connect your WhatsApp'}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {dropped
              ? 'Connect it again so HeySasa can keep reading your new messages. Your progress is saved.'
              : 'That is the only thing you need to do. HeySasa sorts your chats, finds the people ready to buy, and gets your follow-ups ready.'}
          </p>
          <button type="button" className={`${primary} mt-5`} onClick={() => setFlowOpen(true)}>{dropped ? 'Reconnect WhatsApp' : 'Connect WhatsApp'}</button>
        </AnCard>
        {connectFlow}
      </div>
    );
  }

  if (idle) {
    const busy = starting || history.loading;
    return (
      <div className="mx-auto max-w-xl py-6">
        {steps}
        <AnCard className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Your WhatsApp is connected</h2>
          <p className="mt-2 text-sm text-slate-500">One tap and HeySasa does the rest. You will see your first leads in a few minutes.</p>
          <button type="button" className={`${primary} mt-5`} disabled={busy} onClick={press}>
            {history.loading ? 'Reading your chats...' : starting ? 'Starting...' : 'Set up HeySasa for me'}
          </button>
          {(error || history.error) && <p className="mt-3 text-sm text-red-600">{error || history.error}</p>}
        </AnCard>
        {connectFlow}
      </div>
    );
  }

  const failed = status.status === 'failed';
  const nothingToAnalyse = status.status === 'done' && status.thin;

  return (
    <div className="mx-auto max-w-5xl py-4">
      {steps}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ProgressCard status={status} />
          {sorted && !nothingToAnalyse && (
            <WhoNeedsYou businessId={businessId} label="Your first leads" refreshMs={15000}
              emptyText="None of your chats look ready to buy yet. HeySasa checks every new message as it arrives." />
          )}
          {failed && (
            <AnCard>
              <SectionLabel>Setup stopped</SectionLabel>
              <p className="text-sm text-slate-600">{status.home_ready ? 'Your first leads are ready. Some older chats could not be checked.' : 'Something went wrong while setting up.'}</p>
              <button type="button" className={`${primary} mt-3`} disabled={starting} onClick={begin}>Try again</button>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </AnCard>
          )}
        </div>
        <div className="space-y-4">
          {nothingToAnalyse ? (
            <AnCard>
              <SectionLabel>A fresh start</SectionLabel>
              <p className="text-sm text-slate-600">There are almost no chats on this number yet. New leads will appear on Home as they message you, and HeySasa will sort them straight away.</p>
              <button type="button" className={`${primary} mt-3`} onClick={finish}>Take me to Home</button>
            </AnCard>
          ) : !questionsDone ? (
            <SetupQuestions businessId={businessId} status={status} initialStep={firstOpenQuestion(status?.answers)} onDone={() => setQuestionsDone(true)} />
          ) : (
            <SwitchesCard businessId={businessId} onFinish={finish} />
          )}
          {!nothingToAnalyse && (
            <button type="button" onClick={finish} className="text-xs font-medium text-slate-400 hover:text-slate-600">Skip setup for now</button>
          )}
        </div>
      </div>
    </div>
  );
}
