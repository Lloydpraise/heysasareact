import { ArrowRight, MapPin } from 'lucide-react';

// "It's over here": shown when the assistant points the owner at a page (or at something only they can do).
export default function GuideCard({ guide, goTo }) {
  return (
    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900"><MapPin size={14} className="text-[#28A745]" /> {guide.label}</p>
      <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-[12.5px] text-slate-600">
        {guide.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      {guide.nav?.tab && (
        <button
          type="button" onClick={() => goTo(guide.nav)}
          className="mt-2.5 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-slate-900 px-4 text-[13px] font-semibold text-white hover:bg-slate-700"
        >
          Take me there <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
