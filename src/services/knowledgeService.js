// Knowledge: files and notes the owner gives the AI to look things up in. The file goes to private storage first (so it is
// saved whatever happens next), then the backend is told about it and analyses it.
import { supabase } from '../lib/supabase';
import { backendFetch } from './backendFetch';

export const BUCKET = 'business-knowledge';
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const ACCEPT = '.pdf,.doc,.docx,.txt,.md,.csv,image/*,audio/*,video/*';

export const KINDS = [
  { id: 'procedure', label: 'Procedure' },
  { id: 'catalogue', label: 'Price list' },
  { id: 'policy', label: 'Policy' },
  { id: 'product_info', label: 'Product info' },
  { id: 'faq', label: 'FAQ' },
  { id: 'other', label: 'Other' },
];
export const USED_BY = [
  { id: 'chat', label: 'Chat AI' },
  { id: 'followup', label: 'Follow-up AI' },
  { id: 'both', label: 'Both' },
];

export async function listKnowledge(businessId) {
  return (await backendFetch('/knowledge', { businessId })).sources ?? [];
}

// Saves the file under this business's own folder. Returns what the backend needs to find it.
export async function uploadKnowledgeFile(businessId, file) {
  if (!supabase) throw new Error('Not connected to HeySasa yet.');
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is over 50 MB. Upload a smaller one.');
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80);
  const path = `${businessId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(error.message || 'The upload failed. Please try again.');
  return { storage_path: path, file_name: file.name, mime_type: file.type || null, size_bytes: file.size };
}

export async function createKnowledge(businessId, { title, use_case, kind, used_by, is_active, text, file }) {
  const uploaded = file ? await uploadKnowledgeFile(businessId, file) : null;
  try {
    return await backendFetch('/knowledge', { method: 'POST', businessId, body: { title, use_case, kind, used_by, is_active, ...(uploaded ?? { text }) } });
  } catch (error) {
    // The backend refused it, so the saved copy would be an orphan.
    if (uploaded) supabase.storage.from(BUCKET).remove([uploaded.storage_path]).catch(() => {});
    throw error;
  }
}

export const updateKnowledge = (businessId, id, patch) => backendFetch(`/knowledge/${id}`, { method: 'PATCH', businessId, body: patch });
export const retryKnowledge = (businessId, id) => backendFetch(`/knowledge/${id}/retry`, { method: 'POST', businessId });
export const deleteKnowledge = (businessId, id) => backendFetch(`/knowledge/${id}`, { method: 'DELETE', businessId });
export const knowledgeFileUrl = async (businessId, id) => (await backendFetch(`/knowledge/${id}/url`, { businessId })).url;
