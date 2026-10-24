import { useRef, useState } from 'react';
import { AlertCircle, Check, ExternalLink, FileText, Film, Image as ImageIcon, Loader2, Mic, Pencil, Plus, RotateCw, StickyNote, Trash2, Upload, X, File as FileIcon } from 'lucide-react';
import { useKnowledge } from '../../hooks/useKnowledge';
import { useAccount } from '../../context/useAccount';
import { accountDisplayName, importToAccount } from '../../services/accountsService';
import { ACCEPT, KINDS, MAX_FILE_BYTES, USED_BY } from '../../services/knowledgeService';

const TYPE_ICON = { pdf: FileText, image: ImageIcon, audio: Mic, video: Film, document: FileText, text: StickyNote };
const kindLabel = (id) => KINDS.find((k) => k.id === id)?.label ?? 'Other';
const usedByLabel = (id) => USED_BY.find((u) => u.id === id)?.label ?? 'Both';

function Pill({ tone = 'slate', icon: Icon, children }) {
  const tones = { green: 'bg-[#28A745]/12 text-[#1f8d3d]', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-700', slate: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold ${tones[tone]}`}>{Icon && <Icon size={11} strokeWidth={2.5} />}{children}</span>;
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} title={label} onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition ${checked ? 'bg-[#28A745]' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={value === o.id}
          className={`h-8 rounded-full border px-3.5 text-[12.5px] font-medium transition ${value === o.id ? 'border-[#28A745] bg-[#28A745] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
        >{o.label}</button>
      ))}
    </div>
  );
}

const Label = ({ children }) => <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">{children}</label>;
const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#28A745] focus:ring-2 focus:ring-[#28A745]/15';

const blank = { title: '', use_case: '', kind: 'procedure', used_by: 'both', is_active: true, mode: 'file', text: '', file: null };

function SourceForm({ initial, editing, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isNote = editing ? editing.file_type === 'text' : form.mode === 'note';
  const ready = form.title.trim() && (editing || (form.mode === 'file' ? form.file : form.text.trim().length >= 10));

  const pick = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setError('That file is over 50 MB. Upload a smaller one.'); return; }
    setError('');
    set({ file, title: form.title || file.name.replace(/\.[^.]+$/, '') });
  };

  const submit = async () => {
    setBusy(true); setError('');
    try { await onSave(form); } catch (e) { setError(e.message || 'Could not save. Please try again.'); setBusy(false); }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-slate-900">{editing ? 'Edit' : 'Add to knowledge'}</h3>
        <button type="button" onClick={onCancel} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><X size={16} /></button>
      </div>

      {!editing && (
        <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1" role="tablist">
          {[['file', 'Upload a file', Upload], ['note', 'Write a note', StickyNote]].map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={form.mode === id} onClick={() => set({ mode: id })}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition ${form.mode === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      {!editing && form.mode === 'file' && (
        <div>
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <button
            type="button" onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
            className="flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center transition hover:border-[#28A745]/60 hover:bg-[#28A745]/5"
          >
            {form.file ? (
              <><FileIcon size={22} className="text-[#28A745]" /><span className="max-w-full truncate text-[13px] font-semibold text-slate-800">{form.file.name}</span><span className="text-[11.5px] text-slate-400">{(form.file.size / 1024 / 1024).toFixed(1)} MB · tap to change</span></>
            ) : (
              <><Upload size={22} className="text-slate-400" /><span className="text-[13px] font-semibold text-slate-700">Choose a file</span><span className="text-[11.5px] text-slate-400">PDF, image, voice, video, Word · up to 50 MB</span></>
            )}
          </button>
        </div>
      )}

      <div>
        <Label>What is this?</Label>
        <input className={inputCls} value={form.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Customer support SOP" />
      </div>

      <div>
        <Label>When should the AI use it?</Label>
        <textarea className={`${inputCls} resize-none`} rows={3} maxLength={600} value={form.use_case} onChange={(e) => set({ use_case: e.target.value })}
          placeholder="e.g. This is my customer support SOP. Use it whenever you solve a support issue." />
      </div>

      {(editing ? editing.file_type === 'text' : form.mode === 'note') && (
        <div>
          <Label>Note</Label>
          <textarea className={`${inputCls} resize-y`} rows={6} value={form.text} onChange={(e) => set({ text: e.target.value })} placeholder="Write or paste what the AI should know…" />
        </div>
      )}

      <div><Label>Type</Label><Chips options={KINDS} value={form.kind} onChange={(kind) => set({ kind })} /></div>
      <div><Label>Who uses it</Label><Chips options={USED_BY} value={form.used_by} onChange={(used_by) => set({ used_by })} /></div>

      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
        <span className="text-[13px] font-medium text-slate-700">Active</span>
        <Switch checked={form.is_active} onChange={(is_active) => set({ is_active })} label="Active" />
      </div>

      {error && <p className="flex items-start gap-1.5 rounded-2xl bg-red-50 px-3 py-2 text-[12.5px] text-red-700"><AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-full px-4 text-[13px] font-medium text-slate-500 hover:bg-slate-100">Cancel</button>
        <button type="button" disabled={!ready || busy} onClick={submit}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#28A745] px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} strokeWidth={2.5} />} {busy ? (isNote || editing ? 'Saving' : 'Uploading') : 'Save'}
        </button>
      </div>
    </div>
  );
}

function SourceCard({ source, onEdit, onToggle, onRetry, onDelete, onOpen, busy, shared = false }) {
  const [confirming, setConfirming] = useState(false);
  const Icon = TYPE_ICON[source.file_type] ?? FileIcon;
  const status = source.status === 'ready' ? <Pill tone="green" icon={Check}>Ready</Pill>
    : source.status === 'failed' ? <Pill tone="red" icon={AlertCircle}>Failed</Pill>
      : <Pill tone="amber" icon={Loader2}>Reading</Pill>;
  const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40';

  return (
    <div className={`rounded-3xl border bg-white p-3.5 shadow-sm transition ${source.is_active ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#1f8d3d]"><Icon size={19} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-slate-900">{source.title}</p>
          {source.use_case && <p className="mt-0.5 line-clamp-2 text-[12.5px] text-slate-500">{source.use_case}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {status}
            <Pill>{kindLabel(source.kind)}</Pill>
            <Pill>{usedByLabel(source.used_by)}</Pill>
            {shared && <Pill>Business catalog</Pill>}
          </div>
          {source.status === 'failed' && source.status_detail && <p className="mt-2 text-[12px] text-red-600">{source.status_detail}</p>}
          {source.status === 'ready' && source.status_detail && <p className="mt-2 text-[12px] text-slate-400">{source.status_detail}</p>}
        </div>
        <Switch checked={source.is_active} onChange={(v) => onToggle(source, v)} label={source.is_active ? 'Pause' : 'Turn on'} />
      </div>
      <div className="mt-2 flex items-center justify-end gap-0.5">
        {confirming ? (
          <>
            <span className="mr-1 text-[12px] text-slate-500">Delete?</span>
            <button type="button" onClick={() => onDelete(source)} className="h-8 rounded-full bg-red-600 px-3 text-[12px] font-semibold text-white">Yes</button>
            <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded-full px-3 text-[12px] font-medium text-slate-500 hover:bg-slate-100">No</button>
          </>
        ) : (
          <>
            {source.status === 'failed' && <button type="button" onClick={() => onRetry(source)} disabled={busy} className={iconBtn} title="Try again" aria-label="Try again"><RotateCw size={15} /></button>}
            {source.file_type !== 'text' && <button type="button" onClick={() => onOpen(source)} className={iconBtn} title="Open the file" aria-label="Open the file"><ExternalLink size={15} /></button>}
            <button type="button" onClick={() => onEdit(source)} className={iconBtn} title="Edit" aria-label="Edit"><Pencil size={15} /></button>
            <button type="button" onClick={() => setConfirming(true)} className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`} title="Delete" aria-label="Delete"><Trash2 size={15} /></button>
          </>
        )}
      </div>
    </div>
  );
}

// The Knowledge tab of the persona pack. It is not part of the pack itself: it is the business's own files and notes,
// which the AI looks things up in. Mirrors Materials in Preferences.
export default function KnowledgeTab({ businessId, showToast }) {
  const { sources, loading, error, add, update, retry, remove, openFile, reload } = useKnowledge(businessId);
  // With one WhatsApp account selected, shared business files (account_id empty) show too and can be copied in.
  const { selectedAccountId, selectedAccount } = useAccount();
  const [importing, setImporting] = useState(false);
  const sharedCount = selectedAccountId ? sources.filter((s) => !s.account_id).length : 0;
  const importShared = async () => {
    if (!window.confirm(`Copy the business catalog files into ${accountDisplayName(selectedAccount)}? The copies belong to this account only.`)) return;
    setImporting(true);
    try {
      const copied = await importToAccount(businessId, selectedAccountId, 'knowledge', null);
      await reload();
      showToast?.(copied ? `Copied ${copied} file${copied === 1 ? '' : 's'} into this account.` : 'Nothing new to copy.');
    } catch (e) {
      showToast?.(e.message || 'Could not import from the business catalog.', 'error');
    } finally {
      setImporting(false);
    }
  };
  const [form, setForm] = useState(null);   // { initial, editing }
  const [busyId, setBusyId] = useState(null);

  const guard = async (fn, fallback) => { try { await fn(); } catch (e) { showToast?.(e.message || fallback, 'error'); } };

  const save = async (f) => {
    if (form.editing) {
      const patch = { title: f.title, use_case: f.use_case, kind: f.kind, used_by: f.used_by, is_active: f.is_active };
      if (form.editing.file_type === 'text' && f.text.trim() !== (form.editing.raw_text ?? '').trim()) patch.text = f.text;
      await update(form.editing.id, patch);
      showToast?.('Saved.');
    } else {
      await add({ title: f.title, use_case: f.use_case, kind: f.kind, used_by: f.used_by, is_active: f.is_active, ...(f.mode === 'file' ? { file: f.file } : { text: f.text }) });
      showToast?.(f.mode === 'file' ? 'Saved. Reading it now.' : 'Saved.');
    }
    setForm(null);
  };

  const edit = (s) => setForm({ editing: s, initial: { ...blank, title: s.title, use_case: s.use_case, kind: s.kind, used_by: s.used_by, is_active: s.is_active, text: s.raw_text ?? '', mode: s.file_type === 'text' ? 'note' : 'file' } });
  const openOriginal = (s) => guard(async () => { const url = await openFile(s.id); window.open(url, '_blank', 'noopener'); }, 'Could not open that file.');

  if (form) return <SourceForm initial={form.initial} editing={form.editing} onSave={save} onCancel={() => setForm(null)} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900">Knowledge</h3>
          <p className="text-[12.5px] text-slate-500">Files and notes your AI looks things up in.</p>
        </div>
        <button type="button" onClick={() => setForm({ initial: blank, editing: null })}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#28A745] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1f8d3d]">
          <Plus size={15} strokeWidth={2.5} /> Add
        </button>
      </div>

      {sharedCount > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-[12.5px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Files marked Business catalog are shared by every WhatsApp account.</span>
          <button type="button" onClick={importShared} disabled={importing} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {importing && <Loader2 size={13} className="animate-spin" />}Import from business catalog
          </button>
        </div>
      )}
      {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}
      {loading && <p className="flex items-center gap-2 py-6 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</p>}

      {!loading && sources.length === 0 && !error && (
        <button type="button" onClick={() => setForm({ initial: blank, editing: null })}
          className="flex w-full flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center transition hover:border-[#28A745]/60">
          <Upload size={24} className="text-slate-400" />
          <span className="text-[13.5px] font-semibold text-slate-700">Add your first file</span>
          <span className="max-w-[16rem] text-[12px] text-slate-400">A procedure, price list, policy or brochure.</span>
        </button>
      )}

      <div className="space-y-2.5">
        {sources.map((s) => (
          <SourceCard
            key={s.id} source={s} busy={busyId === s.id} shared={Boolean(selectedAccountId && !s.account_id)}
            onEdit={edit}
            onToggle={(src, v) => guard(() => update(src.id, { is_active: v }), 'Could not change that.')}
            onRetry={(src) => { setBusyId(src.id); guard(() => retry(src.id), 'Could not retry.').finally(() => setBusyId(null)); }}
            onDelete={(src) => guard(async () => { await remove(src.id); showToast?.('Deleted.'); }, 'Could not delete that.')}
            onOpen={openOriginal}
          />
        ))}
      </div>
    </div>
  );
}
