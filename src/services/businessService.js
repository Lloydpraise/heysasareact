import { supabase } from '../lib/supabase';

const EVOLUTION_API_URL = (import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '';

async function fetchEvolutionInstances() {
  if (!EVOLUTION_API_KEY) return null;

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_API_KEY },
    });
    if (!response.ok) return null;
    const instances = await response.json().catch(() => null);
    return Array.isArray(instances) ? instances : null;
  } catch {
    return null;
  }
}

export async function fetchWhatsAppSessions(businessId) {
  if (!supabase || !businessId) return [];

  const evolutionInstances = await fetchEvolutionInstances();
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('id, business_id, phone_number, status, instance_name, evolution_instance_id, history_loaded_at, updated_at, session_data')
    .eq('business_id', businessId)
    .eq('status', 'connected')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const sessions = (data || [])
    .filter((session) => session.business_id === businessId && session.instance_name)
    .map((session) => ({
      ...session,
      label: session.session_data?.label
        || session.session_data?.raw_payload?.data?.profileName
        || null,
    }));

  if (!evolutionInstances) return sessions;

  const openInstanceNames = new Set(
    evolutionInstances
      .filter((instance) => ['open', 'connected', 'ready', 'authenticated'].includes(
        String(instance.connectionStatus || instance.status || instance.state || '').toLowerCase()
      ))
      .map((instance) => instance.name)
      .filter(Boolean)
  );
  return sessions.filter((session) => openInstanceNames.has(session.instance_name));
}

async function readBackendResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallbackMessage);
  return data;
}

export async function markWhatsAppHistoryLoaded({ businessId, sessionId }) {
  if (!supabase || !businessId || !sessionId) return null;

  const historyLoadedAt = new Date().toISOString();
  const { error } = await supabase
    .from('whatsapp_sessions')
    .update({ history_loaded_at: historyLoadedAt })
    .eq('id', sessionId)
    .eq('business_id', businessId);

  if (error) throw new Error(`History loaded, but its completion could not be saved: ${error.message}`);

  const sessions = await fetchWhatsAppSessions(businessId);
  const savedSession = sessions.find((session) => session.id === sessionId);
  if (!savedSession || savedSession.history_loaded_at !== historyLoadedAt) {
    throw new Error('History loaded, but its completion could not be verified. Check the whatsapp_sessions update policy.');
  }
  return savedSession;
}

export async function saveWhatsAppSession({ businessId, phoneNumber, instanceName, label, status = 'connected' }) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!businessId) throw new Error('No active business is available to save this WhatsApp connection.');

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .insert({
      business_id: businessId,
      phone_number: phoneNumber || null,
      instance_name: instanceName || null,
      status,
      session_data: label ? { label } : null,
    })
    .select('id, business_id, phone_number, status, instance_name, evolution_instance_id, history_loaded_at, updated_at, session_data')
    .single();

  if (error) throw new Error(`Could not save WhatsApp connection: ${error.message}`);
  const evolutionInstances = await fetchEvolutionInstances();
  const evolutionInstance = evolutionInstances?.find((instance) => instance.name === instanceName);
  if (!evolutionInstance?.id) return data;

  const { data: linkedSession, error: linkError } = await supabase
    .from('whatsapp_sessions')
    .update({ evolution_instance_id: evolutionInstance.id })
    .eq('id', data.id)
    .eq('business_id', businessId)
    .select('id, business_id, phone_number, status, instance_name, evolution_instance_id, history_loaded_at, updated_at, session_data')
    .single();
  if (linkError) throw new Error(`WhatsApp was saved, but its Evolution instance could not be linked: ${linkError.message}`);
  return linkedSession;
}

export async function disconnectWhatsAppInstance({ businessId, sessionId, instanceName }) {
  if (!businessId || !sessionId || !instanceName) {
    throw new Error('This WhatsApp connection is missing the information needed to disconnect it.');
  }

  const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${encodeURIComponent(instanceName)}`, {
    method: 'DELETE',
    headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
  });
  await readBackendResponse(response, 'Could not remove this WhatsApp instance.');

  if (!supabase) return { id: sessionId, business_id: businessId, status: 'disconnected' };

  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('business_id', businessId)
    .eq('instance_name', instanceName)
    .select('id, business_id, phone_number, status, instance_name, evolution_instance_id, history_loaded_at, updated_at')
    .single();
  if (error) throw new Error(`WhatsApp was removed, but its session record could not be deleted: ${error.message}`);
  return data;
}

export async function fetchUserBusinesses(userId) {
  if (!supabase) return [];
  if (!userId) throw new Error('You must be signed in to load businesses.');

  const { data, error } = await supabase
    .from('businesses')
    .select('business_id, name, industry, website_url, billing_business_id')
    .eq('user_id', userId)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createBusiness({ name, industry, websiteUrl, billingBusinessId }) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to create a business.');

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      name: name.trim(),
      industry: industry.trim(),
      website_url: websiteUrl?.trim() || null,
      billing_business_id: billingBusinessId || null,
    })
    .select('business_id, name, industry, website_url, billing_business_id')
    .single();
  if (error) throw error;

  if (!data?.business_id) throw new Error('Business was created without an ID.');
  return data;
}
