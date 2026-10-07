import { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  LayoutGrid,
  Loader2,
  LogOut,
  Megaphone,
  Moon,
  Package,
  Plus,
  ShieldCheck,
  Sliders,
  Sun,
  Users,
} from 'lucide-react';
import logo from '../../assets/images/heysasalogo.png';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { useAssistant } from '../../context/useAssistant';
import { useBusinessList } from '../../hooks/useBusinessList';
import { getBusinessDisplayName } from '../../utils/businessHelpers';
import BottomSheet, { SheetRow } from './BottomSheet';

const TABS = [
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'lists-campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'products', label: 'Products', icon: Package },
];
const MORE_TABS = [
  { id: 'playground', label: 'Playground', hint: 'Test and tune your AI', icon: FlaskConical },
  { id: 'preferences', label: 'Preferences', hint: 'Follow-ups, materials, business, billing', icon: Sliders },
];
const MORE_INDEX = TABS.length;

const inputClass = 'h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-slate-900 outline-none transition focus:border-[#28A745] focus:bg-white focus:ring-4 focus:ring-[#28A745]/10';

// Phone layout: slim top bar + bottom tab bar. The page components themselves
// are the same ones the desktop shell renders. Only the chrome is different.
export default function MobileShell({ activeTab, setActiveTab, onBusinessClick, children }) {
  const { user, signOut, updatePassword, switchBusiness, addBusiness } = useAuth();
  const { open: openAssistant } = useAssistant();
  const { isDark, toggleTheme } = useTheme();
  const { businesses, loading, error, activeBusiness, displayName, activeBusinessId } = useBusinessList();

  const [switchOpen, setSwitchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [businessForm, setBusinessForm] = useState({ name: '', industry: '', websiteUrl: '', billingBusinessId: '' });
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const name = user?.user_metadata?.business_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'My Business';
  const initials = name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);

  const tabIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const activeIndex = tabIndex >= 0 ? tabIndex : MORE_INDEX;

  // Hide the tab bar while typing so it never floats above the keyboard.
  useEffect(() => {
    const isField = (el) => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !['checkbox', 'radio', 'button', 'submit', 'range'].includes(el.type);
    const onFocusIn = (event) => { if (isField(event.target)) setKeyboardOpen(true); };
    const onFocusOut = () => setKeyboardOpen(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Keep the browser's address-bar tint in step with the theme.
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#070c0b' : '#F7FBF9');
  }, [isDark]);

  const goTo = (id) => {
    if (id !== activeTab) navigator.vibrate?.(6);
    setMoreOpen(false);
    setActiveTab(id);
  };

  const handleCreateBusiness = async (event) => {
    event.preventDefault();
    setBusinessSaving(true);
    setBusinessError('');
    try {
      await addBusiness(businessForm);
    } catch (createError) {
      setBusinessError(createError.message || 'Could not create business.');
      setBusinessSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (password.length < 6) return setPasswordError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setPasswordError('Passwords do not match.');
    const { error: updateError } = await updatePassword(password);
    if (updateError) return setPasswordError(updateError.message);
    setPassword('');
    setConfirmPassword('');
    setPasswordMessage('Password updated successfully.');
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-fg)] antialiased">
      {/* Static, cheap ambient glow (the desktop animated blurs are heavy on low-end phones) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_40%_at_0%_0%,rgba(40,167,69,0.13),transparent_70%),radial-gradient(70%_35%_at_100%_100%,rgba(255,140,0,0.07),transparent_70%)] dark:opacity-40"
      />

      {/* Top bar */}
      <header className="relative z-20 shrink-0 border-b border-slate-200/70 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-3 px-3">
          <button
            type="button"
            onClick={() => setSwitchOpen(true)}
            aria-haspopup="dialog"
            aria-label="Switch business"
            className="flex min-w-0 items-center gap-2.5 rounded-2xl py-1 pl-1 pr-2.5 active:bg-slate-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-[#28A745] shadow-sm">
              {activeBusiness?.business_logo_url
                ? <img src={activeBusiness.business_logo_url} alt="" className="h-full w-full object-contain p-0.5" />
                : <Building2 size={18} />}
            </span>
            <span className="flex min-w-0 flex-col text-left">
              <span className="text-[9px] font-bold uppercase leading-none tracking-[0.14em] text-slate-400">Active business</span>
              <span className="mt-1 max-w-[46vw] truncate text-[14px] font-bold leading-tight text-[#0F172A]">{displayName}</span>
            </span>
            <ChevronDown size={15} className="shrink-0 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => openAssistant({ surface: 'general', title: 'Ask HeySasa' })}
            aria-label="Open Ask HeySasa"
            title="Ask HeySasa"
            className="flex h-10 shrink-0 items-center rounded-lg transition hover:bg-slate-100 active:scale-[0.98]"
          >
            <img src={logo} alt="HeySasa" className="h-8 w-24 object-contain" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div key={activeTab} className="m-page-in flex min-h-0 min-w-0 flex-1">
          {children}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav
        aria-label="Primary"
        className={`relative z-30 shrink-0 border-t border-slate-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md ${keyboardOpen ? 'hidden' : ''}`}
      >
        <div className="relative grid h-16 grid-cols-5">
          {/* Sliding active indicator */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-[7px] flex h-8 w-1/5 justify-center transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            <span className="h-8 w-16 rounded-full bg-[#28A745]/15" />
          </div>

          {TABS.map(({ id, label, icon: Icon }, index) => {
            const active = activeIndex === index;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center pt-[7px]"
              >
                <span className="flex h-8 w-16 items-center justify-center">
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.5 : 2}
                    className={`transition-all duration-300 ${active ? 'scale-110 text-[#1f8d3d]' : 'text-slate-500'}`}
                  />
                </span>
                <span className={`mt-0.5 text-[11px] leading-none transition-colors duration-300 ${active ? 'font-bold text-[#1f8d3d]' : 'font-medium text-slate-500'}`}>{label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-current={activeIndex === MORE_INDEX ? 'page' : undefined}
            className="relative flex flex-col items-center pt-[7px]"
          >
            <span className="flex h-8 w-16 items-center justify-center">
              <LayoutGrid
                size={21}
                strokeWidth={activeIndex === MORE_INDEX ? 2.5 : 2}
                className={`transition-all duration-300 ${activeIndex === MORE_INDEX ? 'scale-110 text-[#1f8d3d]' : 'text-slate-500'}`}
              />
            </span>
            <span className={`mt-0.5 text-[11px] leading-none transition-colors duration-300 ${activeIndex === MORE_INDEX ? 'font-bold text-[#1f8d3d]' : 'font-medium text-slate-500'}`}>More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#28A745] to-[#1e7e34] text-base font-bold text-white shadow-md">{initials}</span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold text-slate-900">{name}</span>
            <span className="block truncate text-[12.5px] text-slate-500">{user?.email}</span>
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          {MORE_TABS.map(({ id, label, hint, icon }) => (
            <SheetRow
              key={id}
              icon={icon}
              label={label}
              hint={hint}
              active={activeTab === id}
              onClick={() => goTo(id)}
              trailing={<ChevronRight size={18} className="text-slate-300" />}
            />
          ))}
        </div>

        <p className="mb-1 mt-4 px-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Account</p>
        <div className="flex flex-col gap-0.5">
          <SheetRow
            icon={ShieldCheck}
            label="Security settings"
            hint="Change your password"
            onClick={() => { setMoreOpen(false); setPasswordError(''); setPasswordMessage(''); setPasswordOpen(true); }}
          />
          <SheetRow
            icon={isDark ? Moon : Sun}
            label="Dark mode"
            hint={isDark ? 'On' : 'Off'}
            onClick={toggleTheme}
            trailing={(
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${isDark ? 'bg-[#28A745]' : 'bg-slate-300'}`}>
                <span className={`toggle-knob absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-[22px]' : 'left-0.5'}`} />
              </span>
            )}
          />
          <SheetRow icon={LogOut} label="Sign out" tone="danger" onClick={signOut} />
        </div>
      </BottomSheet>

      {/* Switch business sheet */}
      <BottomSheet open={switchOpen} onClose={() => setSwitchOpen(false)} title="Your businesses">
        {loading && <p role="status" className="flex items-center gap-2 px-2.5 py-3 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Loading businesses...</p>}
        {error && <p role="alert" className="px-2.5 py-3 text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-0.5">
          {!loading && !error && businesses.map((business, index) => {
            const businessId = business.business_id || business.id;
            const isActive = businessId === activeBusinessId;
            const billingIndex = businesses.findIndex((item) => (item.business_id || item.id) === business.billing_business_id);
            return (
              <button
                key={businessId}
                type="button"
                onClick={() => { setSwitchOpen(false); if (!isActive) switchBusiness(businessId); }}
                className={`flex min-h-[60px] w-full items-center gap-3.5 rounded-2xl px-2.5 py-2 text-left active:bg-slate-100 ${isActive ? 'bg-[#28A745]/10' : ''}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-[#28A745]">
                  {business.business_logo_url
                    ? <img src={business.business_logo_url} alt="" className="h-full w-full object-contain p-0.5" />
                    : <Building2 size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-slate-900">{getBusinessDisplayName(business, index)}</span>
                  {business.billing_business_id && billingIndex >= 0 && (
                    <span className="block truncate text-[12px] text-slate-500">Bills through {getBusinessDisplayName(businesses[billingIndex], billingIndex)}</span>
                  )}
                </span>
                {isActive && <CheckCircle2 size={20} className="shrink-0 text-[#28A745]" />}
              </button>
            );
          })}
          {!loading && !error && businesses.length === 0 && <p className="px-2.5 py-3 text-sm text-slate-500">No connected businesses yet.</p>}
        </div>
        <div className="mt-2 flex flex-col gap-0.5 border-t border-slate-100 pt-2">
          <SheetRow
            icon={Plus}
            label="Add business"
            hint="Create a separate workspace"
            onClick={() => { setSwitchOpen(false); setBusinessError(''); setBusinessForm({ name: '', industry: '', websiteUrl: '', billingBusinessId: '' }); setAddOpen(true); }}
          />
          <SheetRow
            icon={Sliders}
            label="Business settings"
            hint="Logo, details and more"
            onClick={() => { setSwitchOpen(false); onBusinessClick?.(); }}
          />
        </div>
      </BottomSheet>

      {/* Add business sheet */}
      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add business"
        footer={(
          <button
            type="submit"
            form="m-add-business"
            disabled={businessSaving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#28A745] text-[15px] font-bold text-white shadow-lg shadow-[#28A745]/25 disabled:opacity-60"
          >
            {businessSaving && <Loader2 size={17} className="animate-spin" />}
            {businessSaving ? 'Creating workspace...' : 'Create business'}
          </button>
        )}
      >
        <form id="m-add-business" onSubmit={handleCreateBusiness} className="flex flex-col gap-3 pt-1">
          <p className="text-[13px] text-slate-500">Create a separate workspace for this business.</p>
          <input required placeholder="Business name" value={businessForm.name} onChange={(event) => setBusinessForm({ ...businessForm, name: event.target.value })} className={inputClass} />
          <input required placeholder="Industry" value={businessForm.industry} onChange={(event) => setBusinessForm({ ...businessForm, industry: event.target.value })} className={inputClass} />
          <input type="url" inputMode="url" placeholder="Website (optional)" value={businessForm.websiteUrl} onChange={(event) => setBusinessForm({ ...businessForm, websiteUrl: event.target.value })} className={inputClass} />
          <label className="block text-[13px] font-semibold text-slate-700">
            Billing wallet
            <select value={businessForm.billingBusinessId} onChange={(event) => setBusinessForm({ ...businessForm, billingBusinessId: event.target.value })} className={`${inputClass} mt-2 font-normal`}>
              <option value="">Use this business's own wallet</option>
              {businesses.filter((business) => !business.billing_business_id).map((business, index) => (
                <option key={business.business_id || business.id} value={business.business_id || business.id}>{getBusinessDisplayName(business, index)}</option>
              ))}
            </select>
            <span className="mt-1.5 block text-[12px] font-normal text-slate-500">Choose an existing root business to pay for this workspace, or keep its wallet separate.</span>
          </label>
          {businessError && <p className="text-sm text-red-600">{businessError}</p>}
        </form>
      </BottomSheet>

      {/* Password sheet */}
      <BottomSheet
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change password"
        footer={(
          <button type="submit" form="m-change-password" className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#28A745] text-[15px] font-bold text-white shadow-lg shadow-[#28A745]/25">
            Update password
          </button>
        )}
      >
        <form id="m-change-password" onSubmit={handlePasswordChange} className="flex flex-col gap-3 pt-1">
          <input required minLength="6" type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          <input required minLength="6" type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordMessage && <p className="m-pop-in flex items-center gap-2 text-sm text-green-600"><CheckCircle2 size={16} />{passwordMessage}</p>}
        </form>
      </BottomSheet>
    </div>
  );
}
