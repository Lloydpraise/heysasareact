import { Check } from 'lucide-react';

export default function FoundingOffer({ onJoinWaitlist }) {
  return (
    <section id="founding-offer" className="px-5 py-16 lg:py-20">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#28A745]/20 bg-gradient-to-br from-[#28A745]/10 via-white to-[#FF8C00]/5 p-8 text-center shadow-sm sm:p-12">

        <p className="mb-3 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#218838] shadow-sm">
          Early access
        </p>

        <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Don't take our word for it.
          <span className="block text-[#218838]">
            See it on your own business.
          </span>
        </h2>

        <p className="mx-auto mb-8 max-w-xl text-slate-600">
          Join the waiting list and be among the first businesses to
          experience HeySasa. We'll show you what it can find in your
          WhatsApp and how it can help you turn more enquiries into sales.
        </p>

        <ul className="mx-auto mb-8 max-w-md space-y-3 text-left">
          {[
            'See which leads need your attention',
            'See how HeySasa follows up with your leads',
            'Keep interested customers warm until they are ready',
            'Get personal help getting started',
            'Lock in the founding price for 12 months',
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-slate-700"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#28A745]" />
              {item}
            </li>
          ))}
        </ul>

        <button
          onClick={onJoinWaitlist}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#28A745] px-8 font-semibold text-white shadow-lg shadow-[#28A745]/30 transition hover:bg-[#218838]"
        >
          Join the Waiting List
        </button>

        <p className="mt-4 text-xs text-slate-400">
          If HeySasa can convince you, it can convince your customers.
        </p>

      </div>
    </section>
  );
}