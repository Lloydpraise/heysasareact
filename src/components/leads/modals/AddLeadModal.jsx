import { useEffect, useRef, useState } from 'react';
import { Check, FileSpreadsheet, FileText, Sparkles, UploadCloud, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const TARGET_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'state', label: 'State' },
  { key: 'quality', label: 'Quality' },
];

const HEADER_ALIASES = {
  name: ['name', 'full name', 'customer name', 'lead name', 'contact name', 'first name', 'full_name'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'cell', 'cell phone', 'contact number', 'phone_number'],
  state: ['state', 'lead state', 'status', 'stage', 'lead_status', 'leadstate'],
  quality: ['quality', 'lead quality', 'rating', 'tier', 'lead_quality'],
};

function normalizeHeader(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeState(value) {
  const state = String(value || '').trim().toLowerCase();
  if (!state) return 'new';
  const map = {
    new: 'new',
    engaged: 'engaged',
    warm: 'warm',
    stalled: 'stalled',
    ghosted: 'ghosted',
    won: 'won',
    lost: 'lost',
    do_not_contact: 'do_not_contact',
    'do not contact': 'do_not_contact',
    contacted: 'engaged',
    qualified: 'warm',
  };
  return map[state] || state.replace(/\s+/g, '_');
}

function normalizeQuality(value) {
  const quality = String(value || '').trim().toLowerCase();
  if (!quality) return 'warm';
  const map = {
    hot: 'hot',
    warm: 'warm',
    cold: 'cold',
    good: 'warm',
    high: 'hot',
    low: 'cold',
  };
  return map[quality] || quality;
}

function guessMapping(headers = []) {
  const normalized = headers.map((header) => normalizeHeader(header));
  const mapping = {};

  TARGET_FIELDS.forEach(({ key }) => {
    const aliases = HEADER_ALIASES[key] || [];
    const match = normalized.find((header) => aliases.some((alias) => header.includes(alias)));
    if (match) {
      mapping[key] = headers[normalized.indexOf(match)];
    }
  });

  return mapping;
}

function getFileType(fileName = '') {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['csv'].includes(extension)) return 'csv';
  if (['xls', 'xlsx'].includes(extension)) return 'excel';
  return null;
}

export default function AddLeadModal({ open, onClose, onCreateLead, onCreateBulkLeads }) {
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('create');
  const [form, setForm] = useState({
    name: '',
    phone: '+254',
    lead_state: 'new',
    lead_quality: 'warm',
  });
  const [fileError, setFileError] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!open) {
      setTab('create');
      setForm({ name: '', phone: '+254', lead_state: 'new', lead_quality: 'warm' });
      setFileError('');
      setParsedRows([]);
      setHeaders([]);
      setMapping({});
      setSelectedFile(null);
      setIsProcessing(false);
      setSaveMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}`,
      name: form.name.trim() || 'New Lead',
      phone: form.phone.trim() || '+254',
      lead_state: form.lead_state,
      lead_type: 'business',
      lead_quality: form.lead_quality,
      followup: {
        status: 'not_enrolled',
        current_step: 0,
        sent_steps: [],
        pending_approval: false,
        draft: null,
        next_due: null,
      },
    };

    const created = await onCreateLead?.(payload);
    if (created !== false) onClose();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = getFileType(file.name);
    if (!fileType) {
      setFileError('Please upload a CSV, XLS, or XLSX file.');
      setParsedRows([]);
      setHeaders([]);
      setMapping({});
      setSelectedFile(null);
      return;
    }

    setIsProcessing(true);
    setFileError('');
    setSelectedFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (!rows.length) {
        setParsedRows([]);
        setHeaders([]);
        setMapping({});
        setFileError('This file has no rows to import.');
        setIsProcessing(false);
        return;
      }

      const detectedHeaders = Object.keys(rows[0]);
      const guessedMapping = guessMapping(detectedHeaders);

      setHeaders(detectedHeaders);
      setParsedRows(rows);
      setMapping(guessedMapping);
    } catch (error) {
      console.error('[AddLeadModal] parse failed:', error);
      setFileError('We could not read that spreadsheet. Please check the file and try again.');
      setParsedRows([]);
      setHeaders([]);
      setMapping({});
    } finally {
      setIsProcessing(false);
    }
  };

  const updateMapping = (field, value) => {
    setMapping((prev) => ({ ...prev, [field]: value || '' }));
  };

  const previewRows = parsedRows.slice(0, 5);
  const validBulkRows = parsedRows
    .map((row) => {
      const nameValue = mapping.name ? row[mapping.name] : '';
      const phoneValue = mapping.phone ? row[mapping.phone] : '';
      const stateValue = mapping.state ? row[mapping.state] : '';
      const qualityValue = mapping.quality ? row[mapping.quality] : '';

      const name = String(nameValue ?? '').trim();
      const phone = String(phoneValue ?? '').trim();

      if (!name && !phone) return null;

      return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: name || 'New Lead',
        phone: phone || '+254',
        lead_state: normalizeState(stateValue),
        lead_quality: normalizeQuality(qualityValue),
        lead_type: 'business',
      };
    })
    .filter(Boolean);

  const handleBulkSave = async () => {
    if (!validBulkRows.length) return;

    const invalidRows = validBulkRows.filter((row) => !row.phone || !row.name);
    if (invalidRows.length) {
      setSaveMessage('Some rows are missing a name or phone number. Please fix mapping or fill the required columns.');
      return;
    }

    await onCreateBulkLeads?.(validBulkRows);
    setSaveMessage('Leads imported successfully.');
    setTimeout(() => onClose(), 500);
  };

  const handleAutoMap = () => {
    if (!headers.length) return;
    const guessed = guessMapping(headers);
    setMapping(guessed);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/35 p-4 pt-10 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#28A745]">Add lead</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Create or import leads</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close add lead modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5 inline-flex rounded-xl bg-slate-100 p-1">
          {['create', 'import'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {option === 'create' ? 'Create' : 'Import'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="cursor-pointer">
              <label className="mb-1 block cursor-pointer text-xs font-medium text-slate-600">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder=""
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="cursor-pointer">
              <label className="mb-1 block cursor-pointer text-xs font-medium text-slate-600">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+254"
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">State</label>
                <select
                  value={form.lead_state}
                  onChange={(e) => setForm((prev) => ({ ...prev, lead_state: e.target.value }))}
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#28A745] focus:bg-white focus:outline-none"
                >
                  <option value="new">New</option>
                  <option value="engaged">Engaged</option>
                  <option value="warm">Warm</option>
                  <option value="stalled">Stalled</option>
                  <option value="ghosted">Ghosted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="do_not_contact">Do not contact</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Quality</label>
                <select
                  value={form.lead_quality}
                  onChange={(e) => setForm((prev) => ({ ...prev, lead_quality: e.target.value }))}
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#28A745] focus:bg-white focus:outline-none"
                >
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#28A745] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#21963d]"
              >
                Save lead
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <UploadCloud size={16} className="text-[#28A745]" />
                {selectedFile ? selectedFile.name : 'Upload CSV or spreadsheet'}
              </button>

              {fileError && <p className="mt-3 text-xs font-medium text-red-600">{fileError}</p>}
              {isProcessing && <p className="mt-3 text-xs font-medium text-slate-500">Reading your file and suggesting field matches…</p>}
            </div>

            {headers.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-[#28A745]" />
                    <p className="text-sm font-semibold text-slate-800">Map columns</p>
                  </div>
                  <span className="rounded-full bg-[#EAF9EE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#27A844]">
                    {parsedRows.length} rows
                  </span>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleAutoMap}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#28A745]/20 bg-[#EAF9EE] px-2.5 py-1.5 text-[11px] font-semibold text-[#1D7A35] hover:bg-[#dff5e6]"
                  >
                    <Sparkles size={12} />
                    Auto map
                  </button>
                </div>

                <div className="space-y-2">
                  {TARGET_FIELDS.map(({ key, label }) => (
                    <div key={key} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                      <label className="text-xs font-medium text-slate-600">{label}</label>
                      <select
                        value={mapping[key] ?? ''}
                        onChange={(event) => updateMapping(key, event.target.value)}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#28A745] focus:outline-none"
                      >
                        <option value="">Skip</option>
                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-2">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                    <FileText size={12} />
                    Preview
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          {headers.slice(0, 5).map((header) => (
                            <th key={header} className="border-b border-slate-200 px-2 py-1.5 font-medium">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={`${row[headers[0]] || index}-preview`} className="bg-white text-slate-600">
                            {headers.slice(0, 5).map((header) => (
                              <td key={`${header}-${index}`} className="border-b border-slate-100 px-2 py-1.5">
                                {row[header] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {saveMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-[#D9F5E3] bg-[#EDFBF2] px-3 py-2 text-xs font-medium text-[#1D7A35]">
                <Check size={14} />
                {saveMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSave}
                disabled={!validBulkRows.length}
                className="rounded-lg bg-[#28A745] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#21963d] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save {validBulkRows.length} leads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
