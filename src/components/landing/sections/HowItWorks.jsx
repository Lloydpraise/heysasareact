import {
  CheckCircle2,
  MessageCircle,
  Users,
  Clock3,
  ArrowRight,
} from 'lucide-react';

const LEADS = [
  {
    name: 'Sarah M.',
    reason: 'Ready to buy',
    style: 'bg-[#28A745]/10 text-[#218838] border-[#28A745]/20',
  },
  {
    name: 'James K.',
    reason: 'Needs follow-up',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    name: 'Amina W.',
    reason: 'Keep warm',
    style: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">

        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[#218838]">
            The problem
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            You did the hard part.{' '}
            <span className="text-[#218838]">
              HeySasa takes it from here.
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Your ads and social media bring people to your business.
            HeySasa helps turn those enquiries into opportunities — without
            making you chase every conversation yourself.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* Respond */}
          <div className="flex flex-col rounded-[1.75rem] border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm">

            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#28A745]/10">
              <MessageCircle className="h-5 w-5 text-[#218838]" />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 1
            </p>

            <h3 className="mb-3 text-xl font-bold text-slate-900">
              Respond to every enquiry
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Customers shouldn't have to wait hours for an answer.
              HeySasa responds to enquiries and keeps conversations moving,
              even when you're busy.
            </p>

            <div className="mt-auto rounded-xl border border-slate-100 bg-white p-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#28A745]/10">
                  <MessageCircle className="h-4 w-4 text-[#218838]" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    New enquiry
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Response handled
                  </p>
                </div>

                <CheckCircle2 className="ml-auto h-4 w-4 text-[#28A745]" />
              </div>
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col rounded-[1.75rem] border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm">

            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Users className="h-5 w-5 text-amber-600" />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 2
            </p>

            <h3 className="mb-3 text-xl font-bold text-slate-900">
              Find the leads worth your time
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Not everyone who messages you is ready to buy today.
              HeySasa helps you see which conversations need your attention
              and which ones can keep warming up.
            </p>

            <div className="mt-auto rounded-xl border border-slate-100 bg-white p-3 shadow-inner">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your leads
              </p>

              <div className="space-y-2">
                {LEADS.map((lead) => (
                  <div
                    key={lead.name}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-xs font-semibold text-slate-700">
                      {lead.name}
                    </span>

                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${lead.style}`}
                    >
                      {lead.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keep Warm */}
          <div className="flex flex-col rounded-[1.75rem] border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm">

            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Clock3 className="h-5 w-5 text-blue-600" />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 3
            </p>

            <h3 className="mb-3 text-xl font-bold text-slate-900">
              Keep the rest warm
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Some customers aren't ready today. That doesn't mean they're
              lost. HeySasa keeps following up and keeps the relationship alive
              until they're ready.
            </p>

            <div className="mt-auto space-y-2.5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-600">
                  Customer not ready yet
                </span>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="h-4 w-4 rotate-90" />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#28A745]/20 bg-[#28A745]/10 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#218838]" />
                <span className="text-xs font-medium text-[#218838]">
                  Follow-up sent — lead stays warm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Core value proposition */}
        <div className="mx-auto mt-14 max-w-3xl rounded-[1.5rem] border border-[#28A745]/15 bg-[#28A745]/5 p-7 text-center">
          <p className="text-sm font-medium text-slate-500">
            And this is the part that matters:
          </p>

          <h3 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            Focus your attention on the leads that{' '}
            <span className="text-[#218838]">
              actually bring you money.
            </span>
          </h3>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            HeySasa keeps the rest of your leads engaged, so you're not
            spending your day chasing every person who has ever messaged you.
          </p>
        </div>

      </div>
    </section>
  );
}