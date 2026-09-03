import { DEFAULT_SEQUENCE, KLT_CONFIG } from '../../../constants/followupSequence';

const PHASES = ['Know', 'Like', 'Trust', 'Convert'];

// Solid fill colors for a *reached* segment of the bar. Know/Like stay
// neutral slate (still building familiarity); Trust/Convert switch to
// brand green (closer to a sale) — matching the emphasis KLT_CONFIG
// already encodes for text, just as a solid bar fill instead of a tint.
const PHASE_FILL = {
  Know: 'bg-slate-400',
  Like: 'bg-slate-500',
  Trust: 'bg-[#28A745]',
  Convert: 'bg-[#28A745]',
};

// Horizontal 4-segment bar showing which KLT phase the lead's follow-up
// sequence is currently in, based on currentStep (1-11).
export default function PhaseBar({ currentStep }) {
  const currentPhase = DEFAULT_SEQUENCE.find((s) => s.step === currentStep)?.klt || 'Know';
  const currentPhaseIndex = PHASES.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1 px-6 pt-3">
      {PHASES.map((phase, i) => {
        const config = KLT_CONFIG[phase];
        const reached = i <= currentPhaseIndex;
        return (
          <div key={phase} className="flex flex-1 flex-col gap-1">
            <div className={`h-1.5 rounded-full ${reached ? PHASE_FILL[phase] : 'bg-slate-100'}`} />
            <span
              className={`text-center text-[10px] font-semibold uppercase tracking-wide ${
                i === currentPhaseIndex ? config.text : 'text-slate-300'
              }`}
            >
              {phase}
            </span>
          </div>
        );
      })}
    </div>
  );
}