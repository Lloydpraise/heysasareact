import { BriefcaseBusiness, ListPlus, Sparkles, Trash2, User } from 'lucide-react';

// The bar that appears while leads are selected. Every action is one tap, nothing is hidden in a menu:
// the main action is the green button, the rest sit beside it. The count and "Done" live in the row above the list.
export default function BulkBar({ personalView, disabled, onAddToList, onAnalyze, onMarkBusiness, onMarkPersonal, onDelete }) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 shadow-[0_-6px_16px_-10px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-2">
        {personalView ? (
          <button type="button" onClick={onMarkBusiness} disabled={disabled} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#28A745] px-3 text-[12.5px] font-semibold text-white shadow-sm hover:bg-[#218838] disabled:opacity-40">
            <BriefcaseBusiness size={14} /> Mark as customer
          </button>
        ) : (
          <>
            <button type="button" onClick={onAddToList} disabled={disabled} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#28A745] px-3 text-[12.5px] font-semibold text-white shadow-sm hover:bg-[#218838] disabled:opacity-40">
              <ListPlus size={14} /> Add to list
            </button>
            <button type="button" onClick={onMarkPersonal} disabled={disabled} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              <User size={14} /> Personal
            </button>
            <IconButton label="Analyse" onClick={onAnalyze} disabled={disabled}><Sparkles size={15} /></IconButton>
          </>
        )}
        <IconButton label="Delete" onClick={onDelete} disabled={disabled} danger><Trash2 size={15} /></IconButton>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, disabled, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border disabled:opacity-40 ${danger ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  );
}
