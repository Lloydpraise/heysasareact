import { RefreshCw } from 'lucide-react';
import { ANALYTICS_SECTIONS } from '../../constants/analyticsNav';
import { useAnalyticsContext } from '../../context/AnalyticsContext';
import { timeAgo } from '../../utils/leadHelpers';

export default function TopNav() {
  const { activeSection, setActiveSection, loading, lastFetchedAt, refetch } = useAnalyticsContext();

  return (
    <div className="flex flex-shrink-0 flex-col gap-2 border-b border-slate-200 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4 md:flex-row md:items-center md:justify-between md:gap-3">
      <div className="flex w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-auto">
        {ANALYTICS_SECTIONS.map((s) => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors sm:px-3 ${
                active ? 'bg-[#28A745] text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <s.Icon size={12.5} /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex w-full items-center justify-between gap-2.5 md:w-auto md:justify-end md:pl-3">
        {lastFetchedAt && !loading && (
          <span className="text-[10px] font-medium text-slate-400 sm:text-[10.5px]">Updated {timeAgo(lastFetchedAt.toISOString())} ago</span>
        )}
        <button
          type="button"
          onClick={refetch}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Refresh analytics"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}