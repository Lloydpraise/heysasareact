import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { getBusinessDisplayName } from '../utils/businessHelpers';

// Loads the signed-in user's businesses and tracks the active one. Mirrors the
// logic the desktop AppShell keeps inline (including live logo updates from
// Preferences) so the mobile shell can share it without touching AppShell.
export function useBusinessList() {
  const { user, activeBusinessId, getBusinesses } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getBusinesses()
      .then((rows) => {
        if (!mounted) return;
        setBusinesses(rows);
        setError('');
      })
      .catch((loadError) => {
        if (mounted) setError(loadError.message || 'Could not load businesses.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [activeBusinessId, getBusinesses]);

  useEffect(() => {
    const handleLogoUpdate = (event) => {
      const { businessId, logoUrl } = event.detail || {};
      if (!businessId || !logoUrl) return;
      setBusinesses((current) => current.map((business) => (
        business.business_id === businessId ? { ...business, business_logo_url: logoUrl } : business
      )));
    };
    window.addEventListener('heysasa:business-logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('heysasa:business-logo-updated', handleLogoUpdate);
  }, []);

  const activeIndex = businesses.findIndex((business) => business.business_id === activeBusinessId);
  const activeBusiness = activeIndex >= 0 ? businesses[activeIndex] : null;
  const displayName = activeBusiness
    ? getBusinessDisplayName(activeBusiness, activeIndex)
    : user?.user_metadata?.business_name || 'Business name - 1';

  return { businesses, loading, error, activeBusiness, displayName, activeBusinessId };
}

export default useBusinessList;
