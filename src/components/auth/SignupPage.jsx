import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

// Placeholder only — real self-serve signup is a later build (see
// heysasa.md Phase 4 / onboarding flow). For now every path to becoming
// a customer runs through the waitlist, so this page's only job is to
// send people there without looking like a dead end.
export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fbf9] px-5 py-10 text-[#0f172a]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#28A745]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#FF8C00]/15 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/80 bg-white/80 p-8 text-center shadow-2xl shadow-[#28A745]/10 backdrop-blur-xl sm:p-10">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#FF8C00]" />
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#28A745]">HeySasa</p>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Sign-up is opening soon</h1>
        <p className="mb-8 text-sm text-slate-500">
          We're onboarding founding businesses by hand for now. Join the waiting list and
          we'll reach out the moment there's a spot.
        </p>
        <Link
          to="/?waitlist=1"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] font-bold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#218838]"
        >
          Join the Waiting List
        </Link>
        <Link
          to="/login"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Already have an account? Log in
        </Link>
      </section>
    </main>
  );
}
