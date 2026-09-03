import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) setError(signInError.message);
    setSubmitting(false);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fbf9] px-5 py-10 text-[#0f172a]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#28A745]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#FF8C00]/15 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-2xl shadow-[#28A745]/10 backdrop-blur-xl sm:p-10">
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#28A745]">HeySasa</p>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to your workspace.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <span className="relative mt-2 block">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 outline-none transition focus:border-[#28A745] focus:ring-4 focus:ring-[#28A745]/10" />
            </span>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <span className="relative mt-2 block">
              <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 outline-none transition focus:border-[#28A745] focus:ring-4 focus:ring-[#28A745]/10" />
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] font-bold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#218838] disabled:cursor-wait disabled:opacity-60">
            {submitting ? 'Signing in...' : 'Sign in'}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </section>
    </main>
  );
}