import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { useBilling } from '../../hooks/useBilling';
import { getHomeSummary } from '../../services/setupService';
import ApprovalsCard from './ApprovalsCard';
import WhoNeedsYou from './WhoNeedsYou';
import { openPreferences } from './homeCopy';

function Alert({ title, text, action, onAction }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
        <div>
          <div className="text-sm font-semibold text-red-800">{title}</div>
          <div className="text-sm text-red-700">{text}</div>
        </div>
      </div>
      <button type="button" onClick={onAction} className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700">{action}</button>
    </div>
  );
}

// After setup: loud alerts first, then what needs approving, then who to talk to, then what happened while away.
export default function DailyMode({ businessId, connected, status, onRetrySetup }) {
  const { overview, topUp, canTopUp } = useBilling(businessId);
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(() => getHomeSummary(businessId).then(setSummary).catch(() => {}), [businessId]);
  useEffect(() => {
    loadSummary();
    const timer = setInterval(loadSummary, 60000);
    return () => clearInterval(timer);
  }, [loadSummary]);

  const walletEmpty = overview && Number(overview.balance_kes) <= 0;
  const setupFailed = status?.status === 'failed' && !status?.home_ready;

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-4">
      {!connected && (
        <Alert title="Your WhatsApp is disconnected" text="HeySasa cannot send or read messages until you connect it again."
          action="Reconnect" onAction={() => openPreferences('whatsapp')} />
      )}
      {walletEmpty && (
        <Alert title="Your balance is empty" text="Follow-ups and the AI are paused until you top up."
          action={canTopUp ? 'Top up' : 'See billing'} onAction={() => (canTopUp ? topUp() : openPreferences('billing'))} />
      )}
      {setupFailed && (
        <Alert title="Setup did not finish" text="Some of your chats could not be checked yet." action="Try again" onAction={() => onRetrySetup?.()} />
      )}

      <ApprovalsCard businessId={businessId} onChanged={loadSummary} />
      <WhoNeedsYou businessId={businessId} />

      <AnCard>
        <SectionLabel>While you were away</SectionLabel>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'follow-ups sent today', value: summary?.sent_24h },
            { label: 'ready to buy', value: summary?.ready_to_buy },
            { label: 'waiting for your OK', value: summary ? summary.waiting_messages + summary.waiting_plans : undefined },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 px-2 py-3">
              <div className="text-2xl font-bold text-slate-900">{item.value === undefined ? '–' : Number(item.value).toLocaleString()}</div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </AnCard>
    </div>
  );
}
