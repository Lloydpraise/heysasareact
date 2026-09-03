import { useEffect, useRef, useState } from 'react';
import { Check, FileSpreadsheet, FileText, Sparkles, UploadCloud, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const FIELDS = [
  { key: 'name', label: 'Name', aliases: ['name', 'full name', 'customer name', 'lead name', 'contact name', 'first name', 'full_name'] },
  { key: 'phone', label: 'Phone Number', aliases: ['phone', 'phone number', 'mobile', 'mobile number', 'cell', 'cell phone', 'contact number', 'phone_number'] },
];

const normalizeHeader = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

function guessMapping(headers) {
  return FIELDS.reduce((result, field) => {
    const match = headers.find((header) => field.aliases.some((alias) => normalizeHeader(header).includes(alias)));
    if (match) result[field.key] = match;
    return result;
  }, {});
}

export default function CreateListModal({ open, onClose, onCreate }) {
  const fileInputRef = useRef(null);
  const [listName, setListName] = useState('');
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setListName(''); setFile(null); setHeaders([]); setRows([]); setMapping({});
      setError(''); setMessage(''); setProcessing(false); setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  const handleFile = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!/\.(csv|xls|xlsx)$/i.test(selected.name)) {
      setError('Please upload a CSV, XLS, or XLSX file.');
      return;
    }
    setProcessing(true); setError(''); setMessage(''); setFile(selected);
    try {
      const workbook = XLSX.read(await selected.arrayBuffer(), { type: 'array' });
      const parsed = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
      if (!parsed.length) throw new Error('This file has no rows to import.');
      const detectedHeaders = Object.keys(parsed[0]);
      setRows(parsed); setHeaders(detectedHeaders); setMapping(guessMapping(detectedHeaders));
    } catch (parseError) {
      setRows([]); setHeaders([]); setMapping({}); setError(parseError.message || 'We could not read that spreadsheet.');
    } finally {
      setProcessing(false);
    }
  };

  const contacts = rows.map((row) => ({
    name: String(mapping.name ? row[mapping.name] : '').trim(),
    phone: String(mapping.phone ? row[mapping.phone] : '').trim(),
  })).filter((contact) => contact.name || contact.phone);

  const save = async () => {
    if (!listName.trim()) return setError('Enter a name for this list.');
    if (!contacts.length || contacts.some((contact) => !contact.name || !contact.phone)) {
      return setError('Map both Name and Phone Number. Every imported row needs both values.');
    }
    setSaving(true); setError('');
    try {
      await onCreate(listName.trim(), contacts);
      setMessage(`List created with ${contacts.length} contact${contacts.length === 1 ? '' : 's'}.`);
      setTimeout(onClose, 500);
    } catch (saveError) {
      setError(saveError.message || 'Could not create this list.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/35 p-4 pt-10 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#28A745]">Manual list</p><h3 className="mt-1 text-lg font-bold text-slate-900">Create list from a spreadsheet</h3></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close create list modal"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div><label className="mb-1 block text-xs font-medium text-slate-600">List name</label><input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="e.g. Nairobi prospects" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#28A745] focus:bg-white focus:outline-none" /></div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" onChange={handleFile} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"><UploadCloud size={16} className="text-[#28A745]" />{file ? file.name : 'Upload CSV or spreadsheet'}</button>
            {processing && <p className="mt-3 text-xs text-slate-500">Reading your file and suggesting field matches...</p>}
          </div>
          {headers.length > 0 && <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><FileSpreadsheet size={16} className="text-[#28A745]" /><p className="text-sm font-semibold text-slate-800">Map columns</p></div><span className="rounded-full bg-[#EAF9EE] px-2 py-0.5 text-[10px] font-semibold text-[#27A844]">{rows.length} rows</span></div>
            <button type="button" onClick={() => setMapping(guessMapping(headers))} className="inline-flex items-center gap-1 rounded-lg border border-[#28A745]/20 bg-[#EAF9EE] px-2.5 py-1.5 text-[11px] font-semibold text-[#1D7A35]"><Sparkles size={12} />Auto map</button>
            {FIELDS.map((field) => <div key={field.key} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center"><label className="text-xs font-medium text-slate-600">{field.label}</label><select value={mapping[field.key] || ''} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><option value="">Skip</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></div>)}
            <div className="rounded-xl border border-slate-200 bg-white p-2"><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500"><FileText size={12} />Preview</div><div className="overflow-hidden rounded-lg border border-slate-200"><table className="min-w-full text-left text-[11px]"><thead className="bg-slate-50"><tr>{headers.slice(0, 5).map((header) => <th key={header} className="border-b border-slate-200 px-2 py-1.5 font-medium">{header}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row, index) => <tr key={index}>{headers.slice(0, 5).map((header) => <td key={header} className="border-b border-slate-100 px-2 py-1.5">{row[header]}</td>)}</tr>)}</tbody></table></div></div>
          </div>}
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          {message && <div className="flex items-center gap-2 rounded-xl border border-[#D9F5E3] bg-[#EDFBF2] px-3 py-2 text-xs font-medium text-[#1D7A35]"><Check size={14} />{message}</div>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Cancel</button><button type="button" onClick={save} disabled={saving || !contacts.length} className="rounded-lg bg-[#28A745] px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{saving ? 'Creating...' : `Create list${contacts.length ? ` with ${contacts.length} contacts` : ''}`}</button></div>
        </div>
      </div>
    </div>
  );
}