import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import BottomSheet from '../mobile/BottomSheet';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { createSkill, deleteSkill, isValidKey, resetSkill, restoreMissingDefaults, saveSkill, slugifyKey } from '../../services/chatAiConfigService';
import { Badge, Field, ListRow, Switch, dangerButton, ghostButton, inputClass, primaryButton } from './ConfigShared';

const NEW = 'new';

const skillState = (skill, defaultSkill) => {
  if (!skill.source_default_key || !defaultSkill) return 'custom';
  const same = skill.title === defaultSkill.title && skill.when_to_use === defaultSkill.when_to_use && skill.instructions === defaultSkill.instructions;
  return same ? 'default' : 'edited';
};

function SkillEditor({ businessId, skill, defaultSkill, flows, onChanged, onDeleted, onCreated, showToast }) {
  const isNew = !skill;
  const [draft, setDraft] = useState({
    key: skill?.key ?? '',
    title: skill?.title ?? '',
    when_to_use: skill?.when_to_use ?? '',
    instructions: skill?.instructions ?? '',
    enabled: skill?.enabled ?? true,
  });
  const [busy, setBusy] = useState(false);
  const set = (field) => (event) => setDraft((d) => ({ ...d, [field]: event.target.value }));

  const key = isNew ? draft.key || slugifyKey(draft.title) : skill.key;
  const complete = draft.title.trim() && draft.when_to_use.trim() && draft.instructions.trim() && (!isNew || isValidKey(key));
  const dirty = isNew || ['title', 'when_to_use', 'instructions', 'enabled'].some((f) => draft[f] !== skill[f]);
  const state = isNew ? 'custom' : skillState(skill, defaultSkill);
  const usedBy = isNew ? [] : flows.filter((f) => (f.skill_keys ?? []).includes(skill.key));

  const run = async (action, done) => {
    setBusy(true);
    try {
      await action();
      done?.();
    } catch (error) {
      showToast(error.message || 'Something went wrong.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () =>
    run(async () => {
      if (isNew) {
        const created = await createSkill(businessId, { ...draft, key });
        await onCreated(created.id);
        showToast('Skill created.');
      } else {
        await saveSkill(businessId, skill.id, draft);
        await onChanged();
        showToast('Skill saved. It applies to this business only.');
      }
    });

  const handleReset = () =>
    run(async () => {
      await resetSkill(businessId, skill.key);
      await onChanged();
      showToast('Skill reset to the default.');
    });

  const handleDelete = () => {
    const warning = usedBy.length ? `\n\nIt is preloaded by: ${usedBy.map((f) => f.name).join(', ')}.` : '';
    if (!window.confirm(`Delete the "${skill.title}" skill?${warning}`)) return;
    run(async () => {
      await deleteSkill(businessId, skill.id);
      await onDeleted();
      showToast('Skill deleted.');
    });
  };

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-1 pr-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-[#0F172A]">{isNew ? 'New skill' : skill.title}</h3>
        {!isNew && <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{skill.key}</code>}
        {state === 'default' && <Badge tone="green">Default</Badge>}
        {state === 'edited' && <Badge tone="orange">Edited from default</Badge>}
        {state === 'custom' && <Badge>Custom</Badge>}
      </div>

      <Field label="Title">
        <input className={inputClass} value={draft.title} onChange={set('title')} placeholder="Price questions" />
      </Field>

      {isNew && (
        <Field label="Key" hint="Lowercase letters, numbers and underscores (2–40). Flows refer to the skill by this key. It cannot be changed later.">
          <input className={inputClass} value={draft.key || slugifyKey(draft.title)} onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value.toLowerCase() }))} />
        </Field>
      )}

      <Field label="When the AI should load it" hint="This sentence is the only part the AI sees on its menu. It decides from this when to open the skill, so describe the customer's situation.">
        <textarea className={inputClass} rows={2} value={draft.when_to_use} onChange={set('when_to_use')} />
      </Field>

      <Field label="Instructions" hint="The AI reads these only after it loads the skill (or a flow preloads it). Plain rules for how to handle this situation.">
        <textarea className={`${inputClass} font-mono text-[12.5px] leading-relaxed`} rows={9} value={draft.instructions} onChange={set('instructions')} />
      </Field>

      {usedBy.length > 0 && (
        <p className="text-[12px] text-slate-500">
          Preloaded by flow{usedBy.length > 1 ? 's' : ''}: <span className="font-semibold">{usedBy.map((f) => f.name).join(', ')}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Switch checked={draft.enabled} onChange={(enabled) => setDraft((d) => ({ ...d, enabled }))} label={draft.enabled ? 'Enabled' : 'Disabled (the AI cannot see it)'} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {state === 'edited' && (
            <button type="button" className={ghostButton} disabled={busy} onClick={handleReset}>
              <RotateCcw size={11} className="mr-1 inline" /> Reset to default
            </button>
          )}
          {!isNew && (
            <button type="button" className={dangerButton} disabled={busy} onClick={handleDelete}>
              <Trash2 size={11} className="mr-1 inline" /> Delete
            </button>
          )}
          <button type="button" className={primaryButton} disabled={busy || !dirty || !complete} onClick={handleSave}>
            {busy ? 'Saving…' : isNew ? 'Create skill' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SkillsPanel({ businessId, skills, defaults, flows, reload, showToast }) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(skills[0]?.id ?? null);
  const defaultByKey = new Map(defaults.map((d) => [d.key, d]));
  const selected = selectedId === NEW ? null : skills.find((s) => s.id === selectedId) ?? skills[0] ?? null;
  const activeId = selectedId === NEW ? NEW : selected?.id ?? NEW;
  const missingDefaults = defaults.filter((d) => !skills.some((s) => s.key === d.key));

  const handleRestore = async () => {
    try {
      const added = await restoreMissingDefaults(businessId);
      await reload();
      showToast(added ? `Restored ${added} default skill${added > 1 ? 's' : ''}.` : 'Nothing to restore.');
    } catch (error) {
      showToast(error.message || 'Could not restore the defaults.', 'error');
    }
  };

  const editor = (
        <SkillEditor
          key={`${activeId}-${selected?.updated_at ?? ''}`}
          businessId={businessId}
          skill={activeId === NEW ? null : selected}
          defaultSkill={selected ? defaultByKey.get(selected.source_default_key) : null}
          flows={flows}
          showToast={showToast}
          onChanged={reload}
          onDeleted={async () => {
            setSelectedId(null);
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
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{skills.length} skills</span>
          <button type="button" className={ghostButton} onClick={() => { setSelectedId(NEW); setSheetOpen(true); }}>
            <Plus size={11} className="mr-1 inline" /> New skill
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {skills.map((skill) => {
            const state = skillState(skill, defaultByKey.get(skill.source_default_key));
            return (
              <ListRow key={skill.id} active={activeId === skill.id} onClick={() => { setSelectedId(skill.id); setSheetOpen(true); }}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${skill.enabled ? 'bg-[#28A745]' : 'bg-slate-300'}`} />
                  <span className="truncate text-[13px] font-semibold text-[#0F172A]">{skill.title}</span>
                  {state === 'edited' && <Badge tone="orange">Edited</Badge>}
                  {state === 'custom' && <Badge>Custom</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-2 pl-4 text-[11px] leading-snug text-[#94A3B8]">{skill.when_to_use}</p>
              </ListRow>
            );
          })}
          {skills.length === 0 && <p className="px-2 py-4 text-sm text-[#94A3B8]">No skills yet. Restore the defaults or create one.</p>}
        </div>
        {missingDefaults.length > 0 && (
          <button type="button" className={ghostButton} onClick={handleRestore}>
            Restore {missingDefaults.length} missing default{missingDefaults.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {isMobile ? (
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={selected?.title || 'New skill'} tall>
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
