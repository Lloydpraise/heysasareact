import { useEffect, useState } from 'react';
import { Check, Loader2, Pin, PinOff, Plus, Sparkles, Trash2 } from 'lucide-react';
import { GlassCard } from '../shared/ui';
import { useAuth } from '../../../context/useAuth';
import { addNote, deleteNote, getPreferences, listNotes, listSkills, savePreferences, updateNote } from '../../../services/assistantService';

const LANGUAGES = [['auto', 'Match my customers'], ['english', 'English'], ['swahili', 'Swahili'], ['mixed', 'English + Swahili mix']];
const EMOJI = [['none', 'No emojis'], ['light', 'A little'], ['normal', 'Natural']];
const LENGTHS = [['short', 'Short'], ['medium', 'A bit fuller']];

function Choice({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([id, label]) => (
        <button
          key={id} type="button" onClick={() => onChange(id)}
          className={`min-h-[40px] rounded-full border px-3.5 text-sm transition ${value === id ? 'border-[#28A745] bg-[#28A745] font-semibold text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#28A745]/50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Preferences for Ask HeySasa: how it should write for this business, what it can do (names only), and what it remembers.
export function AssistantSection() {
  const { activeBusinessId: businessId } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [savedPrefs, setSavedPrefs] = useState(null);
  const [skills, setSkills] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, sk, n] = await Promise.all([getPreferences(businessId), listSkills(businessId), listNotes(businessId)]);
        if (cancelled) return;
        setPrefs(p); setSavedPrefs(p); setSkills(sk); setNotes(n); setError('');
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load Ask HeySasa settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId, reloadKey]);

  const dirty = prefs && savedPrefs && JSON.stringify(prefs) !== JSON.stringify(savedPrefs);
  const set = (field) => (value) => setPrefs((p) => ({ ...p, [field]: value }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      const saved = await savePreferences(businessId, {
        personalization: prefs.personalization || '', language: prefs.language, emoji_level: prefs.emoji_level, message_length: prefs.message_length,
      });
      setPrefs(saved); setSavedPrefs(saved); setJustSaved(true); setTimeout(() => setJustSaved(false), 2000);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const run = async (action) => { setError(''); try { await action(); setNotes(await listNotes(businessId)); } catch (e) { setError(e.message); } };

  if (loading && !prefs) return <div className="w-full rounded-2xl bg-white/60 p-8 text-center text-sm text-slate-500">Loading…</div>;
  if (!prefs) {
    return (
      <GlassCard className="w-full text-center">
        <p className="mb-3 text-sm text-slate-600">{error || 'Could not load Ask HeySasa settings.'}</p>
        <button onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Try again</button>
      </GlassCard>
    );
  }

  return (
    <div className="w-full space-y-4">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <GlassCard>
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><Sparkles size={16} className="text-[#28A745]" /> How Ask HeySasa writes for you</h3>
        <div className="mt-4 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Language for customer messages</p>
            <Choice options={LANGUAGES} value={prefs.language} onChange={set('language')} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Emojis</p>
            <Choice options={EMOJI} value={prefs.emoji_level} onChange={set('emoji_level')} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Message length</p>
            <Choice options={LENGTHS} value={prefs.message_length} onChange={set('message_length')} />
          </div>
          <div>
            <label htmlFor="ask-personalization" className="mb-1 block text-sm font-medium text-slate-700">Anything else it should always keep in mind</label>
            <textarea
              id="ask-personalization" rows={4} maxLength={1500} value={prefs.personalization || ''}
              onChange={(e) => set('personalization')(e.target.value)}
              placeholder="For example: we never discount in the first message. Always mention free delivery in Nairobi."
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#28A745]"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">{(prefs.personalization || '').length}/1500</p>
          </div>
          <button
            type="button" onClick={save} disabled={!dirty || saving}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#28A745] px-5 text-sm font-semibold text-white transition hover:bg-[#1f8d3d] disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : justSaved ? <Check size={15} /> : null}
            {justSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-base font-bold text-slate-900">What it can do</h3>
        <p className="mt-1 text-sm text-slate-500">These skills are managed by HeySasa. It picks the right one for the job.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => <span key={s.key} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{s.title}</span>)}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-base font-bold text-slate-900">What it remembers about your business</h3>
        <p className="mt-1 text-sm text-slate-500">Saved from your chats so you do not repeat yourself. Pinned notes are always known. Edit or remove anything.</p>
        <div className="mt-3 flex gap-2">
          <input
            value={newNote} onChange={(e) => setNewNote(e.target.value)} maxLength={400}
            placeholder="Add something it should remember"
            className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#28A745]"
          />
          <button
            type="button" disabled={newNote.trim().length < 3}
            onClick={() => run(async () => { await addNote(businessId, newNote.trim()); setNewNote(''); })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white disabled:opacity-40" aria-label="Add note"
          ><Plus size={18} /></button>
        </div>
        <ul className="mt-3 space-y-2">
          {notes.length === 0 && <li className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Nothing yet. As you chat with Ask HeySasa, it will note down the important things.</li>}
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <p className="min-w-0 flex-1 text-sm text-slate-800">{n.text}</p>
              <button type="button" title={n.pinned ? 'Unpin' : 'Pin: always known'} aria-label={n.pinned ? 'Unpin note' : 'Pin note'}
                onClick={() => run(() => updateNote(businessId, n.id, { pinned: !n.pinned }))}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.pinned ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'text-slate-400 hover:bg-slate-100'}`}>
                {n.pinned ? <Pin size={15} /> : <PinOff size={15} />}
              </button>
              <button type="button" aria-label="Delete note" onClick={() => run(() => deleteNote(businessId, n.id))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
