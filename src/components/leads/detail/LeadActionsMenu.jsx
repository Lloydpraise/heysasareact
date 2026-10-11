import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, ExternalLink, LoaderCircle, MoreVertical, Pencil, Phone, Sparkles, User } from 'lucide-react';
import whatsappIcon from '../../../assets/images/whatsappicon.svg';

// The lead's actions in one vertical three-dot menu (desktop header). Items only appear when the action exists.
export default function LeadActionsMenu({ waLink, analysisState, onAnalyze, onOpenChat, onCall, onMeeting, onEdit, onMarkPersonal }) {
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
  const analysing = analysisState === 'analysing';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Lead actions"
        title="Lead actions"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${open ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
      >
        <MoreVertical size={17} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-9 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10">
          {onOpenChat && (
            <MenuItem onClick={run(onOpenChat)} icon={<img src={whatsappIcon} alt="" className="h-4 w-4" />}>Open chat</MenuItem>
          )}
          {onCall && <MenuItem onClick={run(onCall)} icon={<Phone size={15} />}>Call or log a call</MenuItem>}
          {onMeeting && <MenuItem onClick={run(onMeeting)} icon={<CalendarClock size={15} />}>Book a meeting</MenuItem>}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex h-4 w-4 items-center justify-center text-slate-400"><ExternalLink size={15} /></span>
              Open in WhatsApp
            </a>
          )}
          {onAnalyze && (
            <MenuItem
              onClick={run(onAnalyze)}
              disabled={analysing}
              icon={analysing ? <LoaderCircle size={15} className="animate-spin" /> : analysisState === 'completed' ? <Check size={15} className="text-[#28A745]" /> : <Sparkles size={15} />}
            >
              {analysing ? 'Analysing...' : analysisState === 'completed' ? 'Analysed' : 'Analyse lead'}
            </MenuItem>
          )}
          {(onEdit || onMarkPersonal) && <div className="my-1 h-px bg-slate-100" />}
          {onEdit && <MenuItem onClick={run(onEdit)} icon={<Pencil size={15} />}>Edit lead</MenuItem>}
          {onMarkPersonal && <MenuItem onClick={run(onMarkPersonal)} icon={<User size={15} />}>Mark as personal</MenuItem>}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, children, onClick, disabled }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-4 w-4 items-center justify-center text-slate-400">{icon}</span>
      {children}
    </button>
  );
}
