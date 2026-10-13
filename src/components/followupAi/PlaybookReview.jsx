import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Pencil, RefreshCw, Upload, X } from 'lucide-react';
import {
  KLT, activatePlaybook, approveAllItems, attachItemMedia, fetchPlaybookItems, requestRegenerate, setItemStatus, updateItem,
} from '../../services/followupAiService';

const STATUS_TEXT = {
  draft: ['Not approved yet', 'bg-slate-100 text-slate-600'],
  approved: ['Approved', 'bg-[#28A745]/10 text-[#27500A]'],
  rejected: ['Rejected', 'bg-red-50 text-red-600'],
  needs_media: ['Needs media', 'bg-amber-50 text-amber-700'],
  applied: ['Live', 'bg-blue-50 text-blue-600'],
};

// Approve the chat flow and each follow-up step one by one, or all at once, then start it.
export default function PlaybookReview({ playbook, businessId, approvalDefault = 'granular', onChanged }) {
  const [items, setItems] = useState({ flow: null, steps: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // { id, content, goal? }

  const load = useCallback(async () => {
    try {
      setItems(await fetchPlaybookItems(playbook.id));
    } catch (e) {
      setError(e.message || 'Could not load the playbook.');
    } finally {
      setLoading(false);
    }
  }, [playbook.id]);

  useEffect(() => { load(); }, [load, playbook.version, playbook.status, playbook.last_generated_at]);

  const run = async (fn, done) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await fn();
      await load();
      onChanged?.();
      if (done) setNotice(done(result));
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const all = [items.flow, ...items.steps].filter(Boolean);
  const approvable = all.filter((i) => i.status === 'draft' && i.qc_passed !== false).length;
  const approved = all.filter((i) => i.status === 'approved').length;
  const failedQc = all.filter((i) => i.status === 'draft' && i.qc_passed === false).length;
  const waitingMedia = items.steps.filter((i) => i.status === 'needs_media').length;

  const saveEdit = () => run(() => updateItem(editing.id, editing.kind === 'flow'
    ? { content: editing.content, goal: editing.goal }
    : { content: editing.content }), () => 'Saved. Approve it again to include it.').then(() => setEditing(null));

  const activate = () => run(() => activatePlaybook(playbook.id), (r) => {
    const parts = [`Live: ${r.steps} follow-up step${r.steps === 1 ? '' : 's'}${items.flow ? ' and the chat flow' : ''}.`];
    if (r.steps_waiting_for_media) parts.push(`${r.steps_waiting_for_media} step${r.steps_waiting_for_media === 1 ? ' is' : 's are'} waiting for media and will not be sent until you add it.`);
    if (r.other_active_campaigns_on_list) parts.push('Another active campaign uses the same list: a lead can only be in one active campaign at a time.');
    if (!r.instance) parts.push('No connected WhatsApp number was found: pick one on the campaign before messages can go.');
    return parts.join(' ');
  });

  if (loading) return <div className="py-6 text-center text-xs text-slate-400">Loading…</div>;
  if (!all.length) return <div className="py-6 text-center text-xs text-slate-400">Nothing written yet.</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy || !approvable} onClick={() => run(() => approveAllItems(playbook.id), (r) => `Approved ${r?.length ?? 0} item${r?.length === 1 ? '' : 's'}.`)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${approvalDefault === 'all' ? 'bg-[#28A745] text-white hover:bg-[#218838]' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
          Approve all{approvable ? ` (${approvable})` : ''}
        </button>
        <button type="button" disabled={busy || !approved} onClick={activate}
          className="rounded-lg bg-[#28A745] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#218838] disabled:opacity-40">
          {playbook.status === 'active' ? 'Update live follow-ups' : 'Start follow-ups'}{approved ? ` (${approved} approved)` : ''}
        </button>
        <button type="button" disabled={busy} onClick={() => run(() => requestRegenerate(playbook.id), () => 'Rewriting. It will show here in a minute.')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
          <RefreshCw size={12} /> Write again
        </button>
      </div>
      {failedQc > 0 && <p className="text-xs text-amber-700">{failedQc} message{failedQc === 1 ? '' : 's'} did not pass our quality check. Edit {failedQc === 1 ? 'it' : 'them'} before approving.</p>}
      {waitingMedia > 0 && <p className="text-xs text-amber-700">{waitingMedia} step{waitingMedia === 1 ? '' : 's'} need a picture (a testimonial or similar). Add one below, or add testimonials in Materials and write again.</p>}
      {notice && <p className="rounded-lg bg-[#28A745]/10 px-3 py-2 text-xs text-[#27500A]">{notice}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {items.flow && (
        <ItemCard item={items.flow} title="Chat flow for this ad" subtitle={items.flow.goal} busy={busy}
          editing={editing?.id === items.flow.id ? editing : null}
          onEdit={() => setEditing({ id: items.flow.id, kind: 'flow', content: items.flow.content, goal: items.flow.goal || '' })}
          onChangeEdit={setEditing} onSave={saveEdit} onCancel={() => setEditing(null)}
          onApprove={() => run(() => setItemStatus(items.flow.id, 'approved'))} onReject={() => run(() => setItemStatus(items.flow.id, 'rejected'))}
          note="This guides the Chat AI when these leads write to you." />
      )}

      {items.steps.map((step) => (
        <ItemCard key={step.id} item={step} busy={busy}
          title={`Step ${step.position}${step.title ? `: ${step.title}` : ''}`}
          subtitle={step.position === 1 ? 'Goes out after the lead has been quiet a while' : `Waits at least ${step.delay_hours}h after the previous step`}
          klt={step.klt_phase} editing={editing?.id === step.id ? editing : null}
          onEdit={() => setEditing({ id: step.id, kind: 'step', content: step.content })}
          onChangeEdit={setEditing} onSave={saveEdit} onCancel={() => setEditing(null)}
          onApprove={() => run(() => setItemStatus(step.id, 'approved'))} onReject={() => run(() => setItemStatus(step.id, 'rejected'))}
          onMedia={(file) => run(() => attachItemMedia(businessId, step, file))}
          note={step.rationale} />
      ))}
    </div>
  );
}

function ItemCard({ item, title, subtitle, klt, note, busy, editing, onEdit, onChangeEdit, onSave, onCancel, onApprove, onReject, onMedia }) {
  const fileRef = useRef(null);
  const [label, tone] = STATUS_TEXT[item.status] || STATUS_TEXT.draft;
  return (
    <div className={`rounded-xl border bg-white p-3 ${item.status === 'rejected' ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold text-slate-900">{title}</span>
        {klt && <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${KLT[klt]?.className}`}>{KLT[klt]?.label}</span>}
        {item.touchpoint_type && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] text-slate-500">{item.touchpoint_type.replace(/_/g, ' ')}</span>}
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tone}`}>{label}</span>
      </div>
      {subtitle && <div className="mt-0.5 text-[11px] text-slate-500">{subtitle}</div>}

      {editing ? (
        <div className="mt-2 space-y-2">
          {item.kind === 'flow' && (
            <input value={editing.goal} onChange={(e) => onChangeEdit({ ...editing, goal: e.target.value })} placeholder="Goal"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#28A745] focus:outline-none" />
          )}
          <textarea value={editing.content} onChange={(e) => onChangeEdit({ ...editing, content: e.target.value })} rows={item.kind === 'flow' ? 8 : 4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#28A745] focus:outline-none" />
          <div className="flex gap-2">
            <button type="button" onClick={onSave} disabled={busy || !editing.content.trim()} className="rounded-lg bg-[#28A745] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Save</button>
            <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{item.content}</p>
      )}

      {item.media?.url && <img src={item.media.url} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
      {item.status === 'needs_media' && onMedia && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          <span className="flex-1">This step needs a {item.media_source === 'ad_image' ? 'picture of the ad' : 'testimonial picture'}. It will be skipped until you add one.</span>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-amber-800 shadow-sm"><Upload size={12} /> Add</button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onMedia(f); }} />
        </div>
      )}
      {item.qc_passed === false && <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-600">Did not pass the quality check: {item.qc_notes || 'see message'}</p>}
      {note && !editing && <p className="mt-2 text-[11px] italic text-slate-400">{note}</p>}

      {!editing && item.status !== 'applied' && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.status !== 'needs_media' && (
            <button type="button" onClick={onApprove} disabled={busy || item.status === 'approved' || item.qc_passed === false}
              className="inline-flex items-center gap-1 rounded-lg bg-[#28A745]/10 px-2.5 py-1 text-xs font-semibold text-[#1F7A3E] disabled:opacity-40"><Check size={12} /> Approve</button>
          )}
          <button type="button" onClick={onEdit} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"><Pencil size={12} /> Edit</button>
          {item.status !== 'rejected' && (
            <button type="button" onClick={onReject} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"><X size={12} /> Reject</button>
          )}
        </div>
      )}
    </div>
  );
}
