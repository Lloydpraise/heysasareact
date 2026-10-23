import { ArrowRight } from 'lucide-react';
import { moneyShort } from '../../utils/money';
import { comma } from '../../utils/analyticsHelpers';
import { goToTab } from './homeCopy';

// What HeySasa earned, in one quiet line under the greeting. The full numbers, charts and period switcher live in
// Analytics; Home only says the good news and offers the way in. Same numbers as Analytics (computed from the same data).
export default function ResultsLine({ results }) {
  const { raw, overview, loading, error } = results;
  if (error || loading || !raw || !overview) return null;

  const { cur } = overview;
  const parts = [];
  if (cur.revenue > 0) parts.push(`${moneyShort(cur.revenue, raw.currency)} in sales`);
  if (cur.newLeads > 0) parts.push(`${comma(cur.newLeads)} new ${cur.newLeads === 1 ? 'lead' : 'leads'}`);
  if (!parts.length) return null;

  return (
    <button
      type="button"
      onClick={() => goToTab('analytics')}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-[#28A745]/20 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 text-left transition hover:border-[#28A745]/40 max-md:min-h-[48px]"
    >
      <span className="min-w-0 text-[14px] text-slate-600">
        This week <span className="font-bold text-slate-900">{parts.join(' · ')}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#28A745]">
        Results <ArrowRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
