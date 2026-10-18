import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBilling } from '../../hooks/useBilling';
import { useHomeResults } from '../../hooks/useHomeResults';
import { getHomeSummary } from '../../services/setupService';
import ApprovalsCard from './ApprovalsCard';
import DoMoreCards from './DoMoreCards';
import HomeHeader from './HomeHeader';
import ResultsStrip from './ResultsStrip';
import RightNowCard from './RightNowCard';
import Safe from './Safe';
import SwitchesCard from './SwitchesCard';
import WhoNeedsYou from './WhoNeedsYou';
import YourMoveCard from './YourMoveCard';
import { buildMoves } from './buildMoves';
import { normalizeSummary } from './normalizeSummary';

// After setup, top to bottom: a greeting, what HeySasa earned for you, what you should do now, what HeySasa is doing,
// what waits for your OK (with the pause switch always in view), who to talk to, then what else you could switch on.
// Every block is wrapped in <Safe>: if one ever fails, only that block disappears and the rest of Home keeps working.
export default function DailyMode({ businessId, connected, status, onRetrySetup }) {
  const { overview, topUp, canTopUp } = useBilling(businessId);
  const results = useHomeResults(businessId);
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(
    () => getHomeSummary(businessId).then((raw) => setSummary(normalizeSummary(raw))).catch(() => {}),
    [businessId],
  );
  useEffect(() => {
    loadSummary();
    const timer = setInterval(loadSummary, 60000);
    return () => clearInterval(timer);
  }, [loadSummary]);

  const walletEmpty = Boolean(overview) && Number(overview.balance_kes) <= 0;
  const setupFailed = status?.status === 'failed' && !status?.home_ready;
  const moves = useMemo(
    () => buildMoves({ summary, walletEmpty, canTopUp, topUp, setupFailed, onRetrySetup }),
    [summary, walletEmpty, canTopUp, topUp, setupFailed, onRetrySetup],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Safe><HomeHeader connected={connected} /></Safe>
      <Safe><ResultsStrip results={results} /></Safe>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Safe><YourMoveCard moves={moves} loaded={summary !== null || moves.length > 0} /></Safe>
        <Safe><RightNowCard summary={summary} connected={connected} /></Safe>
      </div>

      <div id="home-approvals" className="scroll-mt-4">
        <Safe><ApprovalsCard businessId={businessId} onChanged={loadSummary} /></Safe>
      </div>
      <Safe><WhoNeedsYou businessId={businessId} /></Safe>
      {/* A business that skipped setup, or switched one helper off, can turn it on here. Hidden once both are on. */}
      <Safe><SwitchesCard businessId={businessId} compact hideWhenAllOn /></Safe>
      <Safe><DoMoreCards summary={summary} /></Safe>
    </div>
  );
}
