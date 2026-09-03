export default function Stepper({ steps, currentIndex }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              i === currentIndex ? 'bg-[#28A745] text-white' : i < currentIndex ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {i + 1}
          </span>
          <span className={i === currentIndex ? 'text-slate-900' : 'text-slate-400'}>{label}</span>
          {i < steps.length - 1 && <span className="h-px w-6 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}