import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const SCRIPT = [
  { side: 'in', text: 'Hi, is the rose gold set still available?', time: '2:14 PM' },
  { side: 'gap', label: '4 days of silence' },
  { side: 'out', text: "Hey! Sorry for the wait — yes, it's still available. Want me to hold one for you? 💚", time: 'Today, 9:02 AM' },
  { side: 'in', text: "Omg yes please! I thought you'd forgotten about me 😅", time: '9:04 AM' },
];

export default function Hero({ onJoinWaitlist }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= SCRIPT.length) return;

    const delay =
      visible === 0
        ? 700
        : SCRIPT[visible - 1].side === 'gap'
          ? 900
          : 1400;

    const timer = setTimeout(() => setVisible((v) => v + 1), delay);

    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:pt-36 lg:pb-28 lg:pt-44">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#28A745]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-20 h-[24rem] w-[24rem] rounded-full bg-[#FF8C00]/15 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-14 lg:flex-row">
        <div className="text-center lg:w-1/2 lg:text-left">

          <p className="mb-4 inline-block rounded-full bg-[#28A745]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#218838]">
            Turn more enquiries into sales
          </p>

          <h1 className="mb-6 text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            There Is Gold Buried in Your WhatsApp.
            <span className="block bg-gradient-to-r from-[#FF8C00] to-[#28A745] bg-clip-text text-transparent">
              And You Don't Know It Yet.
            </span>
          </h1>

          <p className="mx-auto mb-4 max-w-xl text-xl font-medium leading-relaxed text-slate-700 lg:mx-0">
            Getting enquiries is not enough. You want sales.
          </p>

          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-600 lg:mx-0">
            You spend money on ads, create content, and work hard to get people
            interested in your business. Then they message you on WhatsApp — and
            many of those leads go cold.
          </p>

          <p className="mx-auto mb-8 max-w-xl text-base font-medium leading-relaxed text-slate-700 lg:mx-0">
            HeySasa helps you respond faster, follow up, spot the leads worth
            your time, and keep the rest warm until they’re ready to buy.
          </p>

          <button
            onClick={onJoinWaitlist}
            className="inline-flex h-13 items-center gap-2 rounded-full bg-[#28A745] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#28A745]/30 transition hover:-translate-y-0.5 hover:bg-[#218838] hover:shadow-xl hover:shadow-[#28A745]/40"
          >
            Join the Waiting List
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-xs text-slate-400">
            Experience HeySasa on your own business before you decide.
          </p>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="mx-auto flex h-[460px] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">

            <div className="flex items-center gap-3 bg-[#008069] px-4 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-sm font-bold text-white">
                LS
              </div>

              <div>
                <p className="text-sm font-semibold leading-tight text-white">
                  Lashes by Shazz
                </p>
                <p className="text-[11px] text-white/80">
                  WhatsApp Business
                </p>
              </div>
            </div>

            <div
              className="flex-1 space-y-3 overflow-y-auto p-4"
              style={{ background: '#E5DDD5' }}
            >
              {SCRIPT.slice(0, visible).map((msg, i) =>
                msg.side === 'gap' ? (
                  <div key={i} className="flex justify-center">
                    <span className="rounded-full bg-white/70 px-3 py-1 text-[10.5px] font-medium text-slate-500 shadow-sm">
                      {msg.label}
                    </span>
                  </div>
                ) : (
                  <div
                    key={i}
                    className={`flex ${
                      msg.side === 'out'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] shadow-sm ${
                        msg.side === 'out'
                          ? 'rounded-tr-none bg-[#DCF8C6] text-slate-800'
                          : 'rounded-tl-none bg-white text-slate-800'
                      }`}
                    >
                      {msg.text}
                      <span className="mt-1 block text-right text-[10px] text-slate-400">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-2 bg-[#F0F0F0] p-3">
              <div className="h-9 flex-1 rounded-full bg-white px-4 text-sm leading-9 text-slate-300">
                Type a message
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}