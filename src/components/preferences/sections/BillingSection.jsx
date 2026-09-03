import { GlassCard } from '../shared/ui';
import { ICONS } from '../../../constants/preferencesConfig';

export function BillingSection({ mockBalance }) {
  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-6">
        
        <GlassCard className="relative col-span-1 min-w-0 w-full overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#28A745]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Available Balance</h3>
          <div className="text-4xl font-bold text-slate-900 mb-1">
            ${mockBalance.balance_usd.toFixed(2)}
          </div>
          <p className="text-sm text-slate-500 mb-6">Estimated ~423 messages remaining</p>
          
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors w-full sm:w-auto">
            Top Up Balance
          </button>
        </GlassCard>

        <GlassCard className="col-span-1 min-w-0 w-full space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">Spent This Month</div>
            <div className="text-xl font-semibold text-slate-800">${mockBalance.spent_this_month.toFixed(2)}</div>
          </div>
          <div className="pt-4 border-t border-slate-200/80">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">All Time Spend</div>
            <div className="text-lg font-medium text-slate-700">${mockBalance.spent_all_time.toFixed(2)}</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="w-full">
        <h3 className="text-sm font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <span dangerouslySetInnerHTML={{ __html: ICONS.scale }} className="text-slate-500" />
          Usage Statistics
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-slate-800 mb-1">{mockBalance.followups_sent}</div>
            <div className="text-sm text-slate-600">Automated follow-ups sent</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-[#1f8d3d] mb-1">{mockBalance.won_leads}</div>
            <div className="text-sm text-slate-600">Leads won via automation</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}