import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './auth-context-value';
import { createBusiness, fetchUserBusinesses } from '../services/businessService';

function getBusinessId(user) {
  return user?.app_metadata?.business_id
    || user?.user_metadata?.business_id
    || null;
}

function persistBusinessId(user, businessIdOverride) {
  const businessId = businessIdOverride || getBusinessId(user);
  if (businessId) {
    localStorage.setItem('business_id', businessId);
    window.currentBusinessId = businessId;
  } else {
    localStorage.removeItem('business_id');
    delete window.currentBusinessId;
  }
  return businessId;
}

async function resolveBusinessId(user) {
  let businessId = getBusinessId(user);
  if (!user) return businessId;

  const businesses = await fetchUserBusinesses(user.id).catch(() => []);
  const storedBusinessId = localStorage.getItem('business_id');
  return businesses.some((business) => business.business_id === storedBusinessId)
    ? storedBusinessId
    : businesses.find((business) => business.business_id === businessId)?.business_id || businesses[0]?.business_id || null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [activeBusinessId, setActiveBusinessId] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      const businessId = await resolveBusinessId(currentSession?.user);
      setActiveBusinessId(persistBusinessId(currentSession?.user, businessId));
      setSession(currentSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      resolveBusinessId(nextSession?.user).then((businessId) => {
        if (!mounted) return;
        setActiveBusinessId(persistBusinessId(nextSession?.user, businessId));
        setSession(nextSession);
        setLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('business_id');
    delete window.currentBusinessId;
  };

  const switchBusiness = useCallback((businessId) => {
    if (!businessId || businessId === activeBusinessId) return;
    localStorage.setItem('business_id', businessId);
    window.currentBusinessId = businessId;
    setActiveBusinessId(businessId);
    window.location.reload();
  }, [activeBusinessId]);

  const getBusinesses = useCallback(() => fetchUserBusinesses(session?.user?.id), [session?.user?.id]);

  const addBusiness = useCallback(async (details) => {
    const created = await createBusiness(details);
    switchBusiness(created.business_id);
    return created;
  }, [switchBusiness]);

  const updatePassword = (password) => {
    if (!supabase) return Promise.resolve({ error: new Error('Supabase is not configured.') });
    return supabase.auth.updateUser({ password });
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, activeBusinessId, signIn, signOut, updatePassword, getBusinesses, switchBusiness, addBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

