import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DATA_ISSUE_TEXT, PLAYBOOK_STATUS, effectiveAd, fetchPlaybooks } from '../../services/followupAiService';
import AnCard from '../analytics/shared/AnCard';
import AdEditorDrawer from './AdEditorDrawer';
import PlaybookReview from './PlaybookReview';

// One card per ad: what the Follow-up AI wrote for it, waiting for the owner's approval.
// (Until the Home section exists, this is where approvals live.)
export default function AdPlaybooksPanel({ businessId, onChanged }) {
  const [playbooks, setPlaybooks] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [approvalDefault, setApprovalDefault] = useState('granular');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setPlaybooks(await fetchPlaybooks(businessId));
    } catch (e) {
      setError(e.message || 'Could not load ad playbooks.');
      setPlaybooks((current) => current || []);
    }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!supabase || !businessId) return;
    supabase.from('businesses').select('followup_approval_default').eq('business_id', businessId).maybeSingle()
      .then(({ data }) => { if (data?.followup_approval_default) setApprovalDefault(data.followup_approval_default); });
  }, [businessId]);

  // while the AI is still writing, check back
  useEffect(() => {
    if (!playbooks?.some((p) => ['pending', 'generating'].includes(p.status) || p.regenerate_requested_at)) return undefined;
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [playbooks, load]);

  if (!playbooks) return <div className="py-8 text-center text-sm text-slate-400">Loading…</div>;

  if (!playbooks.length) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
        <h3 className="text-base font-semibold text-slate-800">No ad playbooks yet</h3>
        <p className="mt-1 max-w-md text-sm text-slate-500">When a lead messages you from an ad, the Follow-up AI reads the ad and writes a chat flow and a follow-up sequence for it. They appear here for you to approve.</p>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {playbooks.map((pb) => {
        const ad = effectiveAd({}, pb);
        const status = PLAYBOOK_STATUS[pb.status] || PLAYBOOK_STATUS.pending;
        const reviewable = ['review', 'active'].includes(pb.status);
        return (
          <AnCard key={pb.id}>
            <div className="flex items-start gap-3">
              {ad.thumbnail ? (
                <img src={ad.thumbnail} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300"><ImageIcon size={20} /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-slate-900">{ad.headline || 'Untitled ad'}</div>
                <div className="line-clamp-2 text-[11.5px] text-slate-500">{ad.body || 'No ad text yet'}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${status.className}`}>{status.label}</span>
                  {pb.regenerate_requested_at && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-semibold text-blue-600">Rewriting from your edit</span>}
                </div>
                {['needs_data', 'failed'].includes(pb.status) && (
                  <ul className="mt-2 space-y-0.5 text-xs text-amber-700">
                    {(pb.data_issues || []).map((i) => <li key={i}>{DATA_ISSUE_TEXT[i] || i}</li>)}
                    {pb.status === 'failed' && <li>The AI could not write this one ({pb.last_error || 'unknown reason'}). Use "Write again".</li>}
                  </ul>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col gap-1.5">
                <button type="button" onClick={() => setEditing(pb)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Edit ad</button>
                {reviewable && (
                  <button type="button" onClick={() => setOpenId(openId === pb.id ? null : pb.id)} className="rounded-lg bg-[#28A745] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#218838]">
                    {openId === pb.id ? 'Hide' : 'Review'}
                  </button>
                )}
              </div>
            </div>
            {openId === pb.id && reviewable && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <PlaybookReview playbook={pb} businessId={businessId} approvalDefault={approvalDefault} onChanged={() => { load(); onChanged?.(); }} />
              </div>
            )}
          </AnCard>
        );
      })}

      <AdEditorDrawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        businessId={businessId}
        ad={editing ? { ad_id: editing.ad_id, headline: editing.auto_headline, body: editing.auto_body, thumbnail: editing.auto_thumbnail_url } : null}
        playbook={editing}
        onSaved={() => { load(); onChanged?.(); }}
      />
    </div>
  );
}
