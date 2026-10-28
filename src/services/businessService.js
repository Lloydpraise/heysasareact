import { supabase } from '../lib/supabase';
import { whatsappFetch } from './whatsappApi';

const BUSINESS_LOGO_TYPES = new Set(['image/png', 'image/jpeg']);

function getImageExtension(fileName) {
  return String(fileName).split('.').pop()?.toLowerCase() || '';
}

// Pushes a refresh when this business's WhatsApp connection rows change. Returns the unsubscribe function.
export function subscribeToWhatsAppSessions(businessId, onChange) {
  if (!supabase || !businessId) return () => {};
  const channel = supabase
    .channel(`wa-sessions-${businessId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_sessions', filter: `business_id=eq.${businessId}` }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// Only this business's instances (the backend filters them). null when the check is not possible right now.
async function fetchEvolutionInstances(businessId) {
  try {
    const response = await whatsappFetch('/instance/fetchInstances', { businessId });
    if (!response.ok) return null;
    const instances = await response.json().catch(() => null);
    return Array.isArray(instances) ? instances : null;
  } catch {
    return null;
  }
}

export async function fetchWhatsAppSessions(businessId) {
  if (!supabase || !businessId) return [];

  const evolutionInstances = await fetchEvolutionInstances(businessId);
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('id, business_id, account_id, phone_number, status, instance_name, evolution_instance_id, history_loaded_at, updated_at, session_data')
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

  const columns = 'id, business_id, account_id, phone_number, status, instance_name, evolution_instance_id, history_loaded_at, updated_at, session_data';
  // The backend already saved this connection as pending when it was started (so its messages are recognised at once).
  // Finish that row; only insert when there is none (an older backend).
  const { data: started } = instanceName
    ? await supabase.from('whatsapp_sessions').select('id, session_data').eq('business_id', businessId).eq('instance_name', instanceName).maybeSingle()
    : { data: null };
  const values = {
    phone_number: phoneNumber || null,
    status,
    session_data: { ...(started?.session_data || {}), ...(label ? { label } : {}) },
    updated_at: new Date().toISOString(),
  };
  const { data, error } = started
    ? await supabase.from('whatsapp_sessions').update(values).eq('id', started.id).eq('business_id', businessId).select(columns).single()
    : await supabase.from('whatsapp_sessions').insert({ ...values, business_id: businessId, instance_name: instanceName || null }).select(columns).single();

  if (error) throw new Error(`Could not save WhatsApp connection: ${error.message}`);
  const evolutionInstances = await fetchEvolutionInstances(businessId);
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

  const response = await whatsappFetch(`/instance/delete/${encodeURIComponent(instanceName)}`, { method: 'DELETE', businessId });
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

  const queryBusinesses = (columns) => supabase
    .from('businesses')
    .select(columns)
    .eq('user_id', userId)
    .order('name');

  const { data, error } = await queryBusinesses(
    'business_id, name, industry, website_url, billing_business_id, business_logo_url'
  );
  if (!error) return withTeamBusinesses(userId, data || []);

  const missingLogoColumn = error.message?.includes('business_logo_url')
    && (error.code === '42703' || /does not exist|could not find|schema cache/i.test(error.message));
  if (!missingLogoColumn) throw error;

  const { data: businesses, error: fallbackError } = await queryBusinesses(
    'business_id, name, industry, website_url, billing_business_id'
  );
  if (fallbackError) throw fallbackError;
  return withTeamBusinesses(userId, businesses || []);
}

// Businesses the person joined through a team invite (business_users), added after the ones they own. If the
// business row itself cannot be read, a placeholder keeps the business selectable.
async function withTeamBusinesses(userId, owned) {
  const { data: links, error } = await supabase
    .from('business_users')
    .select('business_id, role')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error || !links?.length) return owned;
  const ownedIds = new Set(owned.map((business) => business.business_id));
  const joinedIds = [...new Set(links.map((link) => link.business_id))].filter((id) => !ownedIds.has(id));
  if (!joinedIds.length) return owned;
  const { data: rows } = await supabase
    .from('businesses')
    .select('business_id, name, industry, website_url, billing_business_id')
    .in('business_id', joinedIds);
  const byId = new Map((rows || []).map((row) => [row.business_id, row]));
  const joined = joinedIds.map((id) => ({
    ...(byId.get(id) || { business_id: id, name: null }),
    team_role: links.find((link) => link.business_id === id)?.role || 'member',
  }));
  return [...owned, ...joined];
}

export async function uploadBusinessLogo(businessId, file) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!businessId) throw new Error('Select a business before uploading a logo.');

  const extension = getImageExtension(file?.name);
  if (!file || !BUSINESS_LOGO_TYPES.has(file.type) || !['png', 'jpg', 'jpeg'].includes(extension)) {
    throw new Error('Please choose a PNG, JPG, or JPEG image.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');

  const path = `${businessId}/logos/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('customer_images')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('customer_images').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('The uploaded logo does not have a public URL.');
  return data.publicUrl;
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
