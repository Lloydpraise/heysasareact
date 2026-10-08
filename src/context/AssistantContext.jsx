import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AssistantContext } from './assistant-context-value';
import AssistantPanel from '../components/assistant/AssistantPanel';
import { useIsMobile } from '../hooks/useIsMobile';

const OPEN_KEY = 'heysasa:assistant-open';
const PAGE_LABELS = { analytics: 'Analytics', leads: 'Leads', 'lists-campaigns': 'Campaigns', playground: 'Playground', products: 'Products', preferences: 'Preferences' };

// Holds "which box is Ask HeySasa open for" and renders the shared chat panel.
//
// The general chat is STICKY: it stays mounted while the owner moves around the app (tabs, pages, Back button), so
// they can follow its lead. It only closes when they press X. On phones it can be tucked away into a small floating
// button ("minimized") without losing the chat, which is what lets them look at the page it pointed them to.
export function AssistantProvider({ businessId, page, children }) {
  // After a reload, the general chat comes back if it was open.
  const [target, setTarget] = useState(() => {
    try { return sessionStorage.getItem(OPEN_KEY) === '1' ? { surface: 'general', contextKey: 'general:main', title: 'Ask HeySasa', openedAt: Date.now() } : null; } catch { return null; }
  });
  const [minimized, setMinimized] = useState(false);
  const [badge, setBadge] = useState(0);
  const isMobile = useIsMobile();

  const open = useCallback((options = {}) => {
    const surface = options.surface || 'general';
    setMinimized(false);
    setTarget((prev) => {
      // Opening the general chat while it is already open just brings it back. Nothing resets.
      if (surface === 'general' && prev?.surface === 'general') return prev;
      return {
        ...options, surface, openedAt: Date.now(),
        ...(surface === 'general' ? { contextKey: 'general:main', title: options.title || 'Ask HeySasa' } : {}),
      };
    });
  }, []);

  const close = useCallback(() => {
    setTarget(null); setMinimized(false); setBadge(0);
    try { sessionStorage.removeItem(OPEN_KEY); } catch { /* private mode: nothing to forget */ }
  }, []);

  useEffect(() => {
    try { if (target?.surface === 'general') sessionStorage.setItem(OPEN_KEY, '1'); } catch { /* ignore */ }
  }, [target]);

  // "Take me there": the app listens for this and switches page; on a phone the chat tucks away so the page shows.
  const goTo = useCallback((nav) => {
    if (!nav?.tab) return;
    window.dispatchEvent(new CustomEvent('heysasa:navigate', { detail: nav }));
    if (isMobile) setMinimized(true);
  }, [isMobile]);

  const value = useMemo(() => ({
    open, close, isOpen: !!target, minimize: () => setMinimized(true), restore: () => setMinimized(false), goTo,
  }), [open, close, target, goTo]);

  return (
    <AssistantContext.Provider value={value}>
      <div className="flex h-dvh min-h-0 w-full overflow-hidden">
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
        {target && (
          <AssistantPanel
            key={`${businessId}:${target.openedAt}`}
            businessId={businessId}
            target={target}
            onClose={close}
            isMobile={isMobile}
            minimized={minimized}
            onMinimize={() => setMinimized(true)}
            onBadge={setBadge}
            pageLabel={PAGE_LABELS[page] || ''}
            goTo={goTo}
          />
        )}
      </div>
      {target && isMobile && minimized && (
        <button
          type="button" onClick={() => setMinimized(false)} aria-label="Back to Ask HeySasa"
          className="fixed right-4 z-[65] flex h-12 items-center gap-2 rounded-full bg-[#28A745] pl-3.5 pr-4 text-sm font-semibold text-white shadow-lg active:scale-95 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)]"
        >
          <Sparkles size={17} /> Ask HeySasa
          {badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#1f8d3d]">{badge}</span>}
        </button>
      )}
    </AssistantContext.Provider>
  );
}
