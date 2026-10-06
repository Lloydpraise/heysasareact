import { RefreshCw } from 'lucide-react';
import ScrollTabs from '../shared/ScrollTabs';
import { ANALYTICS_SECTIONS } from '../../constants/analyticsNav';
import { useAnalyticsContext } from '../../context/AnalyticsContext';
import { timeAgo } from '../../utils/leadHelpers';

export default function TopNav() {
  const { activeSection, setActiveSection, loading, lastFetchedAt, refetch } = useAnalyticsContext();

  return (
    <div className="flex flex-shrink-0 flex-col border-b border-slate-200 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4 max-md:py-2.5">
      <div className="flex items-center gap-2 md:justify-between md:gap-3">
        <div className="min-w-0 flex-1 md:flex-none">
          <ScrollTabs tabs={ANALYTICS_SECTIONS} active={activeSection} onChange={setActiveSection} />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 md:pl-3">
          {lastFetchedAt && !loading && (
            <span className="text-[10px] font-medium text-slate-400 max-md:hidden sm:text-[10.5px]">Updated {timeAgo(lastFetchedAt.toISOString())} ago</span>
          )}
          <button
            type="button"
            onClick={refetch}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 max-md:h-11 max-md:w-11 max-md:rounded-full max-md:bg-slate-100/80"
            aria-label="Refresh analytics"
          >
            <RefreshCw size={13} className={`${loading ? 'animate-spin' : ''} max-md:h-[18px] max-md:w-[18px]`} />
          </button>
        </div>
      </div>
    </div>
  );
}
