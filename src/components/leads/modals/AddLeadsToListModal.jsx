import { useEffect, useState } from 'react';
import { ListChecks, LoaderCircle, Plus, X } from 'lucide-react';
import { getLeadDisplayName } from '../../../utils/leadHelpers';
import { fetchManualLists } from '../../../services/leadWorkspaceService';

// Add one lead (or a selection) to a list you already have, or start a new one. Replaces the old box that
// could only ever create a brand new list.
export default function AddLeadsToListModal(props) {
  if (!props.open) return null;
  return <AddLeadsToListBody {...props} />;
}

function AddLeadsToListBody({ leads, businessId, onClose, onConfirm }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    fetchManualLists(businessId)
      .then((rows) => { if (!cancelled) setLists(rows); })
      .catch((loadError) => { if (!cancelled) { setLists([]); setError(loadError.message || 'Could not load your lists.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [businessId]);

  const single = leads.length === 1;
  const creating = !selectedId;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (creating && !newName.trim()) { setError('Pick a list or name a new one.'); return; }
    setSaving(true);
    setError('');
    try {
      await onConfirm({ listId: selectedId || null, newListName: selectedId ? null : newName.trim() });
    } catch (saveError) {
      setError(saveError.message || 'Could not add to the list.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="sheet-panel flex max-h-[min(680px,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="add-leads-to-list-title">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]"><ListChecks size={18} /></div>
            <div>
              <h2 id="add-leads-to-list-title" className="text-[16px] font-bold text-slate-900">Add to list</h2>
              <p className="text-[12px] text-slate-500">{single ? getLeadDisplayName(leads[0].name, leads[0].phone, leads[0]) : `${leads.length} selected leads`}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Your lists</div>
          {loading ? (
            <p className="flex items-center gap-2 py-3 text-[12px] text-slate-400"><LoaderCircle size={13} className="animate-spin" /> Loading lists...</p>
          ) : lists.length === 0 ? (
            <p className="py-2 text-[12px] text-slate-400">You have no manual lists yet. Name one below.</p>
          ) : (
            <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
              {lists.map((list) => (
                <button key={list.id} type="button" onClick={() => setSelectedId(selectedId === list.id ? '' : list.id)} aria-pressed={selectedId === list.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[13px] font-semibold transition ${selectedId === list.id ? 'border-[#28A745] bg-[#28A745]/10 text-[#1f8d3d] ring-2 ring-[#28A745]/20' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  <span className="truncate">{list.name}</span>
                  {selectedId === list.id && <span className="text-[11px]">Selected</span>}
                </button>
              ))}
            </div>
          )}

          <div className={`mt-4 transition ${selectedId ? 'opacity-40' : ''}`}>
            <label htmlFor="new-list-name" className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400"><Plus size={11} /> Or start a new list</label>
            <input id="new-list-name" value={newName} disabled={Boolean(selectedId)} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. VIP follow-up" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 focus:border-[#28A745] focus:bg-white focus:outline-none" />
          </div>
          {error && <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button type="submit" disabled={saving || (creating && !newName.trim())} className="flex items-center gap-1.5 rounded-lg bg-[#28A745] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#218c3a] disabled:cursor-not-allowed disabled:opacity-50">
            {saving && <LoaderCircle size={13} className="animate-spin" />} {creating ? 'Create list and add' : 'Add to list'}
          </button>
        </div>
      </form>
    </div>
  );
}
