import { useEffect, useRef, useState } from 'react';

const LEADS_PER_BATCH = 15;

export function useLeadListPagination(items, resetKey) {
  const [paginationState, setPaginationState] = useState({ resetKey, count: LEADS_PER_BATCH });
  const scrollRootRef = useRef(null);
  const sentinelRef = useRef(null);
  const visibleCount = paginationState.resetKey === resetKey
    ? paginationState.count
    : LEADS_PER_BATCH;
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    if (scrollRootRef.current) scrollRootRef.current.scrollTop = 0;
  }, [resetKey]);

  useEffect(() => {
    if (!hasMore || !scrollRootRef.current || !sentinelRef.current) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setPaginationState((current) => {
          const count = current.resetKey === resetKey ? current.count : LEADS_PER_BATCH;
          return {
            resetKey,
            count: Math.min(count + LEADS_PER_BATCH, items.length),
          };
        });
      }
    }, {
      root: scrollRootRef.current,
      rootMargin: '160px',
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, items.length, resetKey]);

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore,
    scrollRootRef,
    sentinelRef,
  };
}
