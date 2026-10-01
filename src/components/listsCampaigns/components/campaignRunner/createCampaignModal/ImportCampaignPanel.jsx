import { useRef, useState } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { readCampaignFile, downloadJsonTemplate, downloadXlsxTemplate } from '../../../../../utils/campaignImport';

// "Upload / create": shown above the normal create screen. Reads a campaign file, checks it,
// and hands one campaign to the form. Lists and the WhatsApp number stay in the app.
export default function ImportCampaignPanel({ onApply, appliedName }) {
  const inputRef = useRef(null);
  const [results, setResults] = useState([]);
  const [fileError, setFileError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setFileError('');
    setResults([]);
    try {
      setResults(await readCampaignFile(file));
    } catch (err) {
      setFileError(err.message || 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-[#28A745]/50 bg-[#E8F8EC]/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Upload / create</p>
          <p className="text-[11px] text-slate-500">
            Build your campaign anywhere, upload it here, then just pick your lists. Or skip this and write it in the app.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={downloadXlsxTemplate} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
            <Download size={12} /> Excel template
          </button>
          <button type="button" onClick={downloadJsonTemplate} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
            <Download size={12} /> JSON template
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex items-center gap-1 rounded-lg bg-[#28A745] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#218838] disabled:opacity-50">
            <Upload size={12} /> {busy ? 'Reading…' : 'Choose file'}
          </button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.json" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {appliedName && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#1F7A3E]">
          <CheckCircle2 size={14} /> Loaded “{appliedName}”. Pick your lists below, then Continue to review the messages.
        </p>
      )}
      {fileError && <p className="mt-3 text-xs font-medium text-red-600">{fileError}</p>}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.campaign.name || 'Untitled campaign'}</p>
                  <p className="text-[11px] text-slate-500">
                    {r.campaign.steps.length} message{r.campaign.steps.length === 1 ? '' : 's'} · {r.campaign.sequenceType}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={r.errors.length > 0}
                  onClick={() => { onApply(r.campaign); setResults([]); }}
                  className="flex-shrink-0 rounded-lg bg-[#28A745] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#218838] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {r.errors.length ? 'Fix file first' : 'Use this campaign'}
                </button>
              </div>
              {r.errors.map((m) => (
                <p key={m} className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-red-600"><AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />{m}</p>
              ))}
              {r.warnings.map((m) => (
                <p key={m} className="mt-1.5 text-[11px] text-amber-700">Note: {m}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
