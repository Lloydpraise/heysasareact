import { supabase } from '../lib/supabase';

// Skills and flows of the chat AI (sasa-brain). Both live in Supabase with row-level security, so the signed-in
// owner can read and write only their own business. Every business gets its own copy of the default skills
// (see chat_ai_seed_skills), so editing a skill here changes this business only.

export const slugifyKey = (title) =>
  String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

export const isValidKey = (key) => /^[a-z0-9_]{2,40}$/.test(key);

const must = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

export async function fetchSkillsAndDefaults(businessId) {
  const [skills, defaults] = await Promise.all([
    supabase.from('chat_ai_skills').select('*').eq('business_id', businessId).order('created_at', { ascending: true }).then(must),
    supabase.from('chat_ai_default_skills').select('*').order('sort_order', { ascending: true }).then(must),
  ]);
  const order = new Map(defaults.map((d, i) => [d.key, i]));
  // Defaults first, in their usual order; the business's own skills after.
  const sorted = [...skills].sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999) || a.created_at.localeCompare(b.created_at));
  return { skills: sorted, defaults };
}

export async function saveSkill(businessId, id, fields) {
  const patch = { title: fields.title.trim(), when_to_use: fields.when_to_use.trim(), instructions: fields.instructions.trim(), enabled: fields.enabled, updated_at: new Date().toISOString() };
  must(await supabase.from('chat_ai_skills').update(patch).eq('id', id).eq('business_id', businessId).select('id'));
}

export async function createSkill(businessId, fields) {
  const row = { business_id: businessId, key: fields.key, title: fields.title.trim(), when_to_use: fields.when_to_use.trim(), instructions: fields.instructions.trim(), enabled: fields.enabled };
  return must(await supabase.from('chat_ai_skills').insert(row).select('*').single());
}

export async function deleteSkill(businessId, id) {
  must(await supabase.from('chat_ai_skills').delete().eq('id', id).eq('business_id', businessId).select('id'));
}

export async function resetSkill(businessId, key) {
  must(await supabase.rpc('chat_ai_reset_skill', { p_business_id: businessId, p_key: key }));
}

// Adds any default skill the business does not have (e.g. one it deleted). Existing skills are never touched.
export async function restoreMissingDefaults(businessId) {
  return must(await supabase.rpc('chat_ai_seed_skills', { p_business_id: businessId }));
}

export async function fetchFlows(businessId) {
  return must(await supabase.from('chat_flows').select('*').eq('business_id', businessId).order('priority', { ascending: false }).order('created_at', { ascending: true }));
}

const flowPatch = (f) => ({
  name: f.name.trim(),
  enabled: f.enabled,
  priority: Number.isFinite(Number(f.priority)) ? Math.round(Number(f.priority)) : 100,
  goal: f.goal?.trim() || null,
  instructions: f.instructions.trim(),
  skill_keys: f.skill_keys,
  trigger: { ad_ids: f.trigger.ad_ids ?? [], list_ids: f.trigger.list_ids ?? [] },
});

export async function createFlow(businessId, flow) {
  return must(await supabase.from('chat_flows').insert({ business_id: businessId, ...flowPatch(flow) }).select('*').single());
}

export async function saveFlow(businessId, id, flow) {
  must(await supabase.from('chat_flows').update({ ...flowPatch(flow), updated_at: new Date().toISOString() }).eq('id', id).eq('business_id', businessId).select('id'));
}

export async function deleteFlow(businessId, id) {
  must(await supabase.from('chat_flows').delete().eq('id', id).eq('business_id', businessId).select('id'));
}

// What a flow can be triggered by: the business's lists and the ads its leads came from.
export async function fetchFlowTargets(businessId) {
  const [lists, ads] = await Promise.all([
    supabase.from('lists').select('id, name, type').eq('business_id', businessId).eq('archived', false).order('name'),
    supabase.from('v_ad_leaderboard').select('ad_id, ad_headline, lead_count').eq('business_id', businessId).order('lead_count', { ascending: false }).limit(100),
  ]);
  return { lists: lists.data ?? [], ads: ads.data ?? [] };
}
