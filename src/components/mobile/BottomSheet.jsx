import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useBackClose } from '../../hooks/useBackClose';

// Shared mobile bottom sheet: springy slide-up, fading scrim, drag-to-dismiss
// from the handle/header, Back-button aware, safe-area padded.
//
// Props:
//   open, onClose — controlled visibility
//   title         — optional header title
//   footer        — optional sticky footer (action buttons)
//   tall          — true = fills ~92% of the screen (forms), default sizes to content
//   zIndex        — stacking (default sits above the shell and drawers)
export default function BottomSheet({ open, onClose, title, footer, tall = false, zIndex = 150, children }) {
  const [mounted, setMounted] = useState(open);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);

  // Render-phase sync so the sheet mounts the same frame `open` flips true.
  if (open && !mounted) setMounted(true);
  const closing = mounted && !open;

  // Keep it mounted just long enough to play the exit animation.
  useEffect(() => {
    if (open || !mounted) return undefined;
    const timer = window.setTimeout(() => setMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useBackClose(open, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const onTouchStart = (event) => {
    startY.current = event.touches[0].clientY;
    lastY.current = startY.current;
    lastT.current = event.timeStamp;
    velocity.current = 0;
    setDragging(true);
  };

  const onTouchMove = (event) => {
    const y = event.touches[0].clientY;
    const dt = Math.max(1, event.timeStamp - lastT.current);
    velocity.current = (y - lastY.current) / dt;
    lastY.current = y;
    lastT.current = event.timeStamp;
    const delta = y - startY.current;
    setDragY(delta > 0 ? delta : delta / 6);
  };

  const onTouchEnd = () => {
    setDragging(false);
    if (dragY > 110 || velocity.current > 0.6) {
      onClose?.();
      setDragY(0);
      return;
    }
    setDragY(0);
  };

  return createPortal(
    <div className="fixed inset-0 flex items-end" style={{ zIndex }} role="presentation">
      <div
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] ${closing ? 'm-fade-out' : 'm-fade-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Menu'}
        className={`relative flex w-full flex-col overflow-hidden rounded-t-[1.75rem] border-t border-white/70 bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.18)] ${tall ? 'h-[92dvh]' : 'max-h-[88dvh]'} ${closing ? 'm-sheet-out' : 'm-sheet-in'}`}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          className="shrink-0 touch-none select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-300" />
          {title ? (
            <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
              <h2 className="min-w-0 truncate text-[17px] font-bold tracking-tight text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
              >
                <X size={17} />
              </button>
            </div>
          ) : <div className="h-3" />}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-1">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
            {footer}
          </div>
        )}
        {!footer && <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />}
      </div>
    </div>,
    document.body,
  );
}

// A tappable row for use inside a BottomSheet (icon + label + optional hint).
export function SheetRow({ icon: Icon, label, hint, onClick, tone = 'default', trailing, active = false }) {
  const toneClass = tone === 'danger' ? 'text-red-600' : 'text-slate-800';
  const iconTone = tone === 'danger' ? 'bg-red-50 text-red-500' : active ? 'bg-[#28A745] text-white' : 'bg-slate-100 text-slate-500';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[56px] w-full items-center gap-3.5 rounded-2xl px-2.5 py-2 text-left transition-colors active:bg-slate-100 ${toneClass}`}
    >
      {Icon && (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
          <Icon size={19} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block truncate text-[12.5px] font-normal text-slate-500">{hint}</span>}
      </span>
      {trailing}
    </button>
  );
}
