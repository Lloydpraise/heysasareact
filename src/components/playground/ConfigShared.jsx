export const inputClass = 'w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#28A745]/50 focus:ring-2 focus:ring-[#28A745]/10';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-snug text-[#94A3B8]">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-600">
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-[#28A745]' : 'bg-slate-300'}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-[1.1rem]' : 'translate-x-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-500',
    green: 'bg-[#28A745]/10 text-[#1f8d3d]',
    orange: 'bg-[#FF8C00]/10 text-[#c26a00]',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function ListRow({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-[#28A745]/40 bg-[#28A745]/10' : 'border-transparent hover:bg-slate-100/80'}`}
    >
      {children}
    </button>
  );
}

export const primaryButton = 'rounded-full bg-[#28A745] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-50';
export const ghostButton = 'rounded-full border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-[#64748B] transition hover:border-[#28A745]/40 hover:text-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-40';
export const dangerButton = 'rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40';
