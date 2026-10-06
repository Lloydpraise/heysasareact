import { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, Loader2, X, Download } from 'lucide-react';
import { readProductFile, TEMPLATE_CSV } from '../../utils/productImport';
import { planImport } from '../../services/productsService';
import { formatMoney } from '../../utils/productHelpers';

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'heysasa-products-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Mounted only while open, so every visit starts empty.
export default function ImportModal({ existing, currency, onClose, onImport }) {
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !importing && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [importing, onClose]);

  const plan = useMemo(() => (parsed ? planImport(parsed.rows, existing) : null), [parsed, existing]);

  const readFile = async (file) => {
    setError('');
    setParsed(null);
    setReading(true);
    setFileName(file?.name || '');
    try {
      setParsed(await readProductFile(file));
    } catch (e) {
      setError(e.message);
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const confirm = async () => {
    setImporting(true);
    setError('');
    try {
      await onImport(parsed.rows, parsed.format);
    } catch (e) {
      setError(e.message || 'The import failed. Nothing was lost; try again.');
      setImporting(false);
    }
  };

  const promoted = plan ? plan.updates.filter((u) => u.wasStatus !== 'approved').length : 0;
  const warnings = parsed ? parsed.rows.flatMap((r) => r.warnings.map((w) => `Row ${r.line}: ${w}`)) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => !importing && onClose()} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Import products" className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl max-sm:m-sheet-in max-sm:pb-[env(safe-area-inset-bottom)] sm:max-w-xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Import products</h2>
          <button type="button" onClick={onClose} disabled={importing} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!parsed && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); readFile(e.dataTransfer.files?.[0]); }}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${over ? 'border-[#28A745] bg-[#28A745]/5' : 'border-slate-300'}`}
              >
                {reading ? <Loader2 className="h-7 w-7 animate-spin text-[#28A745]" /> : <FileUp className="h-7 w-7 text-slate-400" />}
                <div>
                  <p className="text-sm font-semibold text-slate-800">{reading ? `Reading ${fileName}` : 'Drop a file here'}</p>
                  <p className="mt-1 text-xs text-slate-500">CSV, Excel (.xlsx) or XML, up to 2,000 products</p>
                </div>
                <button type="button" onClick={() => inputRef.current?.click()} disabled={reading} className="rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23913d] disabled:opacity-50">Choose file</button>
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.xml" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <p>Only a name column is required. We also read price, category, description, stock, image_url and aliases. Google Shopping and other product XML feeds work too.</p>
                <p className="mt-1">Products you upload that match something found in your chats are approved and merged, so you will not see them twice.</p>
                <button type="button" onClick={downloadTemplate} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[#1f8d3d] hover:underline"><Download className="h-3.5 w-3.5" /> Download a template</button>
              </div>
            </>
          )}

          {parsed && plan && (
            <>
              <div className="rounded-2xl border border-[#28A745]/30 bg-[#28A745]/5 p-4">
                <p className="text-sm font-semibold text-slate-900">{fileName}</p>
                <p className="mt-1 text-sm text-slate-700">
                  <strong>{plan.inserts.length}</strong> new product{plan.inserts.length === 1 ? '' : 's'}
                  {plan.updates.length > 0 && <>, <strong>{plan.updates.length}</strong> already on file will be updated{promoted > 0 ? ` (${promoted} of them were waiting in Discovered and will be approved)` : ''}</>}
                  {parsed.errors.length > 0 && <>. {parsed.errors.length} row{parsed.errors.length === 1 ? '' : 's'} skipped.</>}
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2 font-semibold">Name</th><th className="px-3 py-2 font-semibold">Category</th><th className="px-3 py-2 text-right font-semibold">Price</th></tr></thead>
                  <tbody>
                    {parsed.rows.slice(0, 6).map((r) => (
                      <tr key={r.line} className="border-t border-slate-100">
                        <td className="max-w-[12rem] truncate px-3 py-2 font-medium text-slate-800">{r.title}</td>
                        <td className="px-3 py-2 text-slate-500">{r.category || ''}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{formatMoney(r.price, currency) || 'No price'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > 6 && <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">and {parsed.rows.length - 6} more</p>}
              </div>

              {(warnings.length > 0 || parsed.errors.length > 0) && (
                <ul className="space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  {parsed.errors.slice(0, 4).map((e) => <li key={`e${e.line}`}>Row {e.line}: {e.error}. Skipped.</li>)}
                  {warnings.slice(0, 4).map((w) => <li key={w}>{w}</li>)}
                  {warnings.length + parsed.errors.length > 8 && <li>and more</li>}
                </ul>
              )}
            </>
          )}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        {parsed && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <button type="button" onClick={() => { setParsed(null); setError(''); }} disabled={importing} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Choose another file</button>
            <button type="button" onClick={confirm} disabled={importing || (plan.inserts.length + plan.updates.length === 0)} className="rounded-xl bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23913d] disabled:opacity-50">
              {importing ? 'Importing' : `Import ${plan.inserts.length + plan.updates.length} products`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
