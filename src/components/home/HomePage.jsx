import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useSetupStatus } from '../../hooks/useSetupStatus';
import { fetchWhatsAppSessions } from '../../services/businessService';
import { startSetup } from '../../services/setupService';
import SetupMode from './SetupMode';
import DailyMode from './DailyMode';

// One screen, two modes. Day one it is the setup journey; once setup is finished it becomes the daily page.
// Existing businesses that already have customers go straight to the daily page.
export default function HomePage() {
  const { activeBusinessId: businessId } = useAuth();
  const { status, error, refresh } = useSetupStatus(businessId);
  const [sessions, setSessions] = useState(null);

  const loadSessions = useCallback(async () => {
    if (!businessId) return;
    try { setSessions(await fetchWhatsAppSessions(businessId)); }
    catch { setSessions((current) => current || []); }
  }, [businessId]);

  useEffect(() => {
    const first = async () => { await loadSessions(); };
    first();
    const timer = setInterval(loadSessions, 30000);
    return () => clearInterval(timer);
  }, [loadSessions]);

  if (!businessId) return <div className="py-16 text-center text-sm text-slate-400">Choose a business to begin.</div>;
  if (!status || sessions === null) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        {error ? (
          <>
            <p>{error}</p>
            <button type="button" onClick={refresh} className="mt-3 rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50">Try again</button>
          </>
        ) : 'Loading...'}
      </div>
    );
  }

  const finished = status.answers?.finished === true;
  const alreadyInUse = status.status === 'idle' && (status.counters?.customers || 0) > 0;

  const retrySetup = async () => { await startSetup(businessId); await refresh(); };
  if (finished || alreadyInUse) return <DailyMode businessId={businessId} connected={sessions.length > 0} status={status} onRetrySetup={retrySetup} />;
  return <SetupMode businessId={businessId} status={status} refresh={refresh} sessions={sessions} refreshSessions={loadSessions} />;
}
