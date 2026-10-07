import { useEffect, useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import BottomSheet from '../mobile/BottomSheet';
import AssistantButton from '../assistant/AssistantButton';
import { useAssistant } from '../../context/useAssistant';
import { createFlow, deleteFlow, saveFlow } from '../../services/chatAiConfigService';
import { Badge, Field, ListRow, Switch, dangerButton, ghostButton, inputClass, primaryButton } from './ConfigShared';

const NEW = 'new';
const EMPTY = { name: '', enabled: true, priority: 100, goal: '', instructions: '', skill_keys: [], trigger: { ad_ids: [], list_ids: [] } };

const toggleIn = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
const sameList = (a, b) => a.length === b.length && a.every((v) => b.includes(v));

function CheckGroup({ options, selected, onToggle, empty }) {
  if (!options.length) return <p className="text-[12px] text-[#94A3B8]">{empty}</p>;
  return (
    <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200/80 bg-white/80 p-2">
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 text-[12.5px] text-slate-700 hover:bg-slate-50">
          <input type="checkbox" className="mt-0.5 accent-[#28A745]" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
          <span className="min-w-0">
            <span className="block truncate">{o.label}</span>
            {o.sub && <span className="block truncate text-[10.5px] text-[#94A3B8]">{o.sub}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

// What Ask HeySasa's flow draft fills in. Skill keys it proposes are already limited to this business's skills.
const fromAssistant = (d) => ({ name: d.name || '', goal: d.goal || '', instructions: d.instructions || '', skill_keys: d.skill_keys || [] });

function FlowEditor({ businessId, flow, skills, targets, prefill, isFirst, onChanged, onDeleted, onCreated, showToast }) {
  const isNew = !flow;
  const initial = flow
    ? { name: flow.name, enabled: flow.enabled, priority: flow.priority, goal: flow.goal ?? '', instructions: flow.instructions, skill_keys: flow.skill_keys ?? [], trigger: { ad_ids: (flow.trigger?.ad_ids ?? []).map(String), list_ids: (flow.trigger?.list_ids ?? []).map(String) } }
    : EMPTY;
  const [draft, setDraft] = useState(() => (isNew && prefill ? { ...EMPTY, ...fromAssistant(prefill) } : initial));
  const [adInput, setAdInput] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (field) => (event) => setDraft((d) => ({ ...d, [field]: event.target.value }));

  const hasTrigger = draft.trigger.ad_ids.length > 0 || draft.trigger.list_ids.length > 0;
  const complete = draft.name.trim() && draft.instructions.trim();
  const dirty =
    isNew ||
    draft.name !== initial.name || draft.enabled !== initial.enabled || Number(draft.priority) !== Number(initial.priority) ||
    draft.goal !== initial.goal || draft.instructions !== initial.instructions || !sameList(draft.skill_keys, initial.skill_keys) ||
    !sameList(draft.trigger.ad_ids, initial.trigger.ad_ids) || !sameList(draft.trigger.list_ids, initial.trigger.list_ids);

  const adOptions = targets.ads.map((a) => ({ value: String(a.ad_id), label: a.ad_headline || `Ad ${a.ad_id}`, sub: `${a.lead_count ?? 0} leads · ${a.ad_id}` }));
  // Ad ids already on the flow that are not in the leaderboard (typed in by hand) must stay visible.
  draft.trigger.ad_ids.filter((id) => !adOptions.some((o) => o.value === id)).forEach((id) => adOptions.push({ value: id, label: `Ad ${id}`, sub: 'added by id' }));
  const listOptions = targets.lists.map((l) => ({ value: String(l.id), label: l.name, sub: l.type }));
  const skillOptions = skills.map((s) => ({ value: s.key, label: s.title, sub: s.enabled ? s.key : `${s.key} · disabled` }));

  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      showToast(error.message || 'Something went wrong.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () =>
    run(async () => {
      if (isNew) {
        const created = await createFlow(businessId, draft);
        await onCreated(created.id);
        showToast('Flow created.');
      } else {
        await saveFlow(businessId, flow.id, draft);
        await onChanged();
        showToast('Flow saved.');
      }
    });

  const handleDelete = () => {
    if (!window.confirm(`Delete the "${flow.name}" flow? Chats already using it go back to the normal behaviour.`)) return;
    run(async () => {
      await deleteFlow(businessId, flow.id);
      await onDeleted();
      showToast('Flow deleted.');
    });
  };

  const addAd = () => {
    const id = adInput.trim();
    if (!id) return;
    setDraft((d) => ({ ...d, trigger: { ...d.trigger, ad_ids: d.trigger.ad_ids.includes(id) ? d.trigger.ad_ids : [...d.trigger.ad_ids, id] } }));
    setAdInput('');
  };

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-1 pr-2">
      <h3 className="text-sm font-semibold text-[#0F172A]">{isNew ? 'New flow' : flow.name}</h3>

      <div className={`flex flex-col gap-3 rounded-2xl border border-[#28A745]/25 bg-[#28A745]/5 p-3 sm:flex-row sm:items-center sm:justify-between ${isFirst && isNew ? 'sm:p-4' : ''}`}>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800"><Sparkles size={14} className="text-[#28A745]" /> {isFirst && isNew ? 'Not sure where to start?' : 'Let Ask HeySasa write this'}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
            {isFirst && isNew ? 'Tell me who your customers are and what a good chat looks like. I will draft your first flow.' : 'Describe it in your own words. You approve it before anything is filled in.'}
          </p>
        </div>
        <AssistantButton
          variant="pill"
          label={draft.instructions.trim() ? 'Improve with AI' : 'Write with AI'}
          surface="flow"
          title={draft.name || 'New flow'}
          contextKey={`flow:${flow?.id ?? 'new'}`}
          currentText={draft.instructions}
          context={{
            flow_name: draft.name,
            flow_goal: draft.goal,
            first_flow: !!isFirst,
            available_skills: skills.filter((s) => s.enabled).slice(0, 12).map((s) => ({ key: s.key, title: s.title })),
          }}
          onApprove={(d) => setDraft((cur) => ({ ...cur, ...fromAssistant(d), name: d.name || cur.name, goal: d.goal || cur.goal }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <Field label="Name">
          <input className={inputClass} value={draft.name} onChange={set('name')} placeholder="Wig ad leads" />
        </Field>
        <Field label="Priority" hint="Higher wins">
          <input className={inputClass} type="number" value={draft.priority} onChange={set('priority')} />
        </Field>
      </div>

      <Field label="Goal" hint="One line: what a good outcome of this chat looks like.">
        <input className={inputClass} value={draft.goal} onChange={set('goal')} placeholder="Get the customer to confirm size and delivery area" />
      </Field>

      <Field label="Instructions" hint="The AI follows these exactly and they override its usual habits for chats in this flow.">
        <textarea className={`${inputClass} text-[12.5px] leading-relaxed`} rows={7} value={draft.instructions} onChange={set('instructions')} />
      </Field>

      <Field label="Skills preloaded for this flow" hint="Loaded up front, so the AI does not spend a step asking for them.">
        <CheckGroup options={skillOptions} selected={draft.skill_keys} onToggle={(k) => setDraft((d) => ({ ...d, skill_keys: toggleIn(d.skill_keys, k) }))} empty="No skills yet. Create some in the Skills tab." />
      </Field>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
        <p className="mb-2 text-[12px] font-semibold text-slate-600">Starts when a chat…</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Came from one of these ads">
            <CheckGroup options={adOptions} selected={draft.trigger.ad_ids} onToggle={(id) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, ad_ids: toggleIn(d.trigger.ad_ids, id) } }))} empty="No ads with leads yet." />
            <div className="mt-2 flex gap-2">
              <input className={inputClass} value={adInput} onChange={(e) => setAdInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAd())} placeholder="Add an ad id" />
              <button type="button" className={ghostButton} onClick={addAd}>Add</button>
            </div>
          </Field>
          <Field label="Is in one of these lists">
            <CheckGroup options={listOptions} selected={draft.trigger.list_ids} onToggle={(id) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, list_ids: toggleIn(d.trigger.list_ids, id) } }))} empty="No lists yet." />
          </Field>
        </div>
        <p className={`mt-2 text-[11px] leading-snug ${hasTrigger ? 'text-[#94A3B8]' : 'text-[#c26a00]'}`}>
          {hasTrigger
            ? 'A chat that matches any of these gets this flow. If several flows match, the highest priority wins. A chat keeps its flow once it has one.'
            : 'No trigger chosen: this flow will never start by itself.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Switch checked={draft.enabled} onChange={(enabled) => setDraft((d) => ({ ...d, enabled }))} label={draft.enabled ? 'Enabled' : 'Disabled'} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!isNew && (
            <button type="button" className={dangerButton} disabled={busy} onClick={handleDelete}>
              <Trash2 size={11} className="mr-1 inline" /> Delete
            </button>
          )}
          <button type="button" className={primaryButton} disabled={busy || !dirty || !complete} onClick={handleSave}>
            {busy ? 'Saving…' : isNew ? 'Create flow' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FlowsPanel({ businessId, flows, skills, targets, reload, showToast }) {
  const [selectedId, setSelectedId] = useState(flows[0]?.id ?? NEW);
  const [prefill, setPrefill] = useState(null);
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { open } = useAssistant();

  // No flows yet: Ask HeySasa opens by itself, once per business, instead of waiting to be found.
  useEffect(() => {
    if (flows.length > 0 || !businessId) return;
    const flag = `heysasa:ask:first-flow:${businessId}`;
    try {
      if (localStorage.getItem(flag)) return;
      localStorage.setItem(flag, '1');
    } catch {
      return;
    }
    open({
      surface: 'flow',
      title: 'Your first flow',
      contextKey: 'flow:new',
      context: { first_flow: true, available_skills: skills.filter((s) => s.enabled).slice(0, 12).map((s) => ({ key: s.key, title: s.title })) },
      onApprove: (draft) => { setSelectedId(NEW); setPrefill({ ...draft, nonce: Date.now() }); setSheetOpen(true); },
    });
    // Runs once when the Flows tab opens with nothing in it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const selected = selectedId === NEW ? null : flows.find((f) => f.id === selectedId) ?? null;
  const activeId = selected ? selected.id : NEW;

  const editor = (
        <FlowEditor
          key={`${activeId}-${selected?.updated_at ?? ''}-${prefill?.nonce ?? ''}`}
          businessId={businessId}
          flow={selected}
          skills={skills}
          targets={targets}
          prefill={prefill}
          isFirst={flows.length === 0}
          showToast={showToast}
          onChanged={reload}
          onDeleted={async () => {
            setSelectedId(NEW);
            setSheetOpen(false);
            await reload();
          }}
          onCreated={async (id) => {
            await reload();
            setSelectedId(id);
            setSheetOpen(false);
          }}
        />
  );

  return (
    <div className={isMobile ? 'flex min-h-0 flex-1 flex-col' : 'grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(8rem,0.4fr)_minmax(0,1fr)] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]'}>
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{flows.length} flows</span>
          <button type="button" className={ghostButton} onClick={() => { setSelectedId(NEW); setSheetOpen(true); }}>
            <Plus size={11} className="mr-1 inline" /> New flow
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {flows.map((flow) => {
            const triggers = (flow.trigger?.ad_ids?.length ?? 0) + (flow.trigger?.list_ids?.length ?? 0);
            return (
              <ListRow key={flow.id} active={activeId === flow.id} onClick={() => { setSelectedId(flow.id); setSheetOpen(true); }}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${flow.enabled ? 'bg-[#28A745]' : 'bg-slate-300'}`} />
                  <span className="truncate text-[13px] font-semibold text-[#0F172A]">{flow.name}</span>
                  <Badge>P{flow.priority}</Badge>
                </div>
                <p className="mt-0.5 pl-4 text-[11px] text-[#94A3B8]">
                  {triggers ? `${triggers} trigger${triggers > 1 ? 's' : ''}` : 'No trigger'} · {(flow.skill_keys ?? []).length} skills
                </p>
              </ListRow>
            );
          })}
          {flows.length === 0 && <p className="px-2 py-4 text-sm leading-snug text-[#94A3B8]">No flows yet. A flow gives chats from a specific ad or list their own script. Without one, the AI uses its normal behaviour. Ask HeySasa can write your first one.</p>}
        </div>
      </div>

      {isMobile ? (
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={selected?.name || 'New flow'} tall>
          {editor}
        </BottomSheet>
      ) : (
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/70 p-4 shadow-lg shadow-[#28A745]/5">
          {editor}
        </div>
      )}
    </div>
  );
}
