import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import AnCard, { SectionLabel } from '../shared/AnCard';
import HBarList from '../shared/HBarList';
import Donut from '../shared/Donut';
import InsightNote from '../shared/InsightNote';

const COLORS = ['#3B6D11', '#27500A', '#4a8c15', '#5aaa1a', '#6fcc22', '#84d93a'];

// Ported from analytics.js's renderDemand().
export default function Demand() {
  const { data } = useAnalyticsContext();
  if (!data) return null;

  const prods = data.productDemand || [];
  const combos = data.productCombos || [];
  const totalD = prods.reduce((s, p) => s + p.count, 0);
  const donutSegs = prods.map((p, i) => ({ pct: totalD ? Math.round((p.count / totalD) * 100) : 0, color: COLORS[i % COLORS.length] }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnCard>
          <SectionLabel info="Products mentioned by leads most often. Ranked by frequency of interest expressed in conversations.">
            Product demand ranking
          </SectionLabel>
          {prods.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-slate-400">No product demand data yet.</div>
          ) : (
            <HBarList rows={prods} colors={COLORS} />
          )}
        </AnCard>

        <AnCard>
          <SectionLabel>Share of demand</SectionLabel>
          {prods.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-slate-400">No product demand data yet.</div>
          ) : (
            <div className="flex items-center gap-5">
              <Donut segments={donutSegs} size={110} thickness={18} />
              <div className="flex flex-1 flex-col gap-1.5">
                {prods.map((p, i) => (
                  <div key={p.label} className="flex items-center gap-2 text-[12px]">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="min-w-0 flex-1 truncate text-slate-600">{p.label}</span>
                    <span className="font-semibold text-slate-900">{totalD ? Math.round((p.count / totalD) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnCard>
      </div>

      <AnCard className="max-w-[480px]">
        <SectionLabel info="Leads who ask about product A also commonly ask about product B. Bundle and upsell opportunity.">
          Frequently bought together
        </SectionLabel>
        {combos.length === 0 ? (
          <div className="py-2 text-[13px] text-slate-500">No product combo data available yet.</div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-100">
              {combos.map((c, i) => (
                <div key={i} className="flex items-center gap-2 py-2.5">
                  <Pill>{c.a}</Pill>
                  <span className="text-[11px] text-slate-400">+</span>
                  <Pill>{c.b}</Pill>
                  <span className="ml-auto text-[11.5px] font-semibold text-slate-500">{c.count}{'\u00d7'}</span>
                </div>
              ))}
            </div>
            <InsightNote>
              {'\ud83d\udca1'} Consider bundling <strong>{combos[0].a} + {combos[0].b}</strong> {'\u2014'} asked together {combos[0].count} times.
            </InsightNote>
          </>
        )}
      </AnCard>
    </div>
  );
}

function Pill({ children }) {
  return <span className="rounded-full bg-[#28A745]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#27500A]">{children}</span>;
}