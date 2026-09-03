export default function ScheduleGuardrails({ smartTiming, setSmartTiming, dailyCap, estDays, onSetDailyCap }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Smart Timing</p>
          <p className="text-xs text-slate-500">Sends during each lead's peak hours, outside 8PM–8AM quiet hours.</p>
        </div>
        <button
          onClick={() => setSmartTiming(!smartTiming)}
          className={`h-6 w-10 rounded-full transition ${smartTiming ? 'bg-[#28A745]' : 'bg-slate-200'}`}
          aria-label="Toggle smart timing"
        >
          <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${smartTiming ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        {dailyCap ? (
          <>Daily cap: {dailyCap} msgs/day · Estimated run: {estDays} day{estDays === 1 ? '' : 's'}</>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span>Daily cap not set</span>
            {onSetDailyCap && (
              <button
                type="button"
                onClick={onSetDailyCap}
                className="rounded-full bg-[#28A745] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1f8d3d]"
              >
                Set in preferences
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}