import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { fetchWhatsAppSessions, subscribeToWhatsAppSessions } from '../../services/businessService';
import { startSetup } from '../../services/setupService';
import SetupMode from './SetupMode';
import DailyMode from './DailyMode';
import { isOnboarding } from './setupGate';
import useRefreshOnFocus from '../../hooks/useRefreshOnFocus';

// The app shell clips its pages, so every page brings its own scroll area. Home's is here: the one place that
// scrolls, with the page padding, for the setup journey, the daily page and the loading state alike.
function Scroll({ children }) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain p-3 pb-8 sm:p-4 md:p-5">
      {children}
    </div>
  );
}

// One screen, two modes. Day one it is the setup journey; once setup is finished it becomes the daily page.
// Existing businesses that already have customers go straight to the daily page.
// `setup` is the setup status the app shell already holds (it also decides whether the sidebar is locked), so there is
// one status check for the whole app, not one per screen. `onFinish` tells the shell the owner just finished setup.
export default function HomePage({ setup, onFinish }) {
  const { activeBusinessId: businessId } = useAuth();
  const { status, error, refresh } = setup;
  const [sessions, setSessions] = useState(null);

  const loadSessions = useCallback(async () => {
    if (!businessId) return;
    try { setSessions(await fetchWhatsAppSessions(businessId)); }
    catch { setSessions((current) => current || []); }
  }, [businessId]);

  useEffect(() => {
    const first = async () => { await loadSessions(); };
    first();
    // Connection changes arrive over realtime (whatsapp_sessions is in the publication) instead of a 30s poll.
    return subscribeToWhatsAppSessions(businessId, loadSessions);
  }, [loadSessions, businessId]);
  useRefreshOnFocus(loadSessions);

  if (!businessId) return <Scroll><div className="py-16 text-center text-sm text-slate-400">Choose a business to begin.</div></Scroll>;
  if (!status || sessions === null) {
    if (error) {
      return (
        <Scroll>
          <div className="py-16 text-center text-sm text-slate-400">
            <p>{error}</p>
            <button type="button" onClick={refresh} className="mt-3 rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50">Try again</button>
          </div>
        </Scroll>
      );
    }
    // Quiet placeholder cards, so the page does not jump when Home arrives.
    return (
      <Scroll>
        <div className="mx-auto w-full max-w-3xl space-y-4" aria-busy="true" aria-label="Loading Home">
          <div className="h-12 w-2/5 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
          <div className="h-40 animate-pulse rounded-[14px] bg-slate-100 motion-reduce:animate-none" />
          <div className="h-32 animate-pulse rounded-[14px] bg-slate-100 motion-reduce:animate-none" />
        </div>
      </Scroll>
    );
  }

  const retrySetup = async () => { await startSetup(businessId); await refresh(); };
  if (!isOnboarding(status)) {
    return <Scroll><DailyMode businessId={businessId} connected={sessions.length > 0} status={status} onRetrySetup={retrySetup} /></Scroll>;
  }
  return <Scroll><SetupMode businessId={businessId} status={status} refresh={refresh} sessions={sessions} refreshSessions={loadSessions} onFinish={onFinish} /></Scroll>;
}
