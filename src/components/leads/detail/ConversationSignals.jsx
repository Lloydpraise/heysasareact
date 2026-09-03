import { AlertTriangle, Building2, HelpCircle } from 'lucide-react';
import { formatInterest } from '../../../utils/leadHelpers';

// Reusable block showing what came up in the conversation that isn't
// captured elsewhere: objections raised, competitors mentioned, and
// pre-purchase questions asked. Used in both the detail panel and
// ProfileDrawer, so it takes the raw arrays as props rather than a whole
// lead object.
//
// Props: objections=[], competitors=[], questions=[]
export default function ConversationSignals({ objections = [], competitors = [], questions = [] }) {
  if (objections.length === 0 && competitors.length === 0 && questions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-6 py-3">
      {objections.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <AlertTriangle size={12} /> Objections
          </div>
          <div className="flex flex-wrap gap-1.5">
            {objections.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-medium text-red-600"
              >
                {formatInterest(tag)}
              </span>
            ))}
          </div>
        </div>
      )}

      {competitors.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <Building2 size={12} /> Competitor mentions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {competitors.map((name) => (
              <span
                key={name}
                className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[11.5px] font-medium text-[#FF8C00]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <HelpCircle size={12} /> Pre-purchase questions
          </div>
          <ul className="flex flex-col gap-1">
            {questions.map((q, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[12.5px] text-slate-600">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}