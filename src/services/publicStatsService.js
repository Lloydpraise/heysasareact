const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

// Backs the landing page's three live counters. Every field here is a
// real count from the backend (src/services/publicStatsService.js on
// heysasa-backend) — this file does no faking or estimating of its own.
export async function fetchPublicStats() {
  const res = await fetch(`${BACKEND_API_URL}/public/stats`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error('stats_unavailable');
  return {
    messagesAnalyzed: body.messagesAnalyzed ?? null,
    responsesReceived: body.responsesReceived ?? null,
    businessesInPipeline: body.businessesInPipeline ?? null,
    businessesActive: body.businessesActive ?? null,
  };
}
