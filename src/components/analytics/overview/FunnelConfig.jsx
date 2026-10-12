import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_FUNNEL, QUALITY_OPTIONS, STATE_OPTIONS, STAGE_COLORS, normalizeFunnel,
} from '../../../utils/overviewMetrics';

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors max-md:min-h-[34px] ${
        active ? 'border-[#28A745] bg-[#28A745]/10 text-[#1e7e34]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

// Drawer content: lets the owner define their own sales funnel. Saved per business.
export default function FunnelConfig({ initial, savedIn, onSave, onDone }) {
  const [stages, setStages] = useState(() => normalizeFunnel(initial).map((s) => ({ ...s })));
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const patch = (i, changes) => setStages((list) => list.map((s, idx) => (idx === i ? { ...s, ...changes } : s)));
  const move = (i, dir) => setStages((list) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const remove = (i) => setStages((list) => (list.length > 1 ? list.filter((_, idx) => idx !== i) : list));
  const add = () => setStages((list) => (list.length >= 8 ? list : [...list, {
    id: `stage_${Date.now().toString(36)}`, label: `Stage ${list.length + 1}`, color: STAGE_COLORS[list.length % STAGE_COLORS.length],
    weight: 10, qualities: [], states: [], minIntent: null,
  }]));

  const save = async () => {
    setSaving(true);
    setNote('');
    try {
      const result = await onSave(stages);
      if (result.saved === 'browser') {
        setNote('Saved on this device only. Run the sales_funnel migration to keep it on your account.');
      } else {
        onDone?.();
      }
    } catch (err) {
      setNote(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <p className="text-[12.5px] leading-relaxed text-slate-500">
        Build the stages your leads move through. Each lead sits in the first stage it fits, checked from the top.
        The close chance is how likely a lead in that stage is to buy. It turns your pipeline into a realistic weighted amount.
      </p>

      {stages.map((s, i) => (
        <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: s.color }} />
            <input
              value={s.label}
              onChange={(e) => patch(i, { label: e.target.value })}
              maxLength={24}
              aria-label="Stage name"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#28A745]"
            />
            <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={14} /></button>
            <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === stages.length - 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={14} /></button>
            <button type="button" aria-label="Remove stage" onClick={() => remove(i)} disabled={stages.length === 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"><Trash2 size={14} /></button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {STAGE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                onClick={() => patch(i, { color: c })}
                className={`h-5 w-5 rounded-full border-2 ${s.color === c ? 'border-slate-800' : 'border-white shadow-[0_0_0_1px_#e2e8f0]'}`}
                style={{ background: c }}
              />
            ))}
          </div>

          <div className="mt-3.5">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lead rating is</div>
            <div className="flex flex-wrap gap-1.5">
              {QUALITY_OPTIONS.map((o) => (
                <Chip key={o.id} active={s.qualities.includes(o.id)} onClick={() => patch(i, { qualities: toggle(s.qualities, o.id) })}>{o.label}</Chip>
              ))}
              {!s.qualities.length && <span className="self-center text-[11px] text-slate-400">any</span>}
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">And lead status is</div>
            <div className="flex flex-wrap gap-1.5">
              {STATE_OPTIONS.map((o) => (
                <Chip key={o.id} active={s.states.includes(o.id)} onClick={() => patch(i, { states: toggle(s.states, o.id) })}>{o.label}</Chip>
              ))}
              {!s.states.length && <span className="self-center text-[11px] text-slate-400">any</span>}
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Intent score at least
              <input
                type="number" min="0" max="100" inputMode="numeric" placeholder="any"
                value={s.minIntent ?? ''}
                onChange={(e) => patch(i, { minIntent: e.target.value === '' ? null : Number(e.target.value) })}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-[#28A745]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Close chance %
              <input
                type="number" min="0" max="100" inputMode="numeric"
                value={s.weight}
                onChange={(e) => patch(i, { weight: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-[#28A745]"
              />
            </label>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={add} disabled={stages.length >= 8} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:border-[#28A745] hover:text-[#28A745] disabled:opacity-40 max-md:min-h-[44px]">
          <Plus size={14} /> Add stage
        </button>
        <button type="button" onClick={() => setStages(DEFAULT_FUNNEL.map((s) => ({ ...s })))} className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-slate-400 hover:text-slate-600 max-md:min-h-[44px]">
          Reset to Hot / Warm / Cold
        </button>
      </div>

      {note && <p className="text-[12px] text-amber-600">{note}</p>}
      {!note && savedIn === 'browser' && <p className="text-[11.5px] text-slate-400">Currently saved on this device only.</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="sticky bottom-0 rounded-xl bg-[#28A745] px-4 py-3 text-[14px] font-bold text-white shadow-lg shadow-[#28A745]/20 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save funnel'}
      </button>
    </div>
  );
}
