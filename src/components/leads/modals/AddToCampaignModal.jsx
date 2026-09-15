import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Megaphone, X } from 'lucide-react';
import { fetchCampaigns } from '../../../services/listsCampaignsService';
import { MOCK_CAMPAIGNS } from '../../listsCampaigns/constants';

export default function AddToCampaignModal({ lead, open, onClose, onConfirm, businessId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchCampaigns(businessId)
      .then((rows) => {
        if (!cancelled) setCampaigns((rows || []).filter((campaign) => campaign.status === 'active'));
      })
      .catch(() => {
        if (!cancelled) setCampaigns(MOCK_CAMPAIGNS.filter((campaign) => campaign.status === 'active'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessId, open]);

  if (!open || !lead) return null;

  const handleConfirm = async () => {
    if (!selectedCampaign || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onConfirm(selectedCampaign);
    } catch (confirmError) {
      setError(confirmError.message || 'Could not add lead to campaign.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 p-4 pt-10 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {selectedCampaign && (
              <button type="button" onClick={() => setSelectedCampaign(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Back to campaigns">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]"><Megaphone size={18} /></div>
            <div>
              <div className="text-[16px] font-bold text-slate-900">{selectedCampaign ? 'Add to campaign?' : 'Add to campaign'}</div>
              <div className="text-[12px] text-slate-500">{lead.name}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="space-y-2 px-5 py-4">
          {!selectedCampaign && loading && <p className="py-6 text-center text-[12px] text-slate-400">Loading active campaigns...</p>}
          {!selectedCampaign && !loading && campaigns.length === 0 && <p className="py-6 text-center text-[12px] text-slate-400">No active campaigns are available.</p>}
          {!selectedCampaign && !loading && campaigns.map((campaign) => (
            <button key={campaign.id} type="button" onClick={() => setSelectedCampaign(campaign)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-[#28A745]/50 hover:bg-[#F7FBF9]">
              <span>
                <span className="block text-[13px] font-semibold text-slate-800">{campaign.name}</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">{campaign.enrolled ?? 0} enrolled · {campaign.steps?.length ?? 0} steps</span>
              </span>
              <span className="text-[11px] font-semibold text-[#218c3a]">Select</span>
            </button>
          ))}
          {selectedCampaign && (
            <div className="rounded-xl border border-[#28A745]/20 bg-[#F7FBF9] px-3.5 py-3 text-[12.5px] leading-relaxed text-slate-600">
              Add <strong className="text-slate-800">{lead.name}</strong> to <strong className="text-slate-800">{selectedCampaign.name}</strong>? The campaign will include this lead even if they are not in a list.
            </div>
          )}
          {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
        </div>

        {selectedCampaign && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
            <button type="button" onClick={() => setSelectedCampaign(null)} className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={handleConfirm} disabled={isSaving} className="flex items-center gap-1.5 rounded-lg bg-[#28A745] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#1e7a35] disabled:opacity-50"><Check size={14} /> {isSaving ? 'Adding...' : 'Yes, add lead'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
