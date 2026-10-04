import { supabase } from '../lib/supabase';
import { dedupeKey, findMatchingProduct, newProductId, cleanCategory } from '../utils/productHelpers';

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const BUCKET = 'product-images';
const PAGE = 1000;
const CHUNK = 100;

// Never select the embedding columns: they are huge and the page does not need them.
const PRODUCT_COLUMNS = [
  'id', 'business_id', 'title', 'type', 'status', 'category', 'category_source', 'price', 'old_price',
  'stock_quantity', 'description_short', 'description_long', 'key_features', 'images', 'aliases',
  'is_visible', 'ai_visible', 'source', 'price_source', 'mention_count', 'last_mentioned_at',
  'discovery_confidence', 'discovery_meta', 'observed_prices', 'discovered_at', 'approved_at', 'created_at', 'updated_at',
].join(', ');

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

const chunks = (list, size = CHUNK) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

export async function fetchProducts(businessId) {
  const client = requireClient();
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from('products').select(PRODUCT_COLUMNS)
      .eq('business_id', businessId).order('created_at', { ascending: false }).order('id').range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function fetchBusinessCurrency(businessId) {
  const { data } = await requireClient().from('businesses').select('currency').eq('business_id', businessId).maybeSingle();
  return data?.currency || 'KES';
}

export async function fetchMentions(productId) {
  const { data, error } = await requireClient().from('product_mentions')
    .select('id, kind, quote, observed_name, observed_price, image_url, contact_count, send_count, observed_at')
    .eq('product_id', productId).order('observed_at', { ascending: false, nullsFirst: false }).limit(30);
  if (error) throw error;
  return data || [];
}

// ─── writes ───────────────────────────────────────────────────────────────────
// edits: the fields the owner changed in the form. Adds the bookkeeping the discovery worker relies on:
// an owner price is never overwritten by a later run, and an old name stays as an alias so chats that
// still use it keep matching.
export function buildUpdate(product, edits) {
  const patch = { ...edits };
  if ('title' in patch) {
    patch.title = String(patch.title || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!patch.title) throw new Error('A product needs a name.');
    if (patch.title !== product.title) {
      const aliases = new Set([...(patch.aliases ?? product.aliases ?? [])]);
      if (product.title) aliases.add(product.title);
      aliases.delete(patch.title);
      patch.aliases = [...aliases].slice(0, 12);
      patch.dedupe_key = dedupeKey(patch.title);
    }
  }
  if ('price' in patch && Number(patch.price) !== Number(product.price ?? NaN)) patch.price_source = 'owner';
  if ('category' in patch) {
    patch.category = cleanCategory(patch.category);
    patch.category_source = patch.category ? 'owner' : null;
  }
  return patch;
}

export async function updateProduct(product, edits) {
  const patch = buildUpdate(product, edits);
  const { data, error } = await requireClient().from('products').update(patch).eq('id', product.id).select(PRODUCT_COLUMNS).single();
  if (error) throw error;
  return data;
}

async function updateMany(ids, patch) {
  const client = requireClient();
  for (const part of chunks(ids)) {
    const { error } = await client.from('products').update(patch).in('id', part);
    if (error) throw error;
  }
}

// Approving puts a product into the live catalog and switches it on for the AI.
export const approveProducts = (ids) => updateMany(ids, { status: 'approved', ai_visible: true });
export const dismissProducts = (ids) => updateMany(ids, { status: 'dismissed', ai_visible: false });
export const restoreProducts = (ids) => updateMany(ids, { status: 'discovered' });
export const setAiVisible = (ids, on) => updateMany(ids, { ai_visible: Boolean(on) });
export const setCategoryFor = (ids, category) => {
  const clean = cleanCategory(category);
  return updateMany(ids, { category: clean, category_source: clean ? 'owner' : null });
};

export async function deleteProducts(ids) {
  const client = requireClient();
  for (const part of chunks(ids)) {
    const { error } = await client.from('products').delete().in('id', part);
    if (error) throw error;
  }
}

export async function createProduct(businessId, fields) {
  const title = String(fields.title || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!title) throw new Error('A product needs a name.');
  const category = cleanCategory(fields.category);
  const row = {
    id: newProductId(), business_id: businessId, title, type: fields.type === 'service' ? 'service' : 'product',
    status: 'approved', ai_visible: true, is_visible: fields.is_visible !== false,
    price: fields.price ?? null, old_price: fields.old_price ?? null, price_source: fields.price == null ? null : 'owner',
    stock_quantity: fields.stock_quantity ?? 0, description_short: fields.description_short || null,
    description_long: fields.description_long || null, key_features: fields.key_features || [],
    images: fields.images || [], aliases: fields.aliases || [], category, category_source: category ? 'owner' : null,
    source: fields.source || 'manual', dedupe_key: dedupeKey(title), approved_at: new Date().toISOString(),
  };
  const { data, error } = await requireClient().from('products').insert(row).select(PRODUCT_COLUMNS).single();
  if (error) throw error;
  return data;
}

// ─── images ───────────────────────────────────────────────────────────────────
const MAX_SIDE = 1600;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Phone photos are often 4-8 MB. Shrinks them in the browser so they upload fast and always fit the 5 MB limit.
export async function prepareImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use a JPG, PNG or WebP photo.');
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { bitmap = null; }
  if (!bitmap) {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('That photo is over 5 MB.');
    return { blob: file, type: file.type };
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) { bitmap.close?.(); return { blob: file, type: file.type }; }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('That photo could not be processed. Try another one.');
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('That photo is still over 5 MB after shrinking. Try another one.');
  return { blob, type: 'image/jpeg' };
}

export async function uploadProductImage(businessId, productId, file) {
  const client = requireClient();
  const { blob, type } = await prepareImage(file);
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const rand = crypto.getRandomValues(new Uint8Array(6)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  const path = `${businessId}/owner/${productId}-${rand}.${ext}`;
  const { error } = await client.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ─── import ───────────────────────────────────────────────────────────────────
// Uploading a list is the owner saying "these are my products", so a row that matches something we
// already found in chats is promoted to the live catalog instead of creating a twin.
export function planImport(rows, existing) {
  const taken = [...existing];
  const inserts = [];
  const updates = [];
  for (const row of rows) {
    const hit = findMatchingProduct(row.title, taken);
    if (hit) {
      const patch = { status: 'approved' };
      if (hit.status !== 'approved') patch.ai_visible = true;
      if (row.price != null) { patch.price = row.price; patch.price_source = 'import'; }
      if (row.old_price != null) patch.old_price = row.old_price;
      if (row.category) { patch.category = row.category; patch.category_source = 'import'; }
      if (row.description_short) patch.description_short = row.description_short;
      if (row.stock_quantity != null) patch.stock_quantity = row.stock_quantity;
      const images = [...new Set([...(hit.images || []), ...row.images])].slice(0, 8);
      if (images.length !== (hit.images || []).length) patch.images = images;
      const aliases = [...new Set([...(hit.aliases || []), ...row.aliases, ...(row.title !== hit.title ? [row.title] : [])])].slice(0, 12);
      if (aliases.length !== (hit.aliases || []).length) patch.aliases = aliases;
      updates.push({ id: hit.id, patch, wasStatus: hit.status });
      continue;
    }
    const id = newProductId();
    const fresh = {
      id, title: row.title, type: 'product', status: 'approved', ai_visible: true, is_visible: true,
      price: row.price, old_price: row.old_price, price_source: row.price == null ? null : 'import',
      stock_quantity: row.stock_quantity ?? 0, description_short: row.description_short, images: row.images,
      aliases: row.aliases, category: row.category, category_source: row.category ? 'import' : null,
      dedupe_key: dedupeKey(row.title), approved_at: new Date().toISOString(),
    };
    inserts.push(fresh);
    taken.push({ id, title: row.title, aliases: row.aliases, status: 'approved', images: row.images });
  }
  return { inserts, updates };
}

export async function runImport(businessId, plan, format) {
  const client = requireClient();
  const source = format === 'xml' ? 'xml' : 'csv';
  for (const part of chunks(plan.inserts, 100)) {
    const { error } = await client.from('products').insert(part.map((r) => ({ ...r, business_id: businessId, source })));
    if (error) throw error;
  }
  for (const u of plan.updates) {
    const { error } = await client.from('products').update(u.patch).eq('id', u.id);
    if (error) throw error;
  }
  return { added: plan.inserts.length, updated: plan.updates.length, promoted: plan.updates.filter((u) => u.wasStatus !== 'approved').length };
}

// ─── product discovery (same backend the admin console uses) ───────────────────
async function backendHeaders(businessId) {
  const { data: { session } } = await requireClient().auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, 'X-Business-Id': businessId };
}

export async function startDiscovery(businessId) {
  const res = await fetch(`${BACKEND_API_URL}/products/discover`, {
    method: 'POST', headers: await backendHeaders(businessId), body: JSON.stringify({ force: false }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 409) return { alreadyRunning: true };
  if (!res.ok) throw new Error(json.message || json.error || 'Could not start the product scan.');
  return json;
}

export async function fetchDiscoveryStatus(businessId) {
  const res = await fetch(`${BACKEND_API_URL}/products/discover/status`, { headers: await backendHeaders(businessId) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not check the product scan.');
  return json;
}
