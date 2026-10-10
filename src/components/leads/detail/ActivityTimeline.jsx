import { useMemo, useState } from 'react';
import {
  Bot, CalendarClock, CheckSquare, Flag, History, ListChecks, LoaderCircle, Megaphone, MessageCircle,
  Phone, Reply, ScanSearch, Send, ShoppingBag, StickyNote, TriangleAlert, UserPlus, BellRing,
} from 'lucide-react';
import { formatDate, timeAgo } from '../../../utils/leadHelpers';

const TYPE_STYLE = {
  came_in: { Icon: UserPlus, tone: 'bg-blue-50 text-blue-600' },
  message: { Icon: MessageCircle, tone: 'bg-slate-100 text-slate-600' },
  analysed: { Icon: ScanSearch, tone: 'bg-violet-50 text-violet-600' },
  bought: { Icon: ShoppingBag, tone: 'bg-[#28A745]/10 text-[#218c3a]' },
  list: { Icon: ListChecks, tone: 'bg-slate-100 text-slate-600' },
  campaign: { Icon: Megaphone, tone: 'bg-[#28A745]/10 text-[#218c3a]' },
  followup: { Icon: Send, tone: 'bg-[#28A745]/10 text-[#218c3a]' },
  followup_failed: { Icon: TriangleAlert, tone: 'bg-red-50 text-red-600' },
  reply: { Icon: Reply, tone: 'bg-[#28A745]/10 text-[#218c3a]' },
  ai: { Icon: Bot, tone: 'bg-violet-50 text-violet-600' },
  call: { Icon: Phone, tone: 'bg-[#FF8C00]/10 text-[#c26a00]' },
  task: { Icon: CheckSquare, tone: 'bg-slate-100 text-slate-600' },
  reminder: { Icon: BellRing, tone: 'bg-[#FF8C00]/10 text-[#c26a00]' },
  meeting: { Icon: CalendarClock, tone: 'bg-blue-50 text-blue-600' },
  note: { Icon: StickyNote, tone: 'bg-yellow-50 text-yellow-700' },
  other: { Icon: Flag, tone: 'bg-slate-100 text-slate-600' },
};

const FILTERS = [
  { id: 'all', label: 'All', types: null },
  { id: 'calls', label: 'Calls', types: ['call'] },
  { id: 'messages', label: 'Messages', types: ['message', 'reply'] },
  { id: 'followups', label: 'Follow-ups', types: ['followup', 'followup_failed', 'campaign', 'list'] },
  { id: 'ai', label: 'Chat AI', types: ['ai'] },
  { id: 'plans', label: 'Tasks & meetings', types: ['task', 'reminder', 'meeting', 'note'] },
];

// Everything that has happened with this lead, newest first: when they came in, when they were analysed,
// every follow-up and campaign step, chat-AI replies, calls, tasks, meetings and notes.
export default function ActivityTimeline({ events, loading, problems = [], onAddNote }) {
  const [filter, setFilter] = useState('all');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((item) => [item.id, item.types ? events.filter((event) => item.types.includes(event.type)).length : events.length])), [events]);
  const visible = useMemo(() => {
    const active = FILTERS.find((item) => item.id === filter);
    return active?.types ? events.filter((event) => active.types.includes(event.type)) : events;
  }, [events, filter]);

  const saveNote = async () => {
    if (!note.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await onAddNote(note);
      setNote('');
    } catch (noteError) {
      setError(noteError.message || 'Could not save the note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-4 my-3 mb-8 rounded-xl border border-slate-200 bg-white md:mx-6" aria-label="Activity">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500"><History size={13} className="text-[#28A745]" /> Activity</h3>
        <div className="flex max-w-full gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition ${filter === item.id ? 'bg-[#28A745] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {item.label}{counts[item.id] ? ` ${counts[item.id]}` : ''}
            </button>
          ))}
        </div>
      </header>

      {onAddNote && (
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && saveNote()}
            placeholder="Add a note about this lead..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none"
          />
          <button type="button" onClick={saveNote} disabled={!note.trim() || saving} className="flex shrink-0 items-center gap-1 rounded-lg border border-[#28A745]/30 px-2.5 py-1.5 text-[11.5px] font-semibold text-[#218c3a] hover:bg-[#28A745]/5 disabled:opacity-40">
            {saving ? <LoaderCircle size={12} className="animate-spin" /> : <StickyNote size={12} />} Save
          </button>
        </div>
      )}
      {error && <p className="px-4 pt-2 text-[11.5px] font-medium text-red-600">{error}</p>}

      {problems.length > 0 && (
        <p className="mx-4 mt-3 rounded-lg bg-[#FFF7ED] px-3 py-2 text-[11.5px] leading-relaxed text-[#c26a00]">
          Some activity could not be loaded ({problems.map((problem) => problem.source).join(', ')}). What you see may be incomplete.
        </p>
      )}

      <div className="px-4 py-3">
        {loading && events.length === 0 ? (
          <p className="flex items-center gap-2 py-6 text-[12px] text-slate-400"><LoaderCircle size={14} className="animate-spin" /> Loading activity...</p>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-slate-400">Nothing here yet.</p>
        ) : (
          <ol className="relative flex flex-col">
            {visible.map((event, index) => {
              const style = TYPE_STYLE[event.type] || TYPE_STYLE.other;
              const Icon = style.Icon;
              return (
                <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < visible.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-slate-200" aria-hidden="true" />}
                  <span className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.tone}`}><Icon size={13} /></span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-[12.5px] font-semibold text-slate-800">{event.title}</p>
                      <p className="shrink-0 text-[10.5px] text-slate-400" title={formatDate(event.at, { withTime: true })}>
                        {formatDate(event.at, { withTime: true })} <span className="text-slate-300">·</span> {timeAgo(event.at) === 'now' ? 'just now' : `${timeAgo(event.at)} ago`}
                      </p>
                    </div>
                    {event.detail && <p className="mt-0.5 whitespace-pre-line text-[12px] leading-relaxed text-slate-500">{event.detail}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
