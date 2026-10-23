import { intentTone } from '../../../utils/leadHelpers';

// A small round number for how likely this lead is to buy (0-100).
// 70 and up is hot (red), 40 to 69 is medium (orange), below 40 is cold (blue).
// Without a score it draws nothing, or a grey dash when showEmpty is set so list rows stay aligned.
export default function IntentBadge({ score, size = 'md', showEmpty = false, className = '' }) {
  const tone = intentTone(score);
  const dimension = size === 'sm' ? 'h-6 w-6 text-[10.5px]' : 'h-7 w-7 text-[11.5px]';
  if (tone.key === 'none') {
    if (!showEmpty) return null;
    return (
      <span
        title="Not analysed yet, so no intent score"
        aria-label="No intent score yet"
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none ring-2 ${dimension} ${tone.badgeClass} ${className}`}
      >
        {'\u2013'}
      </span>
    );
  }
  return (
    <span
      title={`${tone.label} intent (${Math.round(Number(score))}/100)`}
      aria-label={`Intent ${Math.round(Number(score))} out of 100`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none ring-2 ${dimension} ${tone.badgeClass} ${className}`}
    >
      {Math.round(Number(score))}
    </span>
  );
}
