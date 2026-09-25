import { ArrowRight } from 'lucide-react';
import logo from '../../../assets/images/heysasalogo.png';

export function FinalCTA({ onJoinWaitlist }) {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Don't believe it'll work?
        </h2>
        <p className="mb-2 text-slate-600">
          Join the waiting list. We'll run the exact same follow-up system on you — no
          human touch, nothing special about your case.
        </p>
        <p className="mb-8 text-lg font-semibold text-slate-900">
          If it can't convince you, it can't convince your customers.
        </p>
        <button
          onClick={onJoinWaitlist}
          className="inline-flex h-13 items-center gap-2 rounded-full bg-[#28A745] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#28A745]/30 transition hover:-translate-y-0.5 hover:bg-[#218838] hover:shadow-xl"
        >
          Join the Waiting List
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

export function Footer({ onJoinWaitlist }) {
  return (
    <footer className="bg-[#080A09] px-5 pb-6 pt-14 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="/" aria-label="HeySasa home" className="inline-block">
              <img src={logo} alt="HeySasa" className="h-8 w-auto brightness-0 invert" />
            </a>
            <p className="mt-5 text-sm leading-6 text-white/60">
              Turn the WhatsApp conversations you already have into more sales,
              with follow-up that feels human and never lets a good lead go cold.
            </p>
            <button
              onClick={onJoinWaitlist}
              className="mt-6 text-sm font-semibold text-[#62D979] transition hover:text-white"
            >
              Join the waitlist <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Explore
            </h2>
            <nav aria-label="Quick links" className="mt-5 flex flex-col items-start gap-3 text-sm text-white/70">
              <a href="/" className="transition hover:text-white">Home</a>
              <a href="#how-it-works" className="transition hover:text-white">How it works</a>
              <a href="#founding-offer" className="transition hover:text-white">Founding offer</a>
              <a href="#faq" className="transition hover:text-white">FAQ</a>
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Stay in touch
            </h2>
            <nav aria-label="Policy and contact links" className="mt-5 flex flex-col items-start gap-3 text-sm text-white/70">
              <a href="/terms" className="transition hover:text-white">Terms of service</a>
              <a href="/privacy" className="transition hover:text-white">Privacy policy</a>
              <a href="mailto:hello@heysasa.co.ke" className="transition hover:text-white">Contact us</a>
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>Built in Nairobi for businesses that sell through WhatsApp.</p>
          <p>&copy; {new Date().getFullYear()} HeySasa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
