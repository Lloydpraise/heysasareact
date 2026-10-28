import { useEffect, useRef } from 'react';

// Runs `refresh` when the user comes back to the tab (or the window regains focus), at most once per `minGapMs`.
// Replaces setInterval polling on the home screen: nothing there changes while nobody is looking, so every timer tick
// was a billed Supabase request for a screen that was often in a background tab.
export default function useRefreshOnFocus(refresh, minGapMs = 15_000) {
  const refreshRef = useRef(refresh);
  const lastRunRef = useRef(0);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  useEffect(() => {
    lastRunRef.current = Date.now();
    const onWake = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastRunRef.current < minGapMs) return;
      lastRunRef.current = Date.now();
      refreshRef.current?.();
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [minGapMs]);
}
