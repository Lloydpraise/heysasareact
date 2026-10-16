import { useEffect, useState } from 'react';
import AnCard from '../analytics/shared/AnCard';
import { fetchDiscoveredProducts, saveSetupAnswers } from '../../services/setupService';
import { DAY_LABELS, DEFAULT_HOURS, HANDOFF_OPTIONS, goToTab } from './homeCopy';
import HelpGuide from './guides/HelpGuide';

const STEPS = ['hours', 'handoff', 'products'];   // "Is this what you sell?" is last, so the product results are ready
const primary = 'rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f8d3d] disabled:opacity-50';
const quiet = 'rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700';

// Three easy questions, one at a time, each skippable. Each answer is saved the moment it is given.
// `initialStep` is where the owner stopped last time (see firstOpenQuestion), so coming back never repeats an answered question.
export default function SetupQuestions({ businessId, status, onDone, initialStep = 0 }) {
  const [step, setStep] = useState(Math.min(initialStep, STEPS.length - 1));
  const [hours, setHours] = useState(status?.answers?.hours || DEFAULT_HOURS);
  const [handoff, setHandoff] = useState(status?.answers?.handoff || ['asks_for_call', 'ready_to_pay']);
  const [products, setProducts] = useState(null);
  const [crossed, setCrossed] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const name = STEPS[step];
  const productCount = status?.counters?.products || 0;

  useEffect(() => {
    if (name !== 'products' || !productCount) return;
    let cancelled = false;
    fetchDiscoveredProducts(businessId).then((rows) => { if (!cancelled) setProducts(rows); }).catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
  }, [name, productCount, businessId]);

  const next = () => { setError(''); if (step + 1 >= STEPS.length) onDone(); else setStep(step + 1); };
  const back = () => { setError(''); setStep(Math.max(0, step - 1)); };

  const save = async (answers) => {
    setSaving(true);
    setError('');
    try { await saveSetupAnswers(businessId, answers); next(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggleDay = (day) => setHours((h) => ({ ...h, days: h.days.includes(day) ? h.days.filter((d) => d !== day) : [...h.days, day].sort() }));
  const toggleHandoff = (id) => setHandoff((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <AnCard>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
          <span>While we work: {step + 1} of {STEPS.length}</span>
          <span className="flex gap-1" aria-hidden="true">
            {STEPS.map((id, index) => <span key={id} className={`h-1.5 w-5 rounded-full ${index <= step ? 'bg-[#28A745]' : 'bg-slate-200'}`} />)}
          </span>
        </div>
        {step > 0 && <button type="button" onClick={back} className="text-xs font-medium text-slate-400 hover:text-slate-600">Back</button>}
      </div>

      {name === 'hours' && (
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">When are you open? <HelpGuide id="quiet-hours" /></h3>
          <p className="mt-1 text-sm text-slate-500">HeySasa will only message your customers during these hours.</p>
          <div className="mt-3 flex items-center gap-2">
            <input type="time" value={hours.open} onChange={(e) => setHours({ ...hours, open: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1 text-sm" aria-label="Opening time" />
            <span className="text-sm text-slate-400">to</span>
            <input type="time" value={hours.close} onChange={(e) => setHours({ ...hours, close: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1 text-sm" aria-label="Closing time" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => (
              <button key={label} type="button" onClick={() => toggleDay(day)} aria-pressed={hours.days.includes(day)}
                className={`rounded-full border px-3 py-1 text-sm ${hours.days.includes(day) ? 'border-[#28A745] bg-[#28A745]/10 text-[#27500A]' : 'border-slate-200 text-slate-500'}`}>{label}</button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="button" className={primary} disabled={saving || !hours.days.length} onClick={() => save({ hours })}>Save</button>
            <button type="button" className={quiet} onClick={next}>Skip</button>
          </div>
        </div>
      )}

      {name === 'handoff' && (
        <div>
          <h3 className="text-base font-semibold text-slate-900">When should HeySasa hand a customer to you?</h3>
          <p className="mt-1 text-sm text-slate-500">Tick the moments you want to handle yourself.</p>
          <div className="mt-3 space-y-2">
            {HANDOFF_OPTIONS.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={handoff.includes(option.id)} onChange={() => toggleHandoff(option.id)} className="h-4 w-4 accent-[#28A745]" />
                {option.label}
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="button" className={primary} disabled={saving} onClick={() => save({ handoff })}>Save</button>
            <button type="button" className={quiet} onClick={next}>Skip</button>
          </div>
        </div>
      )}

      {name === 'products' && (
        <div>
          <h3 className="text-base font-semibold text-slate-900">Is this what you sell?</h3>
          {!productCount && <p className="mt-1 text-sm text-slate-500">We are still finding your products. You can skip this and check later in Products.</p>}
          {productCount > 0 && products === null && <p className="mt-1 text-sm text-slate-400">Loading...</p>}
          {products?.length > 0 && (
            <>
              <p className="mt-1 text-sm text-slate-500">Tap any that are wrong. The rest will be used.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {products.map((product) => {
                  const out = crossed.includes(product.id);
                  return (
                    <button key={product.id} type="button" aria-pressed={!out}
                      onClick={() => setCrossed((c) => (out ? c.filter((x) => x !== product.id) : [...c, product.id]))}
                      className={`rounded-full border px-3 py-1 text-sm ${out ? 'border-slate-200 text-slate-400 line-through' : 'border-[#28A745] bg-[#28A745]/10 text-[#27500A]'}`}>
                      {out ? '✕' : '✓'} {product.title}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => goToTab('products')} className="mt-2 text-xs font-medium text-[#27500A] underline">You can see all of them in Products</button>
            </>
          )}
          <div className="mt-4 flex items-center gap-2">
            {products?.length > 0 && (
              <button type="button" className={primary} disabled={saving}
                onClick={() => save({ products: { approve: products.filter((p) => !crossed.includes(p.id)).map((p) => p.id), dismiss: crossed } })}>Looks right</button>
            )}
            <button type="button" className={quiet} onClick={next}>Skip</button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </AnCard>
  );
}
