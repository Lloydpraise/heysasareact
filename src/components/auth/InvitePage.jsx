import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { acceptInvite } from '../../services/accountsService';
import { clearAccountSelection } from '../../lib/accountScope';

export const PENDING_INVITE_KEY = 'heysasa:pending_invite';

function rememberInvite(token) {
  try { localStorage.setItem(PENDING_INVITE_KEY, token); } catch { /* ignore */ }
}

function forgetInvite() {
  try { localStorage.removeItem(PENDING_INVITE_KEY); } catch { /* ignore */ }
}

// /invite/:token. Signed out: asks the person to sign in (the invite is remembered and opened again afterwards).
// Signed in: joins the business, then opens it.
export default function InvitePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'idle', message: '' });
  const started = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (!user) { rememberInvite(token); return; }
    if (started.current) return;
    started.current = true;
    Promise.resolve().then(() => setState({ status: 'joining', message: '' }));
    acceptInvite(token)
      .then((result) => {
        forgetInvite();
        setState({ status: 'joined', message: '' });
        if (result.businessId) {
          clearAccountSelection();
          localStorage.setItem('business_id', result.businessId);
          window.currentBusinessId = result.businessId;
        }
        setTimeout(() => window.location.replace('/'), 900);
      })
      .catch((error) => {
        forgetInvite();
        setState({ status: 'failed', message: error.message || 'Could not accept this invite.' });
      });
  }, [token, user]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fbf9] px-5 py-10 text-[#0f172a]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#28A745]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#FF8C00]/15 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/80 bg-white/80 p-8 text-center shadow-2xl shadow-[#28A745]/10 backdrop-blur-xl sm:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#28A745]/10 text-[#28A745]">
          {state.status === 'joined' ? <CheckCircle2 className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#28A745]">HeySasa</p>
        {!user && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">You have been invited</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in with the email this invite was sent to. We will add you to the business straight after.</p>
            <Link to="/login" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#28A745] text-sm font-bold text-white hover:bg-[#1f8d3d]">Sign in to accept</Link>
            <Link to="/signup" className="mt-3 block text-sm font-semibold text-[#28A745] hover:underline">New to HeySasa? Create an account</Link>
          </>
        )}
        {user && (state.status === 'joining' || state.status === 'idle') && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Joining the business...</h1>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Please wait a moment.</p>
          </>
        )}
        {user && state.status === 'joined' && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">You are in</h1>
            <p className="mt-2 text-sm text-slate-500">Opening the business for you...</p>
          </>
        )}
        {user && state.status === 'failed' && (
          <>
            <h1 className="text-2xl font-bold tracking-tight">This invite did not work</h1>
            <p role="alert" className="mt-2 text-sm text-red-600">{state.message}</p>
            <a href="/" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#28A745] text-sm font-bold text-white hover:bg-[#1f8d3d]">Go to my workspace</a>
          </>
        )}
      </section>
    </main>
  );
}
