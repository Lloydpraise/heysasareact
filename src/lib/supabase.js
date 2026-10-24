import { createClient } from '@supabase/supabase-js';
import { currentAccountId } from './accountScope';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Table reads and RPCs carry the selected account as 'x-account-id', so row security narrows them to that account
// (plus business catalog rows) and inserts get its account_id from a database trigger. Business wide = no header.
// Switching account reloads the page, so the value read here is always the current one. The header is added only to
// database (PostgREST) calls: storage, auth and edge functions do not need it and may refuse unknown headers.
function scopedFetch(input, init = {}) {
  const accountId = currentAccountId();
  const url = typeof input === 'string' ? input : input?.url || '';
  if (!accountId || !url.includes('/rest/v1/')) return fetch(input, init);
  const headers = new Headers(init.headers || (typeof input === 'object' ? input.headers : undefined));
  if (!headers.has('x-account-id')) headers.set('x-account-id', accountId);
  return fetch(input, { ...init, headers });
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: scopedFetch } })
    : null;
