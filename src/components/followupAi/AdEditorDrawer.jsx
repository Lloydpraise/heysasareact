import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { DATA_ISSUE_TEXT, saveAdEdit, uploadAdImage } from '../../services/followupAiService';

// Fix an ad the system read wrongly (or only half): headline, text, and which picture to use.
// Saving makes the Follow-up AI rewrite the follow-ups that have not started sending.
export default function AdEditorDrawer({ open, onClose, businessId, ad, playbook, onSaved }) {
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState([]);
  const [chosen, setChosen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setHeadline(playbook?.override_headline || ad?.headline || playbook?.auto_headline || '');
    setBody(playbook?.override_body || ad?.body || playbook?.auto_body || '');
    const known = Array.isArray(playbook?.images) ? playbook.images : [];
    const thumb = ad?.thumbnail || playbook?.auto_thumbnail_url;
    const list = thumb && !known.some((i) => i.url === thumb) ? [{ url: thumb, source: 'meta', label: 'Ad thumbnail' }, ...known] : known;
    setImages(list);
    setChosen(playbook?.chosen_image_url || thumb || '');
    setError('');
  }, [open, ad, playbook]);

  if (!open || !ad) return null;

  const issues = [];
  if (body.trim().length < 15) issues.push(body.trim() ? 'body_too_short' : 'no_body');
  if (!headline.trim()) issues.push('no_headline');
  if (!chosen) issues.push('no_image');
  const blocked = issues.includes('no_body') || issues.includes('body_too_short');

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try {
      const result = await uploadAdImage(businessId, file, images);
      setImages(result.images);
      setChosen(result.url);
    } catch (e) {
      setError(e.message || 'Could not upload the picture.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true); setError('');
    try {
      const saved = await saveAdEdit(businessId, ad.ad_id, {
        override_headline: headline.trim() || null,
        override_body: body.trim() || null,
        images,
        chosen_image_url: chosen || null,
      });
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError(e.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" role="presentation">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="ad-editor-title">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="ad-editor-title" className="text-base font-semibold text-slate-900">Edit ad details</h2>
            <p className="mt-1 text-xs text-slate-500">Follow-ups that have not started sending are rewritten from what you set here. You review them before anything goes live.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <label className="mb-1 block text-xs font-semibold text-slate-600">Headline</label>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={200}
          className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#28A745] focus:outline-none" />

        <label className="mb-1 block text-xs font-semibold text-slate-600">Ad text (what the ad says)</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={2000}
          className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#28A745] focus:outline-none" />

        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600">Picture to use</label>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <Upload size={12} /> Upload
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUpload} />
        </div>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {images.map((img) => (
            <button key={img.url} type="button" onClick={() => setChosen(img.url)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 ${chosen === img.url ? 'border-[#28A745]' : 'border-transparent'}`}
              title={img.label || img.source}>
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {images.length === 0 && (
            <div className="col-span-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><ImageIcon size={16} /> No picture yet. Upload one.</div>
          )}
        </div>

        {issues.length > 0 && (
          <ul className="mb-4 space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            {issues.map((i) => <li key={i}>{DATA_ISSUE_TEXT[i]}</li>)}
          </ul>
        )}
        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={save} disabled={busy || blocked}
            className="rounded-xl bg-[#28A745] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#218838] disabled:opacity-50">
            {busy ? 'Saving…' : 'Save and rewrite follow-ups'}
          </button>
        </div>
      </div>
    </div>
  );
}
