// SequenceStepCard.jsx
export default function SequenceStepCard({ step, index }) {
  const sentCount = step.sentCount ?? 0;
  const repliedCount = step.repliedCount ?? 0;
  const repliedPct = sentCount ? Math.round((repliedCount / sentCount) * 100) : 0;

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-5 space-y-2">
      <div className="flex items-center gap-2 text-[12px]">
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          Step {index + 1}{index === 0 ? ' \u00b7 Mandatory' : ''}
        </span>
        {step.condition && (
          <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-medium text-amber-700">Conditional</span>
        )}
      </div>
      <p className="text-[11px] text-slate-400">
        {index === 0 ? 'Immediate on Enrollment' : `+${step.delayHours}h after Step ${index}`}
      </p>
      <p className="rounded-lg bg-slate-50 p-3 text-[12px] text-slate-700">{step.content}</p>
      <p className="text-[11px] text-slate-400">
        {sentCount} Sent \u00b7 {repliedCount} Replied ({repliedPct}%)
        {step.optOuts > 0 && <span className="text-red-400"> \u00b7 {step.optOuts} Opt-Outs</span>}
      </p>
    </div>
  );
}