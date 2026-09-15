import { useState } from 'react';
import { Check, LoaderCircle, Sparkles, X } from 'lucide-react';

const STAGES = [
  ['new', 'New'],
  ['engaged', 'Engaged'],
  ['warm', 'Warm'],
  ['stalled', 'Cold'],
  ['ghosted', 'Ghosted'],
  ['won', 'Won'],
  ['lost', 'Lost'],
  ['do_not_contact', 'Do not contact'],
];

export default function EditLeadModal({ lead, open, onClose, onSave, onAnalyze, analysisState }) {
  const [form, setForm] = useState({ name: lead.name || '', phone: lead.phone || '', lead_state: lead.lead_state || 'new' });
  const [saving, setSaving] = useState(false);
  const [analysing, setAnalysing] = useState(false);

  if (!open) return null;

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, name: form.name.trim(), phone: form.phone.trim() });
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (analysisState === 'analysing') return;
    setAnalysing(true);
    try {
      await onAnalyze();
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/35 p-4 pt-10 backdrop-blur-[2px]">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#28A745]">Lead details</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Edit {lead.name || 'lead'}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close edit lead modal">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600">
            Name
            <input value={form.name} onChange={(event) => update('name', event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-[#28A745]" />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Phone number
            <input value={form.phone} onChange={(event) => update('phone', event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-[#28A745]" />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Lead stage
            <select value={form.lead_state} onChange={(event) => update('lead_state', event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-[#28A745]">
              {STAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={handleAnalyze} disabled={analysing || analysisState === 'analysing'} className="inline-flex items-center gap-1.5 rounded-lg border border-[#28A745]/30 px-3 py-2 text-xs font-semibold text-[#218c3a] hover:bg-[#28A745]/5 disabled:opacity-60">
            {analysisState === 'analysing' || analysing ? <LoaderCircle size={14} className="animate-spin" /> : analysisState === 'completed' ? <Check size={14} /> : <Sparkles size={14} />}
            {analysisState === 'analysing' || analysing ? 'Analysing...' : analysisState === 'completed' ? 'Analysed' : 'Analyse'}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#28A745] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e7a35] disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
