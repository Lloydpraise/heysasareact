import { useEffect, useState } from 'react';
import { Image as ImageIcon, Pencil } from 'lucide-react';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import { pct, comma } from '../../../utils/analyticsHelpers';
import KpiTile from '../shared/KpiTile';
import AnCard, { SectionLabel } from '../shared/AnCard';
import HBarList from '../shared/HBarList';
import ScoreRing from '../shared/ScoreRing';
import FunnelBars from '../shared/FunnelBars';
import AdEditorDrawer from '../../followupAi/AdEditorDrawer';
import { effectiveAd, fetchPlaybooks, getBusinessId } from '../../../services/followupAiService';

// Ported from analytics.js's renderAds() + _drawerAd().
export default function Ads() {
  const { data, openDrawer, closeDrawer } = useAnalyticsContext();
  const businessId = getBusinessId();
  const [playbooks, setPlaybooks] = useState({});
  const [editingAd, setEditingAd] = useState(null);

  const loadPlaybooks = () => {
    if (!businessId) return;
    fetchPlaybooks(businessId)
      .then((rows) => setPlaybooks(Object.fromEntries(rows.map((p) => [p.ad_id, p]))))
      .catch(() => {});
  };
  useEffect(loadPlaybooks, [businessId]);

  if (!data) return null;

  // The owner's corrections (headline, text, picture) win over what the ad message carried.
  const ads = (data.adLeaderboard || []).map((ad) => {
    const eff = effectiveAd({ headline: ad.headline, body: ad.body, thumbnail: ad.thumbnail }, playbooks[ad.ad_id]);
    return { ...ad, headline: eff.headline || 'Untitled ad', body: eff.body || '', thumbnail: eff.thumbnail || '', hasEdit: Boolean(playbooks[ad.ad_id]?.override_headline || playbooks[ad.ad_id]?.override_body || playbooks[ad.ad_id]?.chosen_image_url) };
  });
  const best = ads[0] || { quality_score: 0 };
  const totalLeads = ads.reduce((s, a) => s + a.lead_count, 0);
  const totalBusinessLeads = data.funnel?.[1]?.count || 0;

  const openAdDrawer = (ad) => {
    const steps = [
      { stage: 'Generated', count: ad.lead_count },
      { stage: 'Replied', count: ad.reply_count },
      { stage: 'Interested', count: ad.product_interest_count },
      { stage: 'Converted', count: ad.conversion_count },
    ];
    openDrawer(
      ad.headline,
      <>
        {ad.thumbnail && <img src={ad.thumbnail} alt="" className="mb-4 h-40 w-full rounded-lg object-cover" />}
        <p className="mb-3 text-[12px] leading-relaxed text-slate-500">{ad.body || 'No ad text was captured for this ad.'}</p>
        <button
          type="button"
          onClick={() => { closeDrawer?.(); setEditingAd(ad); }}
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Pencil size={12} /> Edit ad details
        </button>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Funnel performance</div>
        <FunnelBars rows={steps} showDrop={false} opacityScale={[1, 0.8, 0.6, 0.4]} />
        <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-slate-50 p-3">
          <Stat label="Platform" value={ad.platform} />
          <Stat label="Avg cycle" value={`${ad.cycle_days_avg} days`} />
          <Stat label="Quality score" value={`${Math.round(ad.quality_score)} / 100`} />
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiTile tone="green" label="Active ads" value={ads.length} sub="running campaigns" />
        <KpiTile
          tone="blue"
          label="Leads from ads"
          value={comma(totalLeads)}
          sub={`${pct(totalLeads, totalBusinessLeads)}% of all business leads`}
        />
        <KpiTile
          tone={best.quality_score >= 75 ? 'green' : 'amber'}
          label="Top quality score"
          value={Math.round(best.quality_score)}
          sub="best campaign score /100"
        />
      </div>

      <AnCard>
        <SectionLabel info="Click any ad to see its full funnel breakdown. Score = composite of reply rate, conversion, and lead quality.">
          Campaign leaderboard
        </SectionLabel>
        {ads.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-slate-400">No ad data recorded yet.</div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {ads.map((ad) => {
              const cvr = pct(ad.conversion_count, ad.lead_count);
              return (
                <button
                  key={ad.ad_id}
                  type="button"
                  onClick={() => openAdDrawer(ad)}
                  className="flex items-center gap-3.5 py-3.5 text-left first:pt-0 last:pb-0 hover:bg-slate-50"
                >
                  {ad.thumbnail ? (
                    <img src={ad.thumbnail} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-slate-900">{ad.headline}</div>
                    <div className="truncate text-[11.5px] text-slate-500">{ad.body}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Pill className="bg-slate-100 text-slate-600">{ad.platform}</Pill>
                      <Pill className="bg-[#28A745]/10 text-[#27500A]">{ad.lead_count} leads</Pill>
                      <Pill className={cvr >= 15 ? 'bg-[#28A745]/10 text-[#27500A]' : 'bg-[#FF8C00]/10 text-[#FF8C00]'}>{cvr}% conv</Pill>
                      <Pill className="bg-blue-50 text-blue-600">{ad.cycle_days_avg}d cycle</Pill>
                    </div>
                  </div>
                  <ScoreRing score={ad.quality_score} />
                </button>
              );
            })}
          </div>
        )}
      </AnCard>

      {ads.length > 0 && (
        <AnCard>
          <SectionLabel info="How long from first WhatsApp message to purchase, per campaign.">
            Sales cycle by ad (avg days to convert)
          </SectionLabel>
          <HBarList
            rows={ads.map((a) => ({ label: String(a.headline || '').split('\u2014')[0].trim().slice(0, 30), count: a.cycle_days_avg }))}
            colors={['var(--chart-green)']}
            formatValue={(v) => `${v}d`}
          />
        </AnCard>
      )}

      <AdEditorDrawer
        open={Boolean(editingAd)}
        onClose={() => setEditingAd(null)}
        businessId={businessId}
        ad={editingAd}
        playbook={editingAd ? playbooks[editingAd.ad_id] : null}
        onSaved={loadPlaybooks}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Pill({ className, children }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${className}`}>{children}</span>;
}