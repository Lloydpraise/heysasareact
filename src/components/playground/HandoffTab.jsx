import { useState } from 'react';
import { AlertCircle, BellRing, Info, Loader2, Plus, Send, Trash2, UserRound, X } from 'lucide-react';
import { sendTestHandoff } from '../../services/handoffService';

const URGENCY = [{ id: 'low', label: 'Low' }, { id: 'normal', label: 'Normal' }, { id: 'high', label: 'Urgent' }];
const newId = (p) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 36).toString(36)}`.slice(0, 20);
const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#28A745] focus:ring-2 focus:ring-[#28A745]/15';

function Section({ title, hint, children, action }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
          {title}
          {hint && <span title={hint} className="text-slate-300 hover:text-slate-500"><Info size={13} /></span>}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function Pick({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`h-8 rounded-full border px-3 text-[12.5px] font-medium transition ${active ? 'border-[#28A745] bg-[#28A745] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
      {children}
    </button>
  );
}

// Handoffs: who the AI hands a chat to, for which cases. The owner is the default. The two signal lists the AI already
// used (closing and handoff triggers) stay below, so nothing that was set up is lost.
export default function HandoffTab({ businessId, handoff, showToast, children }) {
  const { config, setConfig, ownerPhone, suggested, loading, error } = handoff;
  const [testing, setTesting] = useState(false);
  const patch = (p) => setConfig({ ...config, ...p });
  const people = config.recipients;
  const toLabel = (id) => (id === 'owner' ? 'Me' : people.find((p) => p.id === id)?.name || 'Someone');

  const setPerson = (id, p) => patch({ recipients: people.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const removePerson = (id) => patch({
    recipients: people.filter((r) => r.id !== id),
    rules: config.rules.map((r) => ({ ...r, to: r.to.filter((t) => t !== id) })),
    default_to: config.default_to.filter((t) => t !== id).length ? config.default_to.filter((t) => t !== id) : ['owner'],
  });
  const setRule = (id, p) => patch({ rules: config.rules.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const toggleTo = (rule, id) => setRule(rule.id, { to: rule.to.includes(id) ? rule.to.filter((t) => t !== id) : [...rule.to, id] });
  const addRule = (seed = {}) => patch({ rules: [...config.rules, { id: newId('r'), label: '', when: '', to: [], urgency: 'normal', ...seed }] });

  const test = async () => {
    setTesting(true);
    try {
      const r = await sendTestHandoff(businessId);
      showToast?.(r.sent === r.of ? 'Test alert sent. Check WhatsApp.' : `Sent to ${r.sent} of ${r.of}.`);
    } catch (e) { showToast?.(e.message || 'Could not send the test.', 'error'); } finally { setTesting(false); }
  };

  if (loading) return <p className="flex items-center gap-2 py-6 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</p>;

  const unusedSuggestions = suggested.filter((s) => !config.rules.some((r) => r.label === s.label));

  return (
    <div>
      {error && <p className="mb-4 rounded-2xl bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}

      <Section title="Who gets told" hint="You are told by default. You always see handoffs on Home too.">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#1f8d3d]"><BellRing size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-slate-900">You, on WhatsApp</p>
            <p className={`truncate text-[12.5px] ${ownerPhone ? 'text-slate-500' : 'text-amber-700'}`}>
              {ownerPhone ? `+${String(ownerPhone).replace(/^\+/, '')}` : 'No alerts number yet. Add it in Business settings.'}
            </p>
          </div>
          <button type="button" role="switch" aria-checked={config.alert_whatsapp} aria-label="Send alerts on WhatsApp" title="Send alerts on WhatsApp"
            onClick={() => patch({ alert_whatsapp: !config.alert_whatsapp })}
            className={`relative h-6 w-10 shrink-0 rounded-full transition ${config.alert_whatsapp ? 'bg-[#28A745]' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${config.alert_whatsapp ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={test} disabled={testing}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[12.5px] font-medium text-slate-600 transition hover:border-[#28A745]/50 hover:text-[#1f8d3d] disabled:opacity-50">
            {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send test alert
          </button>
        </div>
      </Section>

      <Section title="Other people" hint="Add a teammate, then pick them for the cases below."
        action={people.length < 10 && (
          <button type="button" onClick={() => patch({ recipients: [...people, { id: newId('p'), name: '', phone: '' }] })}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-200"><Plus size={13} /> Add</button>
        )}>
        {people.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-3 text-[12.5px] text-slate-400">Just you for now.</p>
        ) : (
          <div className="space-y-2">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"><UserRound size={16} /></span>
                <input className={`${inputCls} !py-2`} placeholder="Name" value={p.name} maxLength={60} onChange={(e) => setPerson(p.id, { name: e.target.value })} />
                <input className={`${inputCls} !py-2`} placeholder="07XX XXX XXX" inputMode="tel" value={p.phone} onChange={(e) => setPerson(p.id, { phone: e.target.value })} />
                <button type="button" onClick={() => removePerson(p.id)} aria-label="Remove" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Which case goes to who" hint="When the AI sees one of these, it tells the people you pick. Anything else goes to you."
        action={config.rules.length < 20 && (
          <button type="button" onClick={() => addRule()} className="inline-flex h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-200"><Plus size={13} /> Add case</button>
        )}>
        <div className="space-y-2.5">
          {config.rules.map((rule) => (
            <div key={rule.id} className="space-y-2.5 rounded-3xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-center gap-2">
                <input className={`${inputCls} !py-2 font-semibold`} placeholder="Name this case" value={rule.label} maxLength={60} onChange={(e) => setRule(rule.id, { label: e.target.value })} />
                <button type="button" onClick={() => patch({ rules: config.rules.filter((r) => r.id !== rule.id) })} aria-label="Remove case" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-600"><X size={16} /></button>
              </div>
              <textarea className={`${inputCls} resize-none`} rows={2} maxLength={300} placeholder="When does this happen? e.g. The customer wants a refund or sounds upset" value={rule.when} onChange={(e) => setRule(rule.id, { when: e.target.value })} />
              <div>
                <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">Tell</p>
                <div className="flex flex-wrap gap-1.5">
                  {['owner', ...people.map((p) => p.id)].map((id) => (
                    <Pick key={id} active={rule.to.length ? rule.to.includes(id) : id === 'owner'} onClick={() => toggleTo(rule, id)}>{toLabel(id)}</Pick>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {URGENCY.map((u) => <Pick key={u.id} active={rule.urgency === u.id} onClick={() => setRule(rule.id, { urgency: u.id })}>{u.label}</Pick>)}
              </div>
            </div>
          ))}
        </div>
        {unusedSuggestions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {unusedSuggestions.map((s) => (
              <button key={s.label} type="button" onClick={() => addRule({ label: s.label, when: s.when })}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 text-[12px] text-slate-500 transition hover:border-[#28A745]/60 hover:text-[#1f8d3d]"><Plus size={12} /> {s.label}</button>
            ))}
          </div>
        )}
        {config.rules.some((r) => r.when.trim() && people.some((p) => !p.name.trim() || !p.phone.trim())) && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-amber-700"><AlertCircle size={13} /> Fill in every person's name and number before saving.</p>
        )}
      </Section>

      <div className="border-t border-slate-100 pt-5">
        <h4 className="mb-3 text-[13px] font-bold text-slate-900">What the AI looks for</h4>
        {children}
      </div>
    </div>
  );
}
