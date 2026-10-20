// Handoffs: who is told, and for which cases. The "Needs you" list on Home reads the chats the AI handed over.
import { backendFetch } from './backendFetch';

export const getHandoffConfig = (businessId) => backendFetch('/handoff/config', { businessId });
export const saveHandoffConfig = (businessId, config) => backendFetch('/handoff/config', { method: 'PUT', businessId, body: config });
export const sendTestHandoff = (businessId) => backendFetch('/handoff/test', { method: 'POST', businessId });
export const getOpenHandoffs = async (businessId) => (await backendFetch('/handoff/open', { businessId })).items ?? [];
export const resolveHandoff = (businessId, conversationId) => backendFetch(`/handoff/${encodeURIComponent(conversationId)}/resolve`, { method: 'POST', businessId });
