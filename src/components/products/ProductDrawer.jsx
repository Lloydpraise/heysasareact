import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ImagePlus, Loader2, MessageSquareText, Star, Trash2, X, Image as ImageIcon } from 'lucide-react';
import Drawer from '../leads/drawers/Drawer';
import { Toggle } from '../preferences/shared/ui';
import { CategoryChip, Field, inputClass } from './shared';
import { fetchMentions } from '../../services/productsService';
import { confidenceLabel, formatMoney, newProductId, parsePrice, sourceLabel } from '../../utils/productHelpers';

const listToText = (list) => (Array.isArray(list) ? list.join('\n') : '');
const textToList = (text, sep = /\n/) => [...new Set(String(text || '').split(sep).map((s) => s.trim()).filter(Boolean))];
const moneyText = (n) => (n === null || n === undefined ? '' : String(n));

function initialForm(product) {
  return {
    title: product?.title || '',
    type: product?.type === 'service' ? 'service' : 'product',
    category: product?.category || '',
    price: moneyText(product?.price),
    old_price: moneyText(product?.old_price),
    stock_quantity: product?.stock_quantity ?? 0,
    description_short: product?.description_short || '',
    description_long: product?.description_long || '',
    key_features: listToText(product?.key_features),
    aliases: (product?.aliases || []).join(', '),
    images: product?.images || [],
    ai_visible: product ? product.ai_visible !== false : true,
    is_visible: product ? product.is_visible !== false : true,
  };
}

function Evidence({ product, currency }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let live = true;
    fetchMentions(product.id).then((r) => live && setRows(r)).catch(() => live && setRows([]));
    return () => { live = false; };
  }, [product.id]);

  const prices = (product.observed_prices || []).filter((p) => p?.price);
  const confidence = product.status === 'discovered' ? confidenceLabel(product.discovery_confidence) : null;

  return (
    <section>
      <h3 className="text-sm font-bold text-slate-900">Where we found it</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        {sourceLabel(product.source) || 'Seen in your chats'}
        {confidence ? `. ${confidence.text}.` : ''}
      </p>
      {prices.length > 0 && (
        <p className="mt-2 text-xs text-slate-600">
          Prices seen: {prices.map((p) => `${formatMoney(p.price, currency)}${p.count > 1 ? ` (${p.count} times)` : ''}`).join(', ')}
        </p>
      )}
      <div className="mt-3 space-y-2">
        {rows === null && <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading</div>}
        {rows?.length === 0 && <p className="text-xs text-slate-400">No saved proof for this product.</p>}
        {rows?.map((m) => (
          <div key={m.id} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
            {m.kind === 'image' && m.image_url ? (
              <a href={m.image_url} target="_blank" rel="noreferrer" className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                <img src={m.image_url} alt="Photo you sent" loading="lazy" className="h-full w-full object-cover" />
              </a>
            ) : (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-slate-400">
                {m.kind === 'image' ? <ImageIcon className="h-3.5 w-3.5" /> : <MessageSquareText className="h-3.5 w-3.5" />}
              </span>
            )}
            <div className="min-w-0 flex-1 text-xs">
              {m.quote && <p className="line-clamp-4 italic text-slate-700">“{m.quote}”</p>}
              <p className="mt-1 text-slate-400">
                {m.kind === 'image' ? 'Photo' : 'You wrote'}
                {m.contact_count > 1 ? `, sent to ${m.contact_count} customers` : ''}
                {m.observed_price ? `, ${formatMoney(m.observed_price, currency)}` : ''}
                {m.observed_at ? `, ${new Date(m.observed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Mounted only while open and keyed by product, so the form always starts from the saved product.
export default function ProductDrawer({ open = true, product, currency, categories, uploadImage, onClose, onSave, onCreate, onApprove, onDismiss, onRestore, onDelete, notify }) {
  const creating = !product;
  const [form, setForm] = useState(() => initialForm(product));
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const draftId = useMemo(() => newProductId(), []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const initial = useMemo(() => initialForm(product), [product]);
  const dirty = creating ? form.title.trim().length > 0 : JSON.stringify(form) !== JSON.stringify(initial);

  const collect = () => {
    const price = parsePrice(form.price);
    const oldPrice = parsePrice(form.old_price);
    if (form.price.trim() && price === null) throw new Error('The price is not a number. Use digits such as 2500.');
    if (form.old_price.trim() && oldPrice === null) throw new Error('The old price is not a number. Use digits such as 3000.');
    if (!form.title.trim()) throw new Error('Give this product a name.');
    return {
      title: form.title, type: form.type, category: form.category, price, old_price: oldPrice,
      stock_quantity: Math.max(0, Math.round(Number(form.stock_quantity) || 0)),
      description_short: form.description_short.trim() || null, description_long: form.description_long.trim() || null,
      key_features: textToList(form.key_features), aliases: textToList(form.aliases, /[\n,]/),
      images: form.images, ai_visible: form.ai_visible, is_visible: form.is_visible,
    };
  };

  const run = async (name, work, doneMessage) => {
    setError('');
    setBusy(name);
    try {
      await work();
      if (doneMessage) notify(doneMessage);
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const onFiles = async (files) => {
    setError('');
    setUploading(true);
    try {
      const added = [];
      for (const file of [...files].slice(0, 6)) added.push(await uploadImage(file, product?.id || draftId));
      setForm((f) => ({ ...f, images: [...f.images, ...added].slice(0, 8) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const makeMain = (i) => setForm((f) => ({ ...f, images: [f.images[i], ...f.images.filter((_, j) => j !== i)] }));
  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }));

  const discovered = product?.status === 'discovered';
  const dismissed = product?.status === 'dismissed';
  const title = creating ? 'Add a product' : discovered ? 'Check this product' : 'Edit product';
  const showEvidence = !creating && (discovered || dismissed || product.mention_count > 0);
  const suggestions = categories.slice(0, 8).map((c) => c.name);

  return (
    <Drawer open={open} onClose={onClose} title={title} width="w-full md:w-[540px]">
      <div className="flex min-h-full flex-col">
        <div className="flex-1 space-y-6 px-4 py-5 md:px-5">
          {!creating && (
            <div className="flex items-center gap-2">
              <CategoryChip name={product.category} />
              <span className="text-xs text-slate-400">{discovered ? 'Waiting for your OK' : dismissed ? 'Dismissed' : 'In your catalog'}</span>
            </div>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Photos</h3>
              <span className="text-xs text-slate-400">The first photo is the main one</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {form.images.map((src, i) => (
                <div key={src} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-[#28A745] px-1.5 py-0.5 text-[10px] font-bold text-white">Main</span>}
                  <div className="absolute inset-0 flex items-start justify-between gap-1 bg-black/0 p-1 opacity-0 transition group-focus-within:opacity-100 group-hover:bg-black/20 group-hover:opacity-100">
                    {i !== 0 ? (
                      <button type="button" onClick={() => makeMain(i)} aria-label="Make this the main photo" title="Make main" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-slate-700 hover:text-[#FF8C00]"><Star className="h-3.5 w-3.5" /></button>
                    ) : <span />}
                    <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-slate-700 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {form.images.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                  disabled={uploading}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-[#28A745] hover:bg-[#28A745]/5 hover:text-[#1f8d3d]"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <span className="text-[11px] font-semibold">{uploading ? 'Uploading' : 'Add photo'}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </section>

          <section className="space-y-3">
            <Field label="Name">
              <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} placeholder="e.g. Classic lash set" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <div className="flex rounded-xl bg-slate-100 p-1">
                  {['product', 'service'].map((t) => (
                    <button key={t} type="button" onClick={() => set('type', t)} aria-pressed={form.type === t} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition ${form.type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t}</button>
                  ))}
                </div>
              </Field>
              <Field label="Category" hint="Products in the same category are treated as a group by the AI.">
                <input className={inputClass} list="product-categories" value={form.category} onChange={(e) => set('category', e.target.value)} maxLength={40} placeholder="e.g. Lash extensions" />
                <datalist id="product-categories">{categories.map((c) => <option key={c.name} value={c.name} />)}</datalist>
              </Field>
            </div>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((name) => (
                  <button key={name} type="button" onClick={() => set('category', name)} className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${form.category === name ? 'border-[#28A745] bg-[#28A745]/10 text-[#1f8d3d]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{name}</button>
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-3 gap-3">
            <Field label={`Price (${currency})`}>
              <input className={inputClass} inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="2500" />
            </Field>
            <Field label="Old price">
              <input className={inputClass} inputMode="decimal" value={form.old_price} onChange={(e) => set('old_price', e.target.value)} placeholder="Optional" />
            </Field>
            {form.type === 'product' ? (
              <Field label="In stock">
                <input className={inputClass} inputMode="numeric" value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value.replace(/[^\d]/g, ''))} />
              </Field>
            ) : <span />}
          </section>
          {discovered && product.price_source && product.price_source !== 'owner' && product.price != null && (
            <p className="-mt-3 text-xs text-slate-500">This price came from your {product.price_source === 'image' ? 'photo' : 'chats'}. Change it if it is out of date.</p>
          )}

          <section className="space-y-3">
            <Field label="Short description" hint="One or two lines the AI can say to a customer.">
              <textarea className={`${inputClass} min-h-[70px]`} value={form.description_short} onChange={(e) => set('description_short', e.target.value)} maxLength={200} />
            </Field>
            <Field label="Full details" hint="Sizes, what is included, care, delivery. The AI only uses what you write here.">
              <textarea className={`${inputClass} min-h-[96px]`} value={form.description_long} onChange={(e) => set('description_long', e.target.value)} />
            </Field>
            <Field label="Key features" hint="One per line.">
              <textarea className={`${inputClass} min-h-[70px]`} value={form.key_features} onChange={(e) => set('key_features', e.target.value)} />
            </Field>
            <Field label="Also called" hint="Other names customers use, separated by commas. Helps the AI recognise it.">
              <input className={inputClass} value={form.aliases} onChange={(e) => set('aliases', e.target.value)} />
            </Field>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            {!discovered && !dismissed && (
              <Toggle checked={form.ai_visible} onChange={(v) => set('ai_visible', v)} label="Active for AI" description="Green dot. The AI can mention, recommend and quote this product." />
            )}
            {(discovered || dismissed) && <p className="text-xs text-slate-500">The AI starts using this product once you approve it.</p>}
            <Toggle checked={form.is_visible} onChange={(v) => set('is_visible', v)} label="Show on my website" description="Only matters if your website reads from HeySasa." />
          </section>

          {showEvidence && <Evidence product={product} currency={currency} />}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-5">
          {creating && (
            <button type="button" disabled={!dirty || busy} onClick={() => run('create', async () => { await onCreate(collect()); onClose(); }, 'Product added.')} className="rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#23913d] disabled:opacity-50">
              {busy === 'create' ? 'Adding' : 'Add product'}
            </button>
          )}

          {!creating && !discovered && !dismissed && (
            <>
              {confirmDelete ? (
                <span className="mr-auto flex items-center gap-2 text-xs text-slate-600">
                  Delete for good?
                  <button type="button" onClick={() => run('delete', async () => { await onDelete(product); onClose(); }, 'Product deleted.')} className="rounded-lg bg-red-500 px-2.5 py-1 font-semibold text-white">{busy === 'delete' ? 'Deleting' : 'Yes, delete'}</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold text-slate-500">Keep it</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="mr-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /> Delete</button>
              )}
              <button type="button" disabled={!dirty || busy} onClick={() => run('save', async () => { await onSave(product, collect()); onClose(); }, 'Changes saved.')} className="rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#23913d] disabled:opacity-50">
                {busy === 'save' ? 'Saving' : 'Save changes'}
              </button>
            </>
          )}

          {discovered && (
            <>
              <button type="button" disabled={busy} onClick={() => run('dismiss', async () => { await onDismiss(product); onClose(); }, 'Dismissed. It will not be suggested again.')} className="mr-auto rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600">Dismiss</button>
              <button type="button" disabled={!dirty || busy} onClick={() => run('save', async () => { await onSave(product, collect()); onClose(); }, 'Changes saved.')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save</button>
              <button type="button" disabled={busy} onClick={() => run('approve', async () => { const saved = dirty ? await onSave(product, collect()) : product; await onApprove(saved); onClose(); }, 'Approved. The AI can use it now.')} className="flex items-center gap-1.5 rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#23913d] disabled:opacity-50">
                <Check className="h-4 w-4" /> {busy === 'approve' ? 'Approving' : dirty ? 'Save and approve' : 'Approve'}
              </button>
            </>
          )}

          {dismissed && (
            <button type="button" disabled={busy} onClick={() => run('restore', async () => { await onRestore(product); onClose(); }, 'Brought back to Discovered.')} className="rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23913d]">Bring back</button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
