import { useEffect, useState } from 'react';
import AppShell from './components/layout/AppShell';
import LeadsPage from './components/leads/LeadsPage';
import ListsCampaignsPage from './components/listsCampaigns/ListsCampaignsPage';
import PreferencesPage from './components/preferences/PreferencesPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import PlaygroundPage from './components/playground/PlaygroundPage';
import LoginPage from './components/auth/LoginPage';
import { useAuth } from './context/useAuth';

export default function App() {
  const { user, loading, activeBusinessId } = useAuth();
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

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#F7FBF9] text-sm text-slate-500">Loading workspace...</div>;
  if (!user) return <LoginPage />;

  return <AppShell activeTab={activeTab} setActiveTab={handleTabChange} onBusinessClick={openBusinessSettings}>{renderMainContent()}</AppShell>;
}