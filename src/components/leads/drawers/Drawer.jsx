import { ArrowLeft, X } from 'lucide-react';
import { useEffect } from 'react';

// Generic right-side slide-over shell. Replaces leads.js's
// openDrawer/closeAllDrawers global functions with a plain controlled
// component — the parent (LeadsPage) owns "which drawer is open" as state
// and just toggles `open`.
//
// Props:
//   open     — boolean, controls mount/visibility
//   onClose  — () => void
//   title    — string, header title
//   width    — optional Tailwind width class, defaults to a sensible drawer width
//   children — drawer body content
export default function Drawer({ open, onClose, title, width = 'w-full md:w-[420px]', children }) {
  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative flex h-full max-w-full flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${width}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 md:px-5 md:py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-[14.5px] font-bold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:flex"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}