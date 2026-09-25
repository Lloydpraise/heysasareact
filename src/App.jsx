import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import LeadsPage from './components/leads/LeadsPage';
import ListsCampaignsPage from './components/listsCampaigns/ListsCampaignsPage';
import PreferencesPage from './components/preferences/PreferencesPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import PlaygroundPage from './components/playground/PlaygroundPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import LandingPage from './components/landing/LandingPage';
import { useAuth } from './context/useAuth';

// Everything below is the existing logged-in app, entirely unchanged —
// only lifted out of App() so it can be mounted as one route instead of
// being the only thing App() ever rendered.
function AuthenticatedApp() {
  const { activeBusinessId } = useAuth();
  const [preferencesSection, setPreferencesSection] = useState('followup');
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/leads')) return 'leads';
    if (path.includes('/lists-campaigns')) return 'lists-campaigns';
    if (path.includes('/preferences')) return 'preferences';
    if (path.includes('/playground')) return 'playground';
    return 'analytics';
  });

  // Update URL when active tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `/${tab}`);
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadsPage />;
      case 'lists-campaigns':
        return <ListsCampaignsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'preferences':
        return <PreferencesPage key={preferencesSection} initialSection={preferencesSection} />;
      case 'playground':
        return <PlaygroundPage businessId={activeBusinessId} />;
      default:
        return <AnalyticsPage />;
    }
  };

  const openBusinessSettings = () => {
    setPreferencesSection('business');
    setActiveTab('preferences');
    window.history.pushState(null, '', '/preferences');
  };

  useEffect(() => {
    const handleOpenPreferences = (event) => {
      const section = event.detail?.section || 'followup';
      setPreferencesSection(section);
      setActiveTab('preferences');
      window.history.pushState(null, '', '/preferences');
    };

    window.addEventListener('heysasa:open-preferences', handleOpenPreferences);
    return () => window.removeEventListener('heysasa:open-preferences', handleOpenPreferences);
  }, []);

  return <AppShell activeTab={activeTab} setActiveTab={handleTabChange} onBusinessClick={openBusinessSettings}>{renderMainContent()}</AppShell>;
}

// CHANGED: heysasa.co.ke's root used to always render either LoginPage
// or the app directly — there was no landing page and no dedicated
// routes for login/signup. Now:
//   "/"       -> the public landing page when logged out, the app when
//                logged in (AuthenticatedApp still owns its own internal
//                tab paths like /leads, /analytics, etc. — untouched)
//   "/login"  -> its own page, always
//   "/signup" -> its own page (placeholder — real signup isn't built
//                yet), always
// A logged-in visitor who lands on /login or /signup is bounced to "/"
// rather than shown a page that makes no sense to someone already in.
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F7FBF9] text-sm text-slate-500">Loading workspace...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
        <Route path="*" element={user ? <AuthenticatedApp /> : <LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
