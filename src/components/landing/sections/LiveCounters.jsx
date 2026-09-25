import { useEffect, useRef, useState } from 'react';
import { fetchPublicStats } from '../../../services/publicStatsService';

const LOGOS = ['Vvstudios', 'Lashes by Shazz', 'The Beauty Vault'];

function useCountUp(target) {
  const [display, setDisplay] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target == null) return;
    const from = prevTarget.current;
    const to = target;
    prevTarget.current = to;
    if (from === to) return;

    const duration = 900;
    const start = performance.now();
    let frame;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return display;
}

function Counter({ value, label, sub }) {
  const shown = useCountUp(value);
  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm">
      <p className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-5xl">
        {value == null ? '—' : shown.toLocaleString()}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function LiveCounters() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchPublicStats();
        if (!cancelled) setStats(data);
      } catch {
        // Leave whatever was last shown rather than flashing to zero on
        // a transient network hiccup.
      }
    };
    load();
    const interval = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <section className="px-5 py-4">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Counter
          value={stats?.messagesAnalyzed ?? null}
          label="WhatsApp messages analyzed"
          sub="Every one read for who's ready to buy"
        />
        <Counter
          value={stats?.responsesReceived ?? null}
          label="Responses received"
          sub="Real replies, not just deliveries"
        />
        <div className="rounded-2xl border border-white/70 bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm">
          <p className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-5xl">
            {stats?.businessesInPipeline == null ? '—' : stats.businessesInPipeline.toLocaleString()}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">Businesses in the pipeline</p>
          <p className="mt-1 text-xs text-[#218838]">
            {stats?.businessesActive == null ? '—' : stats.businessesActive} actively sending right now
          </p>
        </div>
      </div>

      <p className="mx-auto mt-14 max-w-lg text-center text-sm text-slate-500">
        Not the only one wondering if this actually works. Good — you shouldn't take our word for it.
      </p>

      <div className="mx-auto mt-6 max-w-3xl">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
          Businesses sending real follow-ups with HeySasa
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {LOGOS.map((name) => (
            <span
              key={name}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-500"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
