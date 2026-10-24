import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

// Opened from the "set a new password" email. The link signs the person in for this one step, so a new password can
// be saved straight away.
export default function ResetPasswordPage() {
  const { user, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setSaving(true);
    const { error: updateError } = await updatePassword(password);
    setSaving(false);
    if (updateError) setError(updateError.message);
    else setDone(true);
  };

  const input = 'h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 outline-none transition focus:border-[#28A745] focus:ring-4 focus:ring-[#28A745]/10';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fbf9] px-5 py-10 text-[#0f172a]">
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-2xl shadow-[#28A745]/10 backdrop-blur-xl sm:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#28A745]">HeySasa</p>
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Set a new password</h1>
        {done ? (
          <a href="/" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] font-bold text-white">Password saved. Go to your workspace <ArrowRight className="h-4 w-4" /></a>
        ) : !user ? (
          <p className="text-sm text-slate-600">This link has expired or was already used. <a href="/login" className="font-semibold text-[#28A745] hover:underline">Ask for a new one</a> from the sign-in page.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              New password
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={input} />
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Type it again
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className={input} />
              </span>
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button disabled={saving} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#28A745] font-bold text-white disabled:cursor-wait disabled:opacity-60">
              {saving ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
