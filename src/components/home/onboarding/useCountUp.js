import { useEffect, useRef, useState } from 'react';

// Counts up to `target` so a number feels earned instead of simply appearing. When the target changes it
// carries on from where it is. With "reduce motion" on it jumps straight to the final value.
export function useCountUp(target, ms = 1400) {
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    const end = Number(target) || 0;
    const from = shown.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let startedAt = null;
    const step = (now) => {
      if (startedAt === null) startedAt = now;
      const t = reduce ? 1 : Math.min(1, (now - startedAt) / ms);
      const eased = 1 - (1 - t) ** 3;
      shown.current = from + (end - from) * eased;
      setValue(shown.current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}
