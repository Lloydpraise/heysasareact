import { useCallback, useEffect, useState } from 'react';
import { Settings2, Sparkles } from 'lucide-react';
import AnCard from '../../../analytics/shared/AnCard';
import AutoCampaignModal from './AutoCampaignModal';
import {
  activateAutoCampaign,
  fetchAutoCampaigns,
  pauseCampaign,
} from '../../../../services/listsCampaignsService';

function StatusPill({ status }) {
  const map = {
    active: 'bg-[#E8F8EC] text-[#1F7A3E]',
    paused: 'bg-amber-50 text-amber-700',
  };
  const label = status === 'active' ? 'Active' : status === 'paused' ? 'Paused' : 'Off';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || 'bg-slate-100 text-slate-500'}`}>
      {label}
    </span>
  );
}

function spanLabel(steps) {
  const total = steps.reduce((sum, s) => sum + (Number(s.gapHours) || 0), 0);
  const days = Math.round(total / 24);
  return `${steps.length} message${steps.length === 1 ? '' : 's'}${days > 0 ? ` over ${days} day${days === 1 ? '' : 's'}` : ''}`;
}

export default function AutoCampaignsPanel({ businessId, onChanged }) {
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busyRule, setBusyRule] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await fetchAutoCampaigns(businessId));
    } catch (err) {
      console.error('Unable to load auto-campaigns', err);
      setItems([]);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) load();
  }, [businessId, load]);

  const refresh = () => {
    load();
    onChanged?.();
  };

  const toggle = async (auto) => {
    setError('');
    if (auto.campaignStatus === 'active') {
      setBusyRule(auto.ruleId);
      try {
        await pauseCampaign(auto.campaignId, true);
        refresh();
      } catch (err) {
        setError(err.message || 'Could not pause this campaign.');
      } finally {
        setBusyRule('');
      }
      return;
    }
    // Activating needs a sending number; if none is chosen yet, open the configure view.
    if (!auto.whatsappInstanceName) {
      setSelected(auto);
      return;
    }
    setBusyRule(auto.ruleId);
    try {
      await activateAutoCampaign(businessId, auto.ruleId);
      refresh();
    } catch (err) {
      setError(err.message || 'Could not activate this campaign.');
    } finally {
      setBusyRule('');
    }
  };

  if (!items) return <div className="text-sm text-slate-400">Loading auto-campaigns...</div>;

  if (!items.length) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
        <Sparkles className="h-5 w-5 text-slate-400" />
        <h3 className="mt-2 text-base font-semibold text-slate-800">No auto-lists yet</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Turn on an auto-list first. Each one gets a ready-made follow-up campaign you can view, edit and activate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        One ready-made campaign per auto-list. Open one to see and edit the example messages, then activate it. Nothing
        sends until you turn it on.
      </p>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((auto) => (
          <AnCard key={auto.ruleId} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-slate-900">{auto.name}</h4>
                <p className="mt-0.5 text-[11px] text-slate-400">{auto.listName}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {auto.customised && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Customised</span>
                )}
                <StatusPill status={auto.campaignStatus} />
              </div>
            </div>
            <p className="line-clamp-2 text-xs text-slate-600">{auto.objective}</p>
            <p className="text-[11px] text-slate-400">
              {spanLabel(auto.steps)} · {auto.readyCount} ready to enrol
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelected(auto)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Settings2 size={13} /> View &amp; edit
              </button>
              <button
                type="button"
                disabled={busyRule === auto.ruleId}
                onClick={() => toggle(auto)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold shadow-sm disabled:opacity-40 ${
                  auto.campaignStatus === 'active'
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-[#28A745] text-white hover:bg-[#218838]'
                }`}
              >
                {busyRule === auto.ruleId
                  ? '…'
                  : auto.campaignStatus === 'active'
                    ? 'Pause'
                    : auto.campaignStatus === 'paused'
                      ? 'Resume'
                      : 'Activate'}
              </button>
            </div>
          </AnCard>
        ))}
      </div>

      <AutoCampaignModal
        open={Boolean(selected)}
        auto={items.find((i) => i.ruleId === selected?.ruleId) || selected}
        businessId={businessId}
        onClose={() => setSelected(null)}
        onChanged={refresh}
      />
    </div>
  );
}
