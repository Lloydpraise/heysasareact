import {
  Clock3, Star, Lightbulb, BadgeCheck, Gift, Shuffle, BookOpen, Flame,
  HeartHandshake, CheckCircle2, DoorOpen, Check,
} from 'lucide-react';
import { DEFAULT_SEQUENCE, TOUCHPOINT_ICON_NAME, getCumulativeDays } from '../../../constants/followupSequence';

// Maps the icon-name strings in TOUCHPOINT_ICON_NAME to the actual
// lucide-react components — keeps followupSequence.js free of JSX/React
// imports since it's plain config.
const ICON_COMPONENTS = {
  Clock3, Star, Lightbulb, BadgeCheck, Gift, Shuffle, BookOpen, Flame,
  HeartHandshake, CheckCircle2, DoorOpen,
};

// Vertical list of all 11 sequence steps for a lead. Used inside
// FollowupCard (compact) and reused as-is in FollowupsDrawer / ApprovalDrawer
// for the full view.
//
// Props:
//   sentSteps    — number[] of completed step numbers (lead.followup.sent_steps)
//   currentStep  — number, the step currently active/pending (lead.followup.current_step)
//   compact      — boolean, collapses description text when true
export default function SequenceTimeline({ sentSteps = [], currentStep, compact = false }) {
  return (
    <div className="flex flex-col">
      {DEFAULT_SEQUENCE.map((step, i) => {
        const isDone = sentSteps.includes(step.step);
        const isCurrent = step.step === currentStep && !isDone;
        const isLast = i === DEFAULT_SEQUENCE.length - 1;
        const Icon = ICON_COMPONENTS[TOUCHPOINT_ICON_NAME[step.type]] || Clock3;

        return (
          <div key={step.step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  isDone
                    ? 'bg-[#28A745] text-white'
                    : isCurrent
                    ? 'bg-[#FF8C00]/15 text-[#FF8C00] ring-2 ring-[#FF8C00]/30'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                {isDone ? <Check size={13} /> : <Icon size={13} />}
              </div>
              {!isLast && (
                <div className={`w-px flex-1 ${isDone ? 'bg-[#28A745]/30' : 'bg-slate-150'}`} style={{ minHeight: compact ? 14 : 22 }} />
              )}
            </div>

            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-3'}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[12.5px] font-semibold ${
                    isDone ? 'text-slate-700' : isCurrent ? 'text-[#FF8C00]' : 'text-slate-400'
                  }`}
                >
                  {step.step}. {step.name}
                </span>
                <span className="text-[10px] font-medium text-slate-300">Day {getCumulativeDays(i)}</span>
              </div>
              {!compact && (
                <p className={`mt-0.5 text-[11.5px] leading-snug ${isDone || isCurrent ? 'text-slate-500' : 'text-slate-300'}`}>
                  {step.desc}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}