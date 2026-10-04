import { useEffect, useState } from 'react';
import logo from '../../assets/images/heysasalogo.png';
import { 
  BarChart3, 
  Users, 
  Megaphone,
  Sliders, 
  FlaskConical,
  Package,
  Building2,
  ChevronDown,
  MoreVertical, 
  X, 
} from 'lucide-react';
import Profile from '../profile/Profile';
import { useAuth } from '../../context/useAuth';
import { getBusinessDisplayName } from '../../utils/businessHelpers';

export default function AppShell({ activeTab, setActiveTab, onBusinessClick, children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, activeBusinessId, getBusinesses, switchBusiness } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [businessesError, setBusinessesError] = useState('');
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getBusinesses()
      .then((rows) => {
        if (!mounted) return;
        setBusinesses(rows);
        setBusinessesError('');
      })
      .catch((error) => {
        if (mounted) setBusinessesError(error.message || 'Could not load businesses.');
      })
      .finally(() => {
        if (mounted) setBusinessesLoading(false);
      });
    return () => { mounted = false; };
  }, [activeBusinessId, getBusinesses]);

  useEffect(() => {
    const handleBusinessLogoUpdate = (event) => {
      const { businessId, logoUrl } = event.detail || {};
      if (!businessId || !logoUrl) return;
      setBusinesses((current) => current.map((business) => (
        business.business_id === businessId
          ? { ...business, business_logo_url: logoUrl }
          : business
      )));
    };
    window.addEventListener('heysasa:business-logo-updated', handleBusinessLogoUpdate);
    return () => window.removeEventListener('heysasa:business-logo-updated', handleBusinessLogoUpdate);
  }, []);

  const activeBusinessIndex = businesses.findIndex((business) => business.business_id === activeBusinessId);
  const activeBusiness = activeBusinessIndex >= 0 ? businesses[activeBusinessIndex] : null;
  const displayedBusinessName = activeBusiness
    ? getBusinessDisplayName(activeBusiness, activeBusinessIndex)
    : user?.user_metadata?.business_name || 'Business name - 1';

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'lists-campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'playground', label: 'Playground', icon: FlaskConical },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
  ];

  return (
    <div className="antialiased relative flex h-screen w-full flex-col gap-3 overflow-hidden bg-[#F7FBF9] p-3 text-[#0F172A] sm:gap-4 sm:p-4 md:flex-row md:gap-6 md:overflow-hidden md:pt-4">
      <button
        type="button"
        aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setIsMobileOpen((open) => !open)}
        className="fixed right-3 top-3 z-[30] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-slate-700 shadow-lg shadow-[#28A745]/10 backdrop-blur-xl transition md:hidden"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <MoreVertical className="h-5 w-5" />}
      </button>
      
      {/* Background Noise & Mesh Gradient */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-20 opacity-25 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-[#F7FBF9]">
        <div className="absolute rounded-full blur-[120px] opacity-35 animate-pulse bg-[#28A745] w-[45vw] h-[45vw] -top-[10vw] -left-[10vw]"></div>
        <div className="absolute rounded-full blur-[120px] opacity-25 bg-[#FF8C00] w-[30vw] h-[30vw] top-[15vw] -right-[5vw]"></div>
        <div className="absolute rounded-full blur-[120px] opacity-35 bg-[#86efac] w-[35vw] h-[35vw] -bottom-[10vw] left-[15vw]"></div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)} 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside onMouseLeave={() => window.dispatchEvent(new Event('heysasa:sidebar-leave'))} className={`
        group glass-panel w-[calc(100%-2rem)] max-w-64 md:w-[88px] md:hover:w-64 fixed md:relative 
        ${isMobileOpen ? 'left-4' : '-left-full'} md:left-0 top-4 md:top-auto 
        h-[calc(100vh-2rem)] md:h-full z-[100] flex flex-col overflow-visible 
        shadow-2xl shadow-[#28A745]/5 transition-all duration-300 ease-in-out rounded-[2rem]
        bg-white/70 backdrop-blur-xl border border-white/70
      `}>
        {/* Brand Logo Header */}
        <div className="pt-8 pb-6 px-6 border-b border-white/30 flex justify-center md:justify-center group-hover:justify-center transition-all duration-300 overflow-hidden h-[90px] shrink-0">
          <div className="flex items-center justify-center">
            <img src={logo} alt="HeySasa logo" className="h-32 w-32 object-contain shrink-0" />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  flex items-center padding-0.6rem p-3 rounded-2xl text-sm font-medium transition-all relative w-full text-left
                  ${isActive 
                    ? 'bg-white/70 text-[#0F172A] font-semibold shadow-sm' 
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/40'}
                `}
              >
                {/* Orange Indicator Bar for Active Tab */}
                {isActive && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#FF8C00] rounded-r-md"></span>
                )}
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all
                  ${isActive 
                    ? 'bg-[#28A745] border-[#28A745] text-white shadow-lg shadow-[#28A745]/30' 
                    : 'bg-white/50 border-white/80 text-[#64748B] hover:bg-white/90 hover:text-[#28A745]'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="ml-4 md:ml-0 md:group-hover:ml-4 max-w-[150px] md:max-w-0 md:group-hover:max-w-[150px] opacity-100 md:opacity-0 md:group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Profile Footer */}
        <div className="p-4 border-t border-white/20 bg-white/5 mt-auto relative shrink-0">
          <Profile />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="z-10 flex min-h-0 min-w-0 flex-1 flex-col md:h-full">
        <header className="shrink-0 px-1 pb-2 pt-1 sm:px-2 md:px-0 md:pt-0">
          <div className="flex min-h-[58px] w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/65 px-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-4">
            <div className="relative flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={onBusinessClick}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white bg-white/80 text-[#28A745] shadow-sm transition hover:border-[#28A745]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745]/50"
                title="Add or update business logo in business settings"
                aria-label="Open business settings to add or update the business logo"
              >
                {activeBusiness?.business_logo_url
                  ? <img src={activeBusiness.business_logo_url} alt={`${displayedBusinessName} logo`} className="h-full w-full object-contain p-0.5" />
                  : <Building2 className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setBusinessMenuOpen((open) => !open)}
                className="group flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 text-left transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745]/50"
                title="Switch business"
                aria-expanded={businessMenuOpen}
                aria-haspopup="menu"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-[8px] font-bold uppercase leading-none tracking-[0.14em] text-slate-400">Active business</span>
                  <span className="mt-1 max-w-[min(48vw,360px)] truncate text-xs font-bold leading-tight text-[#0F172A] sm:text-[13px]">{displayedBusinessName}</span>
                </span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-[#28A745] ${businessMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {businessMenuOpen && (
                <div role="menu" aria-label="Switch business" className="absolute left-0 top-full z-[120] mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl">
                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Switch business</p>
                  {businessesLoading && <p role="status" className="px-2 py-2 text-xs text-slate-500">Loading businesses...</p>}
                  {businessesError && <p role="alert" className="px-2 py-2 text-xs text-red-600">{businessesError}</p>}
                  {!businessesLoading && !businessesError && businesses.map((business, index) => (
                    <button
                      key={business.business_id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setBusinessMenuOpen(false);
                        switchBusiness(business.business_id);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-green-50 ${business.business_id === activeBusinessId ? 'bg-green-50/70' : ''}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white text-[#28A745]">
                        {business.business_logo_url
                          ? <img src={business.business_logo_url} alt="" className="h-full w-full object-contain p-0.5" />
                          : <Building2 className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 truncate text-xs font-semibold text-slate-700">{getBusinessDisplayName(business, index)}</span>
                      {business.business_id === activeBusinessId && <span className="ml-auto shrink-0 text-[10px] font-bold text-[#28A745]">Active</span>}
                    </button>
                  ))}
                  {!businessesLoading && !businessesError && businesses.length === 0 && <p className="px-2 py-2 text-xs text-slate-500">No connected businesses yet.</p>}
                  <button type="button" onClick={() => { setBusinessMenuOpen(false); onBusinessClick?.(); }} className="mt-1 w-full rounded-xl border-t border-slate-100 px-2 py-2.5 text-left text-xs font-semibold text-[#28A745] hover:bg-green-50">Business settings</button>
                </div>
              )}
            </div>
            <img src={logo} alt="HeySasa" className="h-8 w-24 shrink-0 object-contain sm:h-9 sm:w-28" />
          </div>
        </header>
        {/* Dynamic Page Content Rendered Here */}
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl">
          {children}
        </div>
      </main>
    </div>
  );
}