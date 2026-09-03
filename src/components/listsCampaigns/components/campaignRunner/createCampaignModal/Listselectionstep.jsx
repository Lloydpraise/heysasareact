import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { fetchCampaignListLocks, fetchListsForCampaignPicker, previewCampaignAudience } from '../../../../../services/listsCampaignsService';

const MAX_LISTS = 2;

export default function ListSelectionStep({ businessId, campaignId, selectedListIds, onChangeSelection, onAudiencePreview }) {
  const [lists, setLists] = useState(null);
  const [campaignLocks, setCampaignLocks] = useState({});
  const [loadError, setLoadError] = useState('');
  const [audience, setAudience] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchListsForCampaignPicker(businessId), fetchCampaignListLocks(businessId, campaignId)])
      .then(([rows, locks]) => {
        if (cancelled) return;
        setLists(rows);
        setCampaignLocks(locks);
      })
      .catch((err) => { if (!cancelled) setLoadError(err.message || 'Could not load lists.'); });
    return () => { cancelled = true; };
  }, [businessId, campaignId]);

  useEffect(() => {
    if (selectedListIds.length === 0) {
      setAudience(null);
      onAudiencePreview?.(null);
      return;
    }
    let cancelled = false;
    setAudienceLoading(true);
    previewCampaignAudience(businessId, selectedListIds)
      .then((result) => {
        if (cancelled) return;
        setAudience(result);
        onAudiencePreview?.(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setAudience({ error: err.message || 'Could not compute audience.' });
      })
      .finally(() => { if (!cancelled) setAudienceLoading(false); });
    return () => { cancelled = true; };
  }, [businessId, selectedListIds, onAudiencePreview]);

  const toggleList = (listId) => {
    if (selectedListIds.includes(listId)) {
      onChangeSelection(selectedListIds.filter((id) => id !== listId));
      return;
    }
    if (selectedListIds.length >= MAX_LISTS) return;
    onChangeSelection([...selectedListIds, listId]);
  };

  const selectedNames = useMemo(
    () => (lists || []).filter((l) => selectedListIds.includes(l.id)).map((l) => l.name),
    [lists, selectedListIds]
  );

  if (loadError) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>;
  }

  if (!lists) {
    return <p className="text-sm text-slate-500">Loading lists…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#28A745]/15 bg-[#28A745]/5 p-3 text-sm text-slate-600">
        Choose up to {MAX_LISTS} lists to target. If a contact appears in both, they're only counted — and messaged — once.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lists.map((list) => {
          const selected = selectedListIds.includes(list.id);
          const lockedBy = campaignLocks[list.id];
          const disabled = !selected && (Boolean(lockedBy) || selectedListIds.length >= MAX_LISTS);
          return (
            <button
              key={list.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleList(list.id)}
              className={`text-left rounded-2xl border p-4 transition ${
                selected
                  ? 'border-[#28A745] bg-[#28A745]/5'
                  : disabled
                    ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-[#28A745]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  {list.name}
                  {list.isAuto && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                      Auto
                    </span>
                  )}
                </p>
                {selected && <Check className="h-4 w-4 text-[#28A745] flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {list.memberCount} member{list.memberCount === 1 ? '' : 's'} · {list.sendableCount} we can send to
              </p>
              {lockedBy && <p className="mt-2 text-[11px] font-medium text-amber-600">Already used by {lockedBy}</p>}
            </button>
          );
        })}
      </div>

      {selectedListIds.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-slate-700">{selectedNames.join(' + ')}</p>
          {audienceLoading && <p className="text-slate-400 text-xs mt-1">Calculating merged audience…</p>}
          {!audienceLoading && audience?.error && (
            <p className="text-red-600 text-xs mt-1">{audience.error}</p>
          )}
          {!audienceLoading && audience && !audience.error && (
            <p className="text-xs mt-1">
              <span className="text-slate-800 font-medium">{audience.totalMembers} unique leads</span>
              {audience.excludedCount > 0 && (
                <span className="text-slate-500">
                  {' — '}{audience.excludedCount} excluded, already in an active follow-up
                </span>
              )}
              <span className="text-[#28A745] font-medium">
                {' · '}{audience.sendableCount} will be sent to
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}