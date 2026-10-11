import { useEffect, useRef, useState } from 'react';
import { Download, LoaderCircle, MessageCircleMore, MoreVertical, RefreshCw, Sparkles } from 'lucide-react';

// The less-used list tools (sync, analyse everything, export, refresh) tucked behind one vertical three-dot button.
export default function ListToolsMenu({ onSync, syncing, onAnalyzeAll, analysingAll, canAnalyzeAll, onExport, exporting, canExport, onRefresh, refreshing }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const run = (action) => () => { setOpen(false); action?.(); };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Lead tools"
        title="Lead tools"
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${open ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10">
          <Item onClick={run(onSync)} disabled={syncing} icon={syncing ? <LoaderCircle size={15} className="animate-spin" /> : <MessageCircleMore size={15} />}>{syncing ? 'Syncing...' : 'Sync chats'}</Item>
          <Item onClick={run(onAnalyzeAll)} disabled={!canAnalyzeAll || analysingAll} icon={analysingAll ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}>{analysingAll ? 'Analysing...' : 'Analyse all'}</Item>
          <Item onClick={run(onExport)} disabled={!canExport || exporting} icon={exporting ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}>Export CSV</Item>
          <Item onClick={run(onRefresh)} icon={<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />}>Refresh</Item>
        </div>
      )}
    </div>
  );
}

function Item({ icon, children, onClick, disabled }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-4 w-4 items-center justify-center text-slate-400">{icon}</span>
      {children}
    </button>
  );
}
