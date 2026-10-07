import { useCallback, useMemo, useState } from 'react';
import { AssistantContext } from './assistant-context-value';
import AssistantPanel from '../components/assistant/AssistantPanel';
import { useIsMobile } from '../hooks/useIsMobile';

// Holds "which box is Ask HeySasa open for" and renders the shared chat panel.
export function AssistantProvider({ businessId, children }) {
  const [target, setTarget] = useState(null);
  const isMobile = useIsMobile();

  const open = useCallback((options) => setTarget({ ...options, openedAt: Date.now() }), []);
  const close = useCallback(() => setTarget(null), []);
  const value = useMemo(() => ({ open, close, isOpen: !!target }), [open, close, target]);

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
          />
        )}
      </div>
    </AssistantContext.Provider>
  );
}
