// Integrations: the Website card (Events API). Backend: src/events/routes.js, contract in the backend's EVENTS_API.md.
import { backendFetch } from './backendFetch';

export function fetchWebsiteIntegration(businessId) {
  return backendFetch('/integrations/website', { businessId });
}

// Returns { key, apiKey }: the full key is only ever returned here, once.
export function createApiKey(businessId, { label, accountId = null }) {
  return backendFetch('/integrations/api-keys', { method: 'POST', businessId, body: { label, ...(accountId ? { accountId } : {}) } });
}

export function revokeApiKey(businessId, keyId) {
  return backendFetch(`/integrations/api-keys/${encodeURIComponent(keyId)}`, { method: 'DELETE', businessId });
}

export async function saveEventTemplate(businessId, event, { enabled, body, delayMinutes, respectQuietHours }) {
  const result = await backendFetch(`/integrations/event-templates/${encodeURIComponent(event)}`, {
    method: 'PUT', businessId, body: { enabled, body, delayMinutes, respectQuietHours },
  });
  return result.template;
}

export function resetEventTemplate(businessId, event) {
  return backendFetch(`/integrations/event-templates/${encodeURIComponent(event)}`, { method: 'DELETE', businessId });
}

export async function sendTestEvent(businessId, { phone, name }) {
  const result = await backendFetch('/integrations/test-event', { method: 'POST', businessId, body: { phone, name } });
  return result.event;
}
