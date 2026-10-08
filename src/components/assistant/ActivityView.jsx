import { useEffect, useState } from 'react';
import { Bot, BookMarked, Check, Loader2, Lock, Megaphone, MessageSquareText, Package, RotateCcw, Search, SlidersHorizontal, Sparkles, Users, ListChecks, X } from 'lucide-react';
import { fetchActionPrefs, fetchActivity, setActionPref, undoAction } from '../../services/assistantService';

// What Ask HeySasa has done over time: end results only, not the steps. Separate from the chat history.
const AREAS = [
  { id: '', label: 'Everything' }, { id: 'lists', label: 'Lists' }, { id: 'campaigns', label: 'Campaigns' }, { id: 'followups', label: 'Follow-ups' },
  { id: 'leads', label: 'Leads' }, { id: 'settings', label: 'Settings' }, { id: 'chat_ai', label: 'Chat AI' }, { id: 'products', label: 'Products' },
];
const ICON = { lists: ListChecks, campaigns: Megaphone, followups: MessageSquareText, leads: Users, settings: SlidersHorizontal, chat_ai: Bot, products: Package, memory: BookMarked, analysis: Search };

const dayLabel = (iso) => {
  const d = new Date(iso); const today = new Date(); const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
};
const clock = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const STATUS = {
  done: null,
  undone: { text: 'Undone', tone: 'bg-slate-100 text-slate-500' },
  failed: { text: "Didn't work", tone: 'bg-red-100 text-red-700' },
  rejected: { text: 'You said no', tone: 'bg-slate-100 text-slate-500' },
};

function ActivityList({ businessId }) {
  const [area, setArea] = useState('');
  const [rows, setRows] = useState(null);
  const [next, setNext] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  // First page, and again whenever the filter changes.
  useEffect(() => {
    let cancelled = false;
    fetchActivity(businessId, { area }).then((data) => {
      if (cancelled) return;
      setRows(data.activity); setNext(data.activity.length >= 30 ? data.next_before : null); setError('');
    }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [businessId, area]);

  const changeArea = (id) => { setRows(null); setNext(null); setArea(id); };

  const showOlder = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchActivity(businessId, { area, before: next });
      setRows((prev) => [...(prev ?? []), ...data.activity]);
      setNext(data.activity.length >= 30 ? data.next_before : null);
    } catch (e) { setError(e.message); } finally { setLoadingMore(false); }
  };

  const undo = async (row) => {
    setBusyId(row.id); setError('');
    try {
      const updated = await undoAction(businessId, row.id);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r)));
    } catch (e) { setError(e.message); } finally { setBusyId(''); }
  };

  const groups = [];
  for (const r of rows ?? []) {
    const label = dayLabel(r.created_at);
    if (groups.at(-1)?.label === label) groups.at(-1).items.push(r); else groups.push({ label, items: [r] });
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-3">
        {AREAS.map((a) => (
          <button key={a.id || 'all'} type="button" onClick={() => changeArea(a.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${area === a.id ? 'border-[#28A745] bg-[#28A745] text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{a.label}</button>
        ))}
      </div>
      <div className="m-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {!rows && !error && <p className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 size={15} className="animate-spin" /> Loading…</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {rows?.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Nothing here yet. When I make lists, start campaigns or change settings for you, it will show up here.</p>
        )}
        {groups.map((g) => (
          <section key={g.label}>
            <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.label}</h3>
            <ul className="space-y-2">
              {g.items.map((r) => {
                const Icon = ICON[r.area] || Sparkles;
                const badge = STATUS[r.status];
                return (
                  <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-[#28A745]/10 text-[#1f8d3d]'}`}><Icon size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-800">{r.status === 'done' ? (r.summary || r.title) : r.title}</p>
                        {r.status !== 'done' && r.summary && <p className="mt-0.5 text-[12px] text-slate-500">{r.summary}</p>}
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                          <span>{clock(r.created_at)}</span>
                          <span>{r.approval === 'always_allow' ? 'Done without asking' : r.approval === 'owner' ? 'You approved' : r.area === 'memory' ? 'Remembered by me' : ''}</span>
                          {badge && <span className={`rounded-full px-2 py-0.5 font-semibold ${badge.tone}`}>{badge.text}</span>}
                        </p>
                      </div>
                      {r.status === 'done' && r.undoable && (
                        <button type="button" disabled={busyId === r.id} onClick={() => undo(r)} className="flex min-h-[36px] shrink-0 items-center gap-1 rounded-full border border-slate-200 px-2.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                          {busyId === r.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Undo
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {next && <button type="button" disabled={loadingMore} onClick={showOlder} className="w-full rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600">{loadingMore ? 'Loading…' : 'Show older'}</button>}
      </div>
    </>
  );
}

function AllowedList({ businessId }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { fetchActionPrefs(businessId).then(setItems).catch((e) => setError(e.message)); }, [businessId]);

  const toggle = async (item) => {
    const on = !item.always_allow;
    setItems((prev) => prev.map((x) => (x.type === item.type ? { ...x, always_allow: on } : x)));
    try { await setActionPref(businessId, item.type, on); } catch (e) {
      setError(e.message);
      setItems((prev) => prev.map((x) => (x.type === item.type ? { ...x, always_allow: !on } : x)));
    }
  };

  const normal = (items ?? []).filter((i) => !i.critical);
  const critical = (items ?? []).filter((i) => i.critical);
  return (
    <div className="m-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
      <p className="rounded-2xl border border-slate-200 bg-white p-3 text-[13px] text-slate-600">Right now I ask before every change. Switch a kind of change on here and I will just do it, and you will still see it in your Activity.</p>
      {!items && !error && <p className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 size={15} className="animate-spin" /> Loading…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {normal.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">I can do these without asking</h3>
          <ul className="space-y-2">
            {normal.map((i) => (
              <li key={i.type} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="min-w-0"><p className="text-[13px] font-medium text-slate-800">{i.label}</p><p className="text-[11px] text-slate-400">{i.area_label}</p></div>
                <button type="button" role="switch" aria-checked={i.always_allow} aria-label={`Allow without asking: ${i.label}`} onClick={() => toggle(i)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${i.always_allow ? 'bg-[#28A745]' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-all ${i.always_allow ? 'left-[22px]' : 'left-0.5'}`}>{i.always_allow ? <Check size={13} className="text-[#28A745]" /> : <X size={12} className="text-slate-400" />}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {critical.length > 0 && (
        <section>
          <h3 className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400"><Lock size={11} /> I always ask first</h3>
          <p className="mb-1.5 text-[12px] text-slate-500">These message your customers, spend your balance or change how your AI talks, so they can never be switched to automatic.</p>
          <ul className="space-y-1.5">
            {critical.map((i) => <li key={i.type} className="rounded-xl bg-slate-100 px-3 py-2 text-[12.5px] text-slate-600">{i.label}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function ActivityView({ businessId }) {
  const [tab, setTab] = useState('log');
  return (
    <>
      <div className="flex shrink-0 gap-1 border-b border-slate-200 bg-white px-3 pb-2 pt-1">
        {[['log', 'What I did'], ['allowed', 'Allowed without asking']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{label}</button>
        ))}
      </div>
      {tab === 'log' ? <ActivityList businessId={businessId} /> : <AllowedList businessId={businessId} />}
    </>
  );
}
