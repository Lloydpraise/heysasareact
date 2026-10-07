import { supabase } from '../lib/supabase';

// Ask HeySasa talks to the Node backend (not an edge function), so replies can stream.
const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function headers(businessId) {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, 'X-Business-Id': businessId };
}

async function request(businessId, path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BACKEND_API_URL}/assistant${path}`, {
    method, headers: await headers(businessId), ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error || 'Something went wrong.');
  return json;
}

// Sends one message and reads the Server-Sent-Events stream. `onEvent` gets:
//   conversation {conversation_id} | status {text} | reset | reply {text} | draft_start | done {message_id, reply, draft} | error {message}
// Resolves with the `done` event. Pass an AbortSignal to stop listening.
export async function streamChat(businessId, payload, onEvent, signal) {
  const res = await fetch(`${BACKEND_API_URL}/assistant/chat`, {
    method: 'POST', headers: await headers(businessId), body: JSON.stringify(payload), signal,
  });
  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => ({}));
    throw Object.assign(new Error(json.message || 'Ask HeySasa could not answer right now.'), { code: json.error });
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let done = null;
  for (;;) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    pending += decoder.decode(value, { stream: true });
    let at;
    while ((at = pending.indexOf('\n\n')) >= 0) {
      const block = pending.slice(0, at);
      pending = pending.slice(at + 2);
      const line = block.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      let event;
      try { event = JSON.parse(line.slice(5).trim()); } catch { continue; }
      if (event.type === 'error') throw new Error(event.message || 'Something went wrong.');
      if (event.type === 'done') done = event;
      onEvent(event);
    }
  }
  if (!done) throw new Error('The connection dropped before Ask HeySasa finished. Try again.');
  return done;
}

export const listConversations = (businessId, { contextKey, limit = 30 } = {}) =>
  request(businessId, `/conversations?limit=${limit}${contextKey ? `&context_key=${encodeURIComponent(contextKey)}` : ''}`).then((r) => r.conversations);
export const getConversation = (businessId, id) => request(businessId, `/conversations/${id}`);
export const approveMessage = (businessId, messageId, finalText) => request(businessId, `/messages/${messageId}/approve`, { method: 'POST', body: { final_text: finalText } });

export const listNotes = (businessId) => request(businessId, '/notes').then((r) => r.notes);
export const addNote = (businessId, text, pinned = false) => request(businessId, '/notes', { method: 'POST', body: { text, pinned } });
export const updateNote = (businessId, id, patch) => request(businessId, `/notes/${id}`, { method: 'PATCH', body: patch });
export const deleteNote = (businessId, id) => request(businessId, `/notes/${id}`, { method: 'DELETE' });

export const getPreferences = (businessId) => request(businessId, '/preferences').then((r) => r.preferences);
export const savePreferences = (businessId, prefs) => request(businessId, '/preferences', { method: 'PUT', body: prefs }).then((r) => r.preferences);
export const listSkills = (businessId) => request(businessId, '/skills').then((r) => r.skills);
