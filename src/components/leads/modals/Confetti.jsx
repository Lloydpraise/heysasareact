import { useMemo } from 'react';

const COLORS = ['#28A745', '#FF8C00', '#3b82f6', '#f59e0b', '#ef4444'];

// Lightweight burst confetti — plain CSS keyframe animation, no new
// dependency (nothing in package.json does animation, so not pulling one
// in for a single micro-interaction). Purely decorative/pointer-events:none
// so it never blocks the modal underneath.
export default function Confetti({ pieces = 90 }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.15,
        duration: 1.1 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 220,
        size: 8 + Math.random() * 8,
      })),
    [pieces]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute top-1/2 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
            '--drift': `${p.drift}px`,
            '--rotate': `${p.rotate}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--drift), 240px) rotate(var(--rotate)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}