import { Component, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import MobileShell from './components/mobile/MobileShell';
import { AssistantProvider } from './context/AssistantContext';
import { useIsMobile } from './hooks/useIsMobile';
import LeadsPage from './components/leads/LeadsPage';
import ListsCampaignsPage from './components/listsCampaigns/ListsCampaignsPage';
import PreferencesPage from './components/preferences/PreferencesPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import PlaygroundPage from './components/playground/PlaygroundPage';
import ProductsPage from './components/products/ProductsPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import LandingPage from './components/landing/LandingPage';
import PricingPage from './components/landing/PricingPage';
import PolicyPage from './components/policies/PolicyPage';
import { useAuth } from './context/useAuth';

function tabFromPath(path) {
  if (path.includes('/leads')) return 'leads';
  if (path.includes('/lists-campaigns')) return 'lists-campaigns';
  if (path.includes('/preferences')) return 'preferences';
  if (path.includes('/playground')) return 'playground';
  if (path.includes('/products')) return 'products';
  return 'analytics';
}

class WorkspaceErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[Workspace] Rendering failed:', error, info.componentStack);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--app-bg)] px-6 text-center text-[var(--app-fg)]">
          <h1 className="text-lg font-semibold">The workspace ran into a problem.</h1>
          <p className="max-w-md text-sm text-slate-500">You can try reopening it without reloading the whole page.</p>
          <button type="button" onClick={this.retry} className="rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f8d3d]">
            Try again
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

// The existing logged-in app, lifted out of App() so it can be mounted as one
// route. Phones get MobileShell (top bar + bottom tabs); everything else keeps
// the original AppShell.
function AuthenticatedApp() {
  const { activeBusinessId } = useAuth();
  const isMobile = useIsMobile();
  const [preferencesSection, setPreferencesSection] = useState('followup');
  // On phones Preferences opens as a section list; this flag skips the list when
  // another screen deep-links straight into one section (e.g. Business settings).
  const [preferencesDirect, setPreferencesDirect] = useState(false);
  const [activeTab, setActiveTab] = useState(() => tabFromPath(window.location.pathname));

  // Update URL when active tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPreferencesDirect(false);
    if (window.location.pathname !== `/${tab}`) window.history.pushState(null, '', `/${tab}`);
  };

  // Browser/phone Back button: keep the visible tab in step with the URL.
  useEffect(() => {
    const syncTab = () => setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', syncTab);
    return () => window.removeEventListener('popstate', syncTab);
  }, []);

  const renderMainContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadsPage />;
      case 'lists-campaigns':
        return <ListsCampaignsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'preferences':
        return <PreferencesPage key={`${preferencesSection}-${preferencesDirect}`} initialSection={preferencesSection} startInSection={preferencesDirect} />;
      case 'playground':
        return <PlaygroundPage businessId={activeBusinessId} />;
      case 'products':
        return <ProductsPage />;
      default:
        return <AnalyticsPage />;
    }
  };

  const openBusinessSettings = () => {
    setPreferencesSection('business');
    setPreferencesDirect(true);
    setActiveTab('preferences');
    window.history.pushState(null, '', '/preferences');
  };

  useEffect(() => {
    const handleOpenPreferences = (event) => {
      const section = event.detail?.section || 'followup';
      setPreferencesSection(section);
      setPreferencesDirect(true);
      setActiveTab('preferences');
      window.history.pushState(null, '', '/preferences');
    };

    window.addEventListener('heysasa:open-preferences', handleOpenPreferences);
    return () => window.removeEventListener('heysasa:open-preferences', handleOpenPreferences);
  }, []);

  // The assistant's "Take me there" button asks the app to switch page (it never reaches into pages itself).
  useEffect(() => {
    const handleNavigate = (event) => {
      const { tab, section } = event.detail || {};
      if (!tab) return;
      if (tab === 'preferences' && section) {
        setPreferencesSection(section);
        setPreferencesDirect(true);
        setActiveTab('preferences');
        window.history.pushState(null, '', '/preferences');
        return;
      }
      setActiveTab(tab);
      setPreferencesDirect(false);
      if (window.location.pathname !== `/${tab}`) window.history.pushState(null, '', `/${tab}`);
    };
    window.addEventListener('heysasa:navigate', handleNavigate);
    return () => window.removeEventListener('heysasa:navigate', handleNavigate);
  }, []);

  const Shell = isMobile ? MobileShell : AppShell;
  return (
    <AssistantProvider businessId={activeBusinessId} page={activeTab}>
      <Shell activeTab={activeTab} setActiveTab={handleTabChange} onBusinessClick={openBusinessSettings}>{renderMainContent()}</Shell>
    </AssistantProvider>
  );
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
    return <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-slate-500">Loading workspace...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<PolicyPage page="terms" />} />
        <Route path="/privacy" element={<PolicyPage page="privacy" />} />
        <Route path="/contact" element={<PolicyPage page="contact" />} />
        <Route path="/contact-us" element={<PolicyPage page="contact" />} />
        <Route path="*" element={user ? <WorkspaceErrorBoundary><AuthenticatedApp /></WorkspaceErrorBoundary> : <LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
