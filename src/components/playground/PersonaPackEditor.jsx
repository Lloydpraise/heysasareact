import { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';

const SENTIMENT_KEYS = ['positive', 'neutral', 'hesitant', 'price_resistant', 'time_poor', 'trust_deficit', 'negative', 'aggressive'];

const TABS = [
  { id: 'persona', label: 'Voice & Tone' },
  { id: 'business_context', label: 'Business Facts' },
  { id: 'objection_playbook', label: 'Objections' },
  { id: 'customer_profiles', label: 'Customer Profiles' },
  { id: 'sentiment_response_map', label: 'Sentiment' },
  { id: 'handoff_closing', label: 'Handoff & Closing' },
];

function TagList({ label, values = [], onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (draft.trim()) {
      onChange([...values, draft.trim()]);
      setDraft('');
    }
  };
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-[#0F172A]">{label}</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#28A745]/10 px-3 py-1 text-sm text-[#1f8d3d]">
            {v}
            <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="hover:text-red-600">
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#28A745]/30"
        />
        <button onClick={add} className="rounded-xl bg-[#28A745] px-3 py-1.5 text-sm text-white hover:bg-[#1f8d3d]">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, textarea, hint }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-[#0F172A]">{label}</label>
      <Comp
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={textarea ? 3 : undefined}
        className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#28A745]/30"
      />
      {hint && <p className="mt-1 text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
}

function Slider({ label, value, onChange, min = 1, max = 10 }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-[#0F172A]">
        {label}: <span className="font-semibold text-[#28A745]">{value}</span>
      </label>
      <input type="range" min={min} max={max} value={value ?? min} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#28A745]" />
    </div>
  );
}

function PersonaSection({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const mix = data.language_mix || { english: 0.7, swahili: 0.3, sheng: 0 };
  const mixSum = Math.round((mix.english + mix.swahili + mix.sheng) * 100);

  return (
    <div>
      <TextField label="Display name" value={data.display_name} onChange={(v) => set('display_name', v)} />
      <TextField label="Voice tone (a short description)" value={data.voice_tone} onChange={(v) => set('voice_tone', v)} />
      <Slider label="Formality" value={data.formality_score} onChange={(v) => set('formality_score', v)} />

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-[#0F172A]">
          Language mix — sums to 100% <span className={mixSum === 100 ? 'text-[#28A745]' : 'text-[#FF8C00]'}>({mixSum}%)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['english', 'swahili', 'sheng'].map((k) => (
            <div key={k}>
              <span className="text-xs capitalize text-[#64748B]">{k}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(mix[k] * 100)}
                onChange={(e) => set('language_mix', { ...mix, [k]: Number(e.target.value) / 100 })}
                className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Typical greeting" value={data.typical_greeting} onChange={(v) => set('typical_greeting', v)} />
        <TextField label="Typical closing" value={data.typical_closing} onChange={(v) => set('typical_closing', v)} />
      </div>

      <TextField label="Emoji style" value={data.emoji_style} onChange={(v) => set('emoji_style', v)} hint="e.g. 'one relevant emoji per message' or 'none'" />
      <TextField label="Sentence length" value={data.sentence_length} onChange={(v) => set('sentence_length', v)} hint="e.g. 'short, punchy' or 'mixed, matches context'" />

      <TagList label="Signature phrases (things they actually say)" values={data.signature_phrases || []} onChange={(v) => set('signature_phrases', v)} placeholder="Add a phrase and press Enter" />
      <TagList label="Phrases to avoid" values={data.phrases_to_avoid || []} onChange={(v) => set('phrases_to_avoid', v)} placeholder="Add a banned phrase" />
      <TagList label="Tone descriptors" values={data.tone_descriptors || []} onChange={(v) => set('tone_descriptors', v)} placeholder="e.g. warm, direct, playful" />
    </div>
  );
}

function BusinessContextSection({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div>
      <TextField label="Core offer" value={data.core_offer} onChange={(v) => set('core_offer', v)} textarea />
      <TextField label="Target customer" value={data.target_customer} onChange={(v) => set('target_customer', v)} textarea />
      <TextField label="Delivery info" value={data.delivery_info} onChange={(v) => set('delivery_info', v)} textarea />
      <TagList label="Unique selling points" values={data.unique_selling_points || []} onChange={(v) => set('unique_selling_points', v)} placeholder="What makes you different" />
      <TagList label="Payment methods" values={data.payment_methods || []} onChange={(v) => set('payment_methods', v)} placeholder="e.g. M-Pesa, Cash on Delivery" />
    </div>
  );
}

function RepeatableCards({ items = [], onChange, fields, addLabel, renderTitle }) {
  const update = (i, key, val) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, f.list ? [] : '']))]);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="relative rounded-2xl border border-slate-200/80 bg-white/80 p-4">
          <button onClick={() => remove(i)} className="absolute right-3 top-3 text-slate-300 hover:text-red-600">
            <X size={16} />
          </button>
          <div className="mb-2 pr-6 text-sm font-semibold text-[#1f8d3d]">{renderTitle(item) || `Entry ${i + 1}`}</div>
          {fields.map((f) =>
            f.list ? (
              <TagList key={f.key} label={f.label} values={item[f.key] || []} onChange={(v) => update(i, f.key, v)} placeholder={f.placeholder} />
            ) : (
              <TextField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => update(i, f.key, v)} textarea={f.textarea} />
            ),
          )}
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-sm font-medium text-[#28A745] hover:underline">
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

function SentimentSection({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div>
      {SENTIMENT_KEYS.map((k) => (
        <TextField key={k} label={k.replace(/_/g, ' ')} value={data[k]} onChange={(v) => set(k, v)} textarea hint="How should the bot respond when it detects this?" />
      ))}
    </div>
  );
}

export function PersonaPackEditor({ personaPack, showToast }) {
  const { pack, version, updateField, saveSection, isSaving } = personaPack;
  const [activeTab, setActiveTab] = useState('persona');
  const [dirtyTabs, setDirtyTabs] = useState(new Set());

  if (!pack) return null;

  const set = (key, val) => {
    updateField(key, val);
    setDirtyTabs((prev) => new Set(prev).add(activeTab));
  };

  const handleSave = async () => {
    const keys = activeTab === 'handoff_closing' ? ['closing_triggers', 'human_handoff_triggers'] : [activeTab];
    const ok = await saveSection(keys);
    if (ok) {
      setDirtyTabs((prev) => {
        const next = new Set(prev);
        next.delete(activeTab);
        return next;
      });
      const tabLabel = TABS.find((t) => t.id === activeTab)?.label ?? 'Persona pack';
      showToast(`${tabLabel} saved.`);
    } else {
      showToast('Could not save that section.', 'error');
    }
  };

  const isDirty = dirtyTabs.has(activeTab);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[1.25rem] border border-white/80 bg-white/70 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl">
      <div className="flex min-w-0 items-center justify-between px-4 pt-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex w-max gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === t.id ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {t.label}
              {dirtyTabs.has(t.id) && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#FF8C00]" />}
            </button>
          ))}
          </div>
        </div>
        <span className="shrink-0 whitespace-nowrap pl-3 text-xs text-[#94A3B8]">v{version}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === 'persona' && <PersonaSection data={pack.persona || {}} onChange={(v) => set('persona', v)} />}
        {activeTab === 'business_context' && <BusinessContextSection data={pack.business_context || {}} onChange={(v) => set('business_context', v)} />}
        {activeTab === 'objection_playbook' && (
          <RepeatableCards
            items={pack.objection_playbook || []}
            onChange={(v) => set('objection_playbook', v)}
            addLabel="Add objection"
            renderTitle={(item) => item.objection}
            fields={[
              { key: 'objection', label: 'Objection (what the customer says)' },
              { key: 'response_strategy', label: 'Response strategy' },
              { key: 'suggested_language', label: 'Suggested language', textarea: true },
              { key: 'escalation_if_repeated', label: 'If they say it again' },
            ]}
          />
        )}
        {activeTab === 'customer_profiles' && (
          <RepeatableCards
            items={pack.customer_profiles || []}
            onChange={(v) => set('customer_profiles', v)}
            addLabel="Add customer profile"
            renderTitle={(item) => item.profile_name}
            fields={[
              { key: 'profile_name', label: 'Profile name' },
              { key: 'detection_signals', label: 'How to recognize them', list: true, placeholder: 'A signal phrase or behavior' },
              { key: 'approach_strategy', label: 'Approach strategy', textarea: true },
              { key: 'message_style_adjustment', label: 'Message style adjustment' },
              { key: 'cta_style', label: 'Call-to-action style' },
              { key: 'what_to_avoid', label: 'What to avoid with them' },
            ]}
          />
        )}
        {activeTab === 'sentiment_response_map' && <SentimentSection data={pack.sentiment_response_map || {}} onChange={(v) => set('sentiment_response_map', v)} />}
        {activeTab === 'handoff_closing' && (
          <div>
            <TagList label="Closing triggers" values={pack.closing_triggers || []} onChange={(v) => set('closing_triggers', v)} placeholder="A signal the customer's ready to buy" />
            <TagList label="Human handoff triggers" values={pack.human_handoff_triggers || []} onChange={(v) => set('human_handoff_triggers', v)} placeholder="A signal to bring in a human" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 px-4 py-3">
        <button
          disabled={!isDirty || isSaving}
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={14} /> {isSaving ? 'Saving…' : 'Save this section'}
        </button>
      </div>
    </div>
  );
}