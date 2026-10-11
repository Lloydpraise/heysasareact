import { intentTone } from '../../../utils/leadHelpers';

// A small round number for how likely this lead is to buy (0-100).
// 80 and up is green, 40 to 79 is orange, below 40 is red. Nothing is drawn until the lead has a score.
export default function IntentBadge({ score, size = 'md', className = '' }) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return null;
  const tone = intentTone(score);
  const dimension = size === 'sm' ? 'h-6 w-6 text-[10.5px]' : 'h-7 w-7 text-[11.5px]';
  return (
    <span
      title={`${tone.label} (${Math.round(Number(score))}/100)`}
      aria-label={`Intent ${Math.round(Number(score))} out of 100`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none ring-2 ${dimension} ${tone.badgeClass} ${className}`}
    >
      {Math.round(Number(score))}
    </span>
  );
}
