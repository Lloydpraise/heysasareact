// Who HeySasa answers on its own: leads from your ads, leads ready to buy, or every business lead.
// "Everyone" and the two smaller groups exclude each other, and at least one must stay picked.
import { AUDIENCE_OPTIONS, toggleAudience } from './audienceOptions';

export default function AudiencePicker({ value = ['all'], onChange, disabled = false }) {
  return (
    <fieldset className="mt-3" disabled={disabled}>
      <legend className="text-sm font-medium text-slate-700">Who should HeySasa answer?</legend>
      <div className="mt-2 space-y-2">
        {AUDIENCE_OPTIONS.map((o) => {
          const on = value.includes(o.id);
          return (
            <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${on ? 'border-[#28A745] bg-[#28A745]/5' : 'border-slate-200 bg-white hover:border-[#28A745]/50'}`}>
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#28A745]" checked={on} onChange={() => onChange(toggleAudience(value, o.id))} />
              <span>
                <span className="block text-sm font-semibold text-slate-800">{o.label}</span>
                <span className="block text-xs text-slate-500">{o.plain}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">Everyone else you answer yourself. Once HeySasa has started a chat, it finishes that chat.</p>
    </fieldset>
  );
}
