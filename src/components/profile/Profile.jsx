import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Loader2, LogOut, Plus, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { getBusinessDisplayName } from '../../utils/businessHelpers';

export default function Profile() {
  const { user, signOut, updatePassword, activeBusinessId, getBusinesses, switchBusiness, addBusiness } = useAuth();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [businessesOpen, setBusinessesOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [businessesError, setBusinessesError] = useState('');
  const [addBusinessOpen, setAddBusinessOpen] = useState(false);
  const [businessForm, setBusinessForm] = useState({ name: '', industry: '', websiteUrl: '', billingBusinessId: '' });
  const [businessSaving, setBusinessSaving] = useState(false);
  const name = user?.user_metadata?.business_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'My Business';
  const initials = name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!businessesOpen) return;
    let mounted = true;
    getBusinesses()
      .then((rows) => { if (mounted) setBusinesses(rows); })
      .catch((businessError) => { if (mounted) setBusinessesError(businessError.message || 'Could not load businesses.'); })
      .finally(() => { if (mounted) setBusinessesLoading(false); });
    return () => { mounted = false; };
  }, [businessesOpen, getBusinesses]);

  useEffect(() => {
    const closeMenus = () => {
      setOpen(false);
      setBusinessesOpen(false);
    };
    window.addEventListener('heysasa:sidebar-leave', closeMenus);
    return () => window.removeEventListener('heysasa:sidebar-leave', closeMenus);
  }, []);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    const { error: updateError } = await updatePassword(password);
    if (updateError) return setError(updateError.message);
    setPassword('');
    setConfirmPassword('');
    setMessage('Password updated successfully.');
  };

  const handleCreateBusiness = async (event) => {
    event.preventDefault();
    setBusinessSaving(true);
    setError('');
    try {
      await addBusiness(businessForm);
    } catch (businessError) {
      setError(businessError.message || 'Could not create business.');
      setBusinessSaving(false);
    }
  };

  return (
    <div className="relative">
      <div onClick={() => setOpen((value) => !value)} className="flex cursor-pointer items-center overflow-hidden rounded-2xl border border-transparent p-2 transition-all hover:border-white/80 hover:bg-white/60">
        <div className="relative mx-auto shrink-0 md:mx-0"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#28A745] to-[#1e7e34] text-sm font-bold text-white shadow-md">{initials}</div><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#F7FBF9] bg-green-500" /></div>
        <div className="ml-4 flex min-w-0 max-w-[200px] flex-col overflow-hidden transition-all duration-300 md:ml-0 md:max-w-0 md:opacity-0 md:group-hover:ml-4 md:group-hover:max-w-[200px] md:group-hover:opacity-100"><span className="truncate text-sm font-bold leading-none text-[#0F172A]">{name}</span><span className="mt-1 truncate text-[11px] font-medium text-[#64748B]">{user?.email}</span></div>
      </div>
      {open && <div onClick={(event) => event.stopPropagation()} className="absolute bottom-20 left-4 z-[110] flex w-64 flex-col gap-1 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-2xl backdrop-blur-xl">
        <button onClick={() => { setPasswordOpen(true); setOpen(false); setError(''); setMessage(''); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-white"><ShieldCheck className="h-4 w-4 opacity-60" />Security settings</button>
        <button onClick={() => { setBusinessesError(''); setBusinessesLoading(true); setBusinessesOpen((value) => !value); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-white">
          <span className="flex items-center gap-3"><span className="flex h-4 w-4 items-center justify-center text-sm font-bold text-[#28A745]">B</span>Switch business</span>
          <ChevronRight className={`h-4 w-4 opacity-60 transition-transform ${businessesOpen ? 'rotate-90' : ''}`} />
        </button>
        {businessesOpen && <div className="mt-1 border-t border-slate-200/70 pt-1">
          {businessesLoading && <p className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading businesses...</p>}
          {businessesError && <p className="px-3 py-2 text-xs text-red-600">{businessesError}</p>}
          {!businessesLoading && !businessesError && businesses.map((business, index) => {
            const businessId = business.business_id || business.id;
            return <button key={businessId} onClick={() => switchBusiness(businessId)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-green-50">
              <span className="min-w-0 truncate"><span className="block truncate">{getBusinessDisplayName(business, index)}</span>{business.billing_business_id && <span className="block truncate text-[10px] text-slate-400">Bills through {getBusinessDisplayName(businesses.find((item) => item.business_id === business.billing_business_id), businesses.findIndex((item) => item.business_id === business.billing_business_id))}</span>}</span>
              {businessId === activeBusinessId && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#28A745]" />}
            </button>;
          })}
          {!businessesLoading && !businessesError && businesses.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No connected businesses yet.</p>}
          <button onClick={() => { setAddBusinessOpen(true); setOpen(false); setBusinessesOpen(false); setError(''); }} className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-slate-200/70 px-3 py-2 pt-3 text-left text-xs font-bold text-[#28A745] hover:bg-green-50"><Plus className="h-4 w-4" />Add business</button>
        </div>}
        <div className="my-1 h-px bg-slate-200/50" />
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50/60"><LogOut className="h-4 w-4" />Sign out</button>
      </div>}
      {passwordOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm" onClick={() => setPasswordOpen(false)}>
          <form onSubmit={handlePasswordChange} onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold">Change password</h2>
            <div className="mt-5 space-y-3">
              <input required minLength="6" type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#28A745]" />
              <input required minLength="6" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#28A745]" />
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {message && <p className="mt-3 flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" />{message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPasswordOpen(false)} className="rounded-xl px-3 py-2 text-sm text-slate-500">Cancel</button>
              <button className="rounded-xl bg-[#28A745] px-4 py-2 text-sm font-bold text-white">Update password</button>
            </div>
          </form>
        </div>,
        document.body,
      )}
      {addBusinessOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm" onClick={() => setAddBusinessOpen(false)}>
          <form onSubmit={handleCreateBusiness} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">Add business</h2><p className="mt-1 text-sm text-slate-500">Create a separate workspace for this business.</p></div><button type="button" aria-label="Close" onClick={() => setAddBusinessOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-3">
              <input required placeholder="Business name" value={businessForm.name} onChange={(event) => setBusinessForm({ ...businessForm, name: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#28A745]" />
              <input required placeholder="Industry" value={businessForm.industry} onChange={(event) => setBusinessForm({ ...businessForm, industry: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#28A745]" />
              <input type="url" placeholder="Website (optional)" value={businessForm.websiteUrl} onChange={(event) => setBusinessForm({ ...businessForm, websiteUrl: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#28A745]" />
              <label className="block text-sm font-semibold text-slate-700">Billing wallet
                <select value={businessForm.billingBusinessId} onChange={(event) => setBusinessForm({ ...businessForm, billingBusinessId: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#28A745]">
                  <option value="">Use this business's own wallet</option>
                  {businesses.filter((business) => !business.billing_business_id).map((business, index) => <option key={business.business_id} value={business.business_id}>{getBusinessDisplayName(business, index)}</option>)}
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500">Choose an existing root business to pay for this workspace, or keep its wallet separate.</span>
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button disabled={businessSaving} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] text-sm font-bold text-white disabled:opacity-60">{businessSaving && <Loader2 className="h-4 w-4 animate-spin" />}{businessSaving ? 'Creating workspace...' : 'Create business'}</button>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}