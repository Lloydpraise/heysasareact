import { X } from 'lucide-react';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';

// Replaces analytics.js's #an-overlay/#an-drawer + openDrawer()/closeDrawer().
// Reads drawer state straight from AnalyticsContext, so any section can open
// it via `openDrawer(title, <content/>)` without prop-drilling a setter down.
export default function Drawer() {
  const { drawer, closeDrawer } = useAnalyticsContext();

  if (!drawer.open || !drawer.content) return null;

  return (
    <>
      <div
        onClick={closeDrawer}
        className="fixed inset-0 z-40 bg-slate-900/20 opacity-100 transition-opacity"
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[92vw] transform bg-white shadow-2xl transition-transform sm:max-w-md translate-x-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="text-[15px] font-bold text-slate-900">{drawer.title || 'Details'}</div>
          <button type="button" onClick={closeDrawer} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={14} />
          </button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-y-auto p-4 sm:p-5">{drawer.content}</div>
      </div>
    </>
  );
}