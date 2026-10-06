import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBackClose } from '../../../hooks/useBackClose';
import { useIsMobile } from '../../../hooks/useIsMobile';

// Generic right-side slide-over shell. Replaces leads.js's
// openDrawer/closeAllDrawers global functions with a plain controlled
// component — the parent (LeadsPage) owns "which drawer is open" as state
// and just toggles `open`.
//
// On phones it becomes a full-screen page that slides in from the right (and
// slides back out), padded for the notch/home indicator, and the phone's Back
// button closes it.
//
// Props:
//   open     — boolean, controls mount/visibility
//   onClose  — () => void
//   title    — string, header title
//   width    — optional Tailwind width class, defaults to a sensible drawer width
//   children — drawer body content
export default function Drawer({ open, onClose, title, width = 'w-full md:w-[420px]', children }) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) setMounted(true);
  const closing = mounted && !open;

  // Keep mounted briefly on phones so the slide-out animation can play.
  useEffect(() => {
    if (open || !mounted) return undefined;
    const timer = window.setTimeout(() => setMounted(false), isMobile ? 240 : 0);
    return () => window.clearTimeout(timer);
  }, [open, mounted, isMobile]);

  useBackClose(open && isMobile, onClose);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] ${closing ? 'm-fade-out' : 'm-fade-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative flex h-full max-w-full flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${width} ${closing ? 'max-md:m-slide-out' : 'max-md:m-slide-in'}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 max-md:pt-[calc(env(safe-area-inset-top)+0.5rem)] md:px-5 md:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-100 max-md:-ml-2 md:hidden"
              aria-label="Back"
            >
              <ArrowLeft size={21} />
            </button>
            <h2 className="truncate text-[14.5px] font-bold text-slate-900 max-md:text-[17px]">{title}</h2>
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain max-md:pb-[env(safe-area-inset-bottom)]">{children}</div>
      </div>
    </div>
  );
}
