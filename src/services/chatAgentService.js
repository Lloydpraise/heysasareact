import { supabase } from '../lib/supabase';

// The Playground talks to the chat AI's brain (sasa-brain) in simulation mode: nothing is sent to anyone.
const SASA_BRAIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sasa-brain`;

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY };
}

function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// history: earlier turns [{ role: 'user' | 'assistant', content }]; text: the new customer message.
export async function sendTestMessage({ text, history = [], businessId, contact }) {
  const turns = [...history.map((m) => ({ role: m.role, text: typeof m.content === 'string' ? m.content : m.content?.text || '' })), { role: 'user', text }].filter((m) => m.text);
  const started = performance.now();
  const res = await fetch(SASA_BRAIN_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ business_id: businessId, simulate: true, message: text, history: turns, ...(contact ? { contact } : {}) }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `sasa-brain request failed (${res.status})`);

  const trace = (body.steps || []).flatMap((step) =>
    (step.calls || []).map((c) => ({ tool: c.name, args: parseJson(c.arguments, c.arguments), output: c.output, ok: c.ok, ms: c.ms, round: step.round })),
  );
  return {
    status: body.status,
    reply: body.reply,
    error: body.error,
    skipReason: body.skip_reason,
    handoff: body.handoff,
    flow: body.flow,
    skillsLoaded: body.skills_loaded || [],
    thoughts: body.thoughts || '',
    holdingMessage: body.holding_message,
    usage: body.usage,
    trace,
    responseTimeMs: Math.round(performance.now() - started),
  };
}
