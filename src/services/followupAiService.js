// Everything the app needs from the Follow-up AI: ad playbooks (the chat flow + follow-up steps written for each ad),
// the owner's corrections to an ad, and approving / editing / activating. It talks to Supabase directly (row-level
// security keeps each owner to their own business); the engine does the AI work in the background.
import { supabase } from '../lib/supabase';
import { uploadCampaignImage } from './campaignMediaService';

export function getBusinessId() {
  if (typeof window === 'undefined') return null;
  return window.currentBusinessId || localStorage.getItem('business_id') || null;
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function fetchPlaybooks(businessId) {
  return unwrap(await db().from('ad_playbooks').select('*').eq('business_id', businessId).order('updated_at', { ascending: false })) || [];
}

export async function fetchPlaybookItems(playbookId) {
  const rows = unwrap(await db().from('ad_playbook_items').select('*').eq('playbook_id', playbookId).neq('status', 'superseded')
    .order('position', { ascending: true }).order('created_at', { ascending: true })) || [];
  return { flow: rows.find((r) => r.kind === 'flow') || null, steps: rows.filter((r) => r.kind === 'step') };
}

// The ad as it should be shown: the owner's corrections win over what was read from the ad.
export function effectiveAd(ad, playbook) {
  return {
    headline: playbook?.override_headline?.trim() || ad?.headline || playbook?.auto_headline || '',
    body: playbook?.override_body?.trim() || ad?.body || playbook?.auto_body || '',
    thumbnail: playbook?.chosen_image_url || ad?.thumbnail || playbook?.auto_thumbnail_url || '',
  };
}

// Saving a correction makes the engine rewrite the follow-ups that have not started sending (the database
// marks the playbook for regeneration when these fields change). A new row starts the first write.
export async function saveAdEdit(businessId, adId, patch) {
  const existing = unwrap(await db().from('ad_playbooks').select('id').eq('business_id', businessId).eq('ad_id', adId).maybeSingle());
  if (existing) {
    return unwrap(await db().from('ad_playbooks').update(patch).eq('id', existing.id).select('*').single());
  }
  return unwrap(await db().from('ad_playbooks').insert({ business_id: businessId, ad_id: adId, status: 'pending', ...patch }).select('*').single());
}

export async function uploadAdImage(businessId, file, currentImages = []) {
  const media = await uploadCampaignImage(businessId, file);
  const images = [{ url: media.url, source: 'upload', label: file.name }, ...currentImages.filter((i) => i?.url !== media.url)];
  return { url: media.url, images };
}

export async function requestRegenerate(playbookId) {
  return unwrap(await db().from('ad_playbooks').update({ regenerate_requested_at: new Date().toISOString() }).eq('id', playbookId).select('*').single());
}

// An edit by the owner: the step needs approving again, and the automatic review result no longer applies.
export async function updateItem(itemId, patch) {
  return unwrap(await db().from('ad_playbook_items').update({
    status: 'draft', qc_passed: null, qc_notes: null, ...patch, edited_by_owner: true, updated_at: new Date().toISOString(),
  }).eq('id', itemId).select('*').single());
}

export async function setItemStatus(itemId, status) {
  return unwrap(await db().from('ad_playbook_items').update({ status, updated_at: new Date().toISOString() }).eq('id', itemId).select('*').single());
}

// "Approve all" never approves a message that failed quality control: those need an edit first.
export async function approveAllItems(playbookId) {
  return unwrap(await db().from('ad_playbook_items').update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('playbook_id', playbookId).eq('status', 'draft').or('qc_passed.is.null,qc_passed.eq.true').select('id'));
}

export async function attachItemMedia(businessId, item, file) {
  const media = await uploadCampaignImage(businessId, file);
  return updateItem(item.id, { media, media_source: 'owner', status: 'draft' });
}

export async function activatePlaybook(playbookId, instance = null) {
  const { data, error } = await db().rpc('followup_ai_activate_playbook', { p_playbook_id: playbookId, p_instance: instance });
  if (error) throw error;
  return data;
}

export const KLT = {
  know: { label: 'Know', className: 'bg-blue-50 text-blue-600' },
  like: { label: 'Like', className: 'bg-amber-50 text-amber-600' },
  trust: { label: 'Trust', className: 'bg-[#28A745]/10 text-[#27500A]' },
};

export const DATA_ISSUE_TEXT = {
  no_body: 'The ad has no text. Add what the ad says.',
  body_too_short: 'The ad text is too short to work from. Add more.',
  no_headline: 'The ad has no headline.',
  no_image: 'There is no ad picture. Upload one or steps that use the picture will wait.',
  image_link_expired: 'The ad picture link expired. Upload the picture again.',
};

export const PLAYBOOK_STATUS = {
  pending: { label: 'Writing soon', className: 'bg-slate-100 text-slate-600' },
  generating: { label: 'Writing…', className: 'bg-blue-50 text-blue-600' },
  review: { label: 'Needs your review', className: 'bg-[#FF8C00]/10 text-[#FF8C00]' },
  active: { label: 'Live', className: 'bg-[#28A745]/10 text-[#27500A]' },
  failed: { label: 'Could not write', className: 'bg-red-50 text-red-600' },
  needs_data: { label: 'Needs ad details', className: 'bg-amber-50 text-amber-600' },
  paused: { label: 'Paused', className: 'bg-slate-100 text-slate-600' },
};
