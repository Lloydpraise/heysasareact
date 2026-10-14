import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { applySwitches, approveMessageGroup, approvePlaybookPlan, getHomeApprovals, getSetupDefaults } from '../../services/setupService';
import { goToTab } from './homeCopy';
import HelpGuide from './guides/HelpGuide';

const primary = 'rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f8d3d] disabled:opacity-50';
const quiet = 'rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700';

// "Approve your follow-ups": one card per plan and one button per card, not one per lead.
export default function ApprovalsCard({ businessId, onChanged }) {
  const [data, setData] = useState(null);
  const [followupsOn, setFollowupsOn] = useState(null);
  const [busyKey, setBusyKey] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [approvals, defaults] = await Promise.all([getHomeApprovals(businessId), getSetupDefaults(businessId)]);
      setData(approvals);
      setFollowupsOn(defaults.followups.on);
      setError('');
    } catch (e) { setError(e.message); setData((current) => current || { groups: [] }); }
  }, [businessId]);

  useEffect(() => {
    const first = async () => { await load(); };
    first();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const approve = async (group) => {
    setBusyKey(group.key); setError(''); setNote('');
    try {
      if (group.kind === 'playbook') {
        await approvePlaybookPlan(group.playbook_id);
        setNote('Plan approved. Its messages will show up here for your OK.');
      } else {
        const result = await approveMessageGroup(businessId, group.campaign_id || 'other');
        setNote(`${result.approved} message${result.approved === 1 ? '' : 's'} approved.${result.skipped ? ` ${result.skipped} need a quick look first.` : ''}`);
      }
      await load();
      onChanged?.();
    } catch (e) { setError(e.message); }
    finally { setBusyKey(''); }
  };

  const toggleFollowups = async () => {
    setError('');
    try { await applySwitches(businessId, { followups: !followupsOn }); await load(); }
    catch (e) { setError(e.message); }
  };

  const groups = data?.groups || [];

  return (
    <AnCard>
      <div className="flex items-center gap-2"><SectionLabel>Approve your follow-ups</SectionLabel><HelpGuide id="approve-plan" /></div>
      {!data && <div className="py-6 text-center text-sm text-slate-400">Loading...</div>}
      {data && !groups.length && (
        <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-[#28A745]" aria-hidden="true" />
          Nothing is waiting for you. New follow-ups will show up here for a one-tap OK.
        </div>
      )}
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.key} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900">{group.title}</h3>
                <p className="text-sm text-slate-500">
                  {group.kind === 'playbook' ? 'A new follow-up plan is ready for your review.' : `${group.count} message${group.count === 1 ? '' : 's'} ready for your OK.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className={quiet} onClick={() => (group.kind === 'playbook' && group.ad_id
                  ? window.dispatchEvent(new CustomEvent('heysasa:open-campaign', { detail: { adKey: String(group.ad_id) } }))
                  : goToTab('lists-campaigns'))}>Read first</button>
                <button type="button" className={primary} disabled={busyKey === group.key} onClick={() => approve(group)}>
                  {group.kind === 'playbook' ? 'Approve plan' : `Approve ${Math.max(0, group.count - group.blocked)}`}
                </button>
              </div>
            </div>
            {group.samples?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {group.samples.map((sample) => <li key={sample} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">“{sample}”</li>)}
              </ul>
            )}
            {group.blocked > 0 && <p className="mt-2 text-xs text-amber-700">{group.blocked} need a quick look first. They are not included.</p>}
          </div>
        ))}
      </div>
      {note && <p className="mt-3 text-sm text-[#27500A]">{note}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {followupsOn !== null && (
        <div className="mt-4 border-t border-slate-100 pt-3 text-right">
          <button type="button" onClick={toggleFollowups} className="text-xs font-medium text-slate-400 hover:text-slate-600">
            {followupsOn ? 'Pause all follow-ups' : 'Turn follow-ups back on'}
          </button>
        </div>
      )}
    </AnCard>
  );
}
