// Circular progress ring for a single 0-100 score, ported from analytics.js's
// buildScoreRing() (ad quality score). Color follows the same thresholds
// used elsewhere (green/orange/red) rather than the original's fixed brand color.
export default function ScoreRing({ score, size = 52, thickness = 5 }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  const color = score >= 75 ? '#28A745' : score >= 50 ? '#FF8C00' : '#ef4444';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#f1f5f9" strokeWidth={thickness} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-slate-900">
        {Math.round(score)}
      </div>
    </div>
  );
}