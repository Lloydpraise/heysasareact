export default function NotificationStrip({ children, action, onAction }) {
  return (
    <div className="mb-3 flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-[#28A745]/20 bg-[#28A745]/10 px-3 py-2.5 text-[12px] text-slate-600 shadow-sm sm:px-4">
      <div className="min-w-0">{children}</div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="flex-shrink-0 rounded-lg bg-[#28A745] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#1f8d3d]"
        >
          {action}
        </button>
      )}
    </div>
  );
}