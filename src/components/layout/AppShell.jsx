import { useEffect, useState } from 'react';
import logo from '../../assets/images/heysasalogo.png';
import { 
  BarChart3, 
  Users, 
  Megaphone,
  Sliders, 
  FlaskConical,
  MoreVertical, 
  X, 
} from 'lucide-react';
import Profile from '../profile/Profile';
import { useAuth } from '../../context/useAuth';
import { getBusinessDisplayName } from '../../utils/businessHelpers';

export default function AppShell({ activeTab, setActiveTab, onBusinessClick, children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, activeBusinessId, getBusinesses } = useAuth();
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    let mounted = true;
    getBusinesses()
      .then((businesses) => {
        if (!mounted) return;
        const activeBusinessIndex = businesses.findIndex((business) => business.business_id === activeBusinessId);
        setBusinessName(activeBusinessIndex >= 0 ? getBusinessDisplayName(businesses[activeBusinessIndex], activeBusinessIndex) : '');
      })
      .catch(() => {
        if (mounted) setBusinessName('');
      });
    return () => { mounted = false; };
  }, [activeBusinessId, getBusinesses]);

  const displayedBusinessName = businessName || user?.user_metadata?.business_name || 'Business name - 1';

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'lists-campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'playground', label: 'Playground', icon: FlaskConical },
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
        <header className="flex shrink-0 items-center justify-end px-2 pb-1 pt-1 sm:px-3 md:px-1 md:pt-0">
          <button type="button" onClick={onBusinessClick} className="max-w-[70%] truncate text-right text-sm font-bold text-[#0F172A] transition hover:text-[#28A745]" title="Open business settings">
            {displayedBusinessName}
          </button>
        </header>
        {/* Dynamic Page Content Rendered Here */}
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl">
          {children}
        </div>
      </main>
    </div>
  );
}