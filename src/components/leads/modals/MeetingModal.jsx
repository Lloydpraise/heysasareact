import { useMemo, useState } from 'react';
import { BellRing, CalendarClock, LoaderCircle, Pencil, X } from 'lucide-react';
import { getLeadDisplayName } from '../../../utils/leadHelpers';
import { defaultReminderMessage, MEETING_REMINDER_PLAN, scheduleMeeting } from '../../../services/leadWorkspaceService';

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const nowMs = () => Date.now();

function defaultStart() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toLocalInput(date);
}

const KINDS = [
  { id: 'call', label: 'Phone call' },
  { id: 'video', label: 'Video call' },
  { id: 'in_person', label: 'In person' },
];

// Books a meeting and sets the lead on an automatic WhatsApp reminder sequence (a day before, two hours before,
// thirty minutes before). The no-show nudge is held back and only goes out if you mark them a no-show.
export default function MeetingModal(props) {
  if (!props.open || !props.lead) return null;
  return <MeetingModalBody key={props.lead.id} {...props} />;
}

function MeetingModalBody({ lead, businessId, onClose, onSaved }) {
  const name = getLeadDisplayName(lead.name, lead.phone, lead);
  const [openedAt] = useState(() => Date.now());
  const [title, setTitle] = useState(`Call with ${name.split(/\s+/)[0] || 'lead'}`);
  const [kind, setKind] = useState('call');
  const [startsAt, setStartsAt] = useState(() => defaultStart());
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [enabled, setEnabled] = useState(() => Object.fromEntries(MEETING_REMINDER_PLAN.map((item) => [item.key, item.defaultOn])));
  const [messages, setMessages] = useState({});
  const [editing, setEditing] = useState(null);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startDate = useMemo(() => new Date(startsAt), [startsAt]);
  const valid = !Number.isNaN(startDate.getTime());

  // Reminder wording follows the details until the user edits that message by hand.
  const wording = useMemo(() => Object.fromEntries(MEETING_REMINDER_PLAN.map((item) => {
    const generated = valid ? defaultReminderMessage(item.key, { name, title, startsAt: startDate, kind, location }) : '';
    return [item.key, touched[item.key] ? messages[item.key] : generated];
  })), [valid, name, title, startDate, kind, location, touched, messages]);

  const plan = MEETING_REMINDER_PLAN.map((item) => {
    const sendAt = valid ? new Date(startDate.getTime() + (item.afterEnd ? (Number(duration) || 30) * 60000 : 0) + item.offsetMinutes * 60000) : null;
    const past = !item.afterEnd && sendAt && sendAt.getTime() <= openedAt + 60000;
    return { ...item, sendAt, past };
  });

  const handleSave = async () => {
    if (!valid) { setError('Pick a date and time.'); return; }
    if (startDate.getTime() <= nowMs()) { setError('Pick a time in the future.'); return; }
    if (!title.trim()) { setError('Give the meeting a title.'); return; }
    setSaving(true);
    setError('');
    try {
      const reminders = plan
        .filter((item) => enabled[item.key] && !item.past && wording[item.key]?.trim())
        .map((item) => ({
          key: item.key,
          offset_minutes: item.afterEnd ? item.offsetMinutes : item.offsetMinutes,
          message: wording[item.key].trim(),
        }));
      await scheduleMeeting({
        businessId,
        leadId: lead.id,
        title: title.trim(),
        startsAt: startDate,
        durationMinutes: duration,
        kind,
        location,
        notes,
        reminders,
      });
      onSaved?.({ reminders: reminders.length });
    } catch (saveError) {
      setError(saveError.message || 'Could not book this meeting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-overlay fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-8 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sheet-panel w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="meeting-modal-title">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]"><CalendarClock size={18} /></div>
            <div>
              <div id="meeting-modal-title" className="text-[16px] font-bold text-slate-900">Book a meeting</div>
              <div className="text-[12px] text-slate-500">{name}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></Field>

          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((item) => (
              <button key={item.id} type="button" onClick={() => setKind(item.id)} aria-pressed={kind === item.id} className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${kind === item.id ? 'border-[#28A745] bg-[#28A745] text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
            <Field label="When"><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={inputClass} /></Field>
            <Field label="Minutes"><input type="number" min="5" step="5" value={duration} onChange={(event) => setDuration(event.target.value)} className={inputClass} /></Field>
          </div>

          {kind !== 'call' && (
            <Field label={kind === 'video' ? 'Meeting link' : 'Where'}>
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder={kind === 'video' ? 'Paste the link' : 'Address or landmark'} className={inputClass} />
            </Field>
          )}
          <Field label="Notes (only you see these)"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className={`${inputClass} resize-y`} /></Field>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400"><BellRing size={12} /> WhatsApp reminders to {name.split(/\s+/)[0] || 'them'}</div>
            <ul className="flex flex-col gap-1.5">
              {plan.map((item) => (
                <li key={item.key} className={`rounded-lg border px-3 py-2 ${enabled[item.key] && !item.past ? 'border-[#28A745]/30 bg-[#F7FBF9]' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex min-w-0 cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={Boolean(enabled[item.key]) && !item.past} disabled={item.past} onChange={(event) => setEnabled((current) => ({ ...current, [item.key]: event.target.checked }))} className="h-4 w-4 accent-[#28A745]" />
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-semibold text-slate-700">{item.label}</span>
                        <span className="block text-[11px] text-slate-400">
                          {item.past ? 'Too late to send, it will be skipped' : item.afterEnd ? 'Sent only if you mark the meeting a no-show' : item.sendAt ? `Goes out ${item.sendAt.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                      </span>
                    </label>
                    {!item.past && enabled[item.key] && (
                      <button type="button" onClick={() => setEditing(editing === item.key ? null : item.key)} className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[11px] font-semibold text-slate-400 hover:bg-white hover:text-slate-700"><Pencil size={11} /> {editing === item.key ? 'Done' : 'Edit'}</button>
                    )}
                  </div>
                  {editing === item.key && (
                    <textarea
                      value={wording[item.key] || ''}
                      onChange={(event) => { setTouched((current) => ({ ...current, [item.key]: true })); setMessages((current) => ({ ...current, [item.key]: event.target.value })); }}
                      rows={3}
                      className={`${inputClass} mt-2 resize-y`}
                    />
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Reminders go from your connected WhatsApp number, only to a lead who has a chat with you, and are paced like your other messages.</p>
          </div>

          {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-[#28A745] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#1e7a35] disabled:opacity-60">
            {saving && <LoaderCircle size={13} className="animate-spin" />} Book meeting
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}
