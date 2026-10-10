import { useMemo, useRef, useState } from 'react';
import {
  BellRing, CalendarClock, CheckSquare, ListOrdered, LoaderCircle, Megaphone, Phone, PhoneCall, ShoppingBag, X,
} from 'lucide-react';
import { formatInterest, getLeadDisplayName, getPhoneDisplay } from '../../../utils/leadHelpers';
import { CALL_OUTCOMES, createTask, logCall } from '../../../services/leadWorkspaceService';

const NEXT_STEPS = [
  { id: 'put_on_sequence', label: 'Put on sequence', Icon: ListOrdered },
  { id: 'set_task', label: 'Set task', Icon: CheckSquare },
  { id: 'set_reminder', label: 'Set reminder', Icon: BellRing },
  { id: 'schedule_meeting', label: 'Book meeting', Icon: CalendarClock },
  { id: 'add_to_campaign', label: 'Add to campaign', Icon: Megaphone },
  { id: 'bought', label: 'Bought', Icon: ShoppingBag },
];

const OUTCOME_TONE = {
  good: 'border-[#28A745] bg-[#28A745] text-white',
  warn: 'border-[#FF8C00] bg-[#FF8C00] text-white',
  bad: 'border-red-500 bg-red-500 text-white',
  default: 'border-slate-700 bg-slate-700 text-white',
};

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function tomorrowAt(hour) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return toLocalInput(date);
}

// Click the call button: "Call now" gives you the number and a short brief; "Log call" records how it went and
// what happens next, so a phone call can be closed out in a few taps.
export default function CallModal(props) {
  if (!props.open || !props.lead) return null;
  return <CallModalBody key={props.lead.id} {...props} />;
}

function CallModalBody({ lead, businessId, onClose, onSaved, onEditLead }) {
  const name = getLeadDisplayName(lead.name, lead.phone, lead);
  const first = name.split(/\s+/)[0] || 'them';
  const [tab, setTab] = useState('now');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [minutes, setMinutes] = useState('');
  const [steps, setSteps] = useState([]);
  const [taskTitle, setTaskTitle] = useState(`Follow up with ${first}`);
  const [taskDue, setTaskDue] = useState(() => tomorrowAt(10));
  const [reminderTitle, setReminderTitle] = useState(`Call ${first} back`);
  const [reminderAt, setReminderAt] = useState(() => tomorrowAt(9));
  const [dialed, setDialed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialedAt = useRef(null);

  const phone = getPhoneDisplay(lead.phone);

  const products = useMemo(() => [...new Set([...(lead.product_interests || []), ...(lead.cart_state || [])])].slice(0, 6), [lead]);

  const toggleStep = (id) => setSteps((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const pickOutcome = (id) => {
    setOutcome(id);
    // Sensible defaults so the common cases are one tap.
    if (id === 'callback' && !steps.includes('set_reminder')) setSteps((current) => [...current, 'set_reminder']);
    if (id === 'interested' && !steps.includes('schedule_meeting')) setSteps((current) => [...current, 'schedule_meeting']);
  };

  const handleDial = () => {
    dialedAt.current = Date.now();
    setDialed(true);
    setTab('log');
  };

  const handleTabLog = () => setTab('log');

  const handleSave = async () => {
    if (!outcome) { setError('Pick how the call went.'); return; }
    if (steps.includes('set_task') && !taskTitle.trim()) { setError('Give the task a title.'); return; }
    if (steps.includes('set_reminder') && (!reminderTitle.trim() || !reminderAt)) { setError('Give the reminder a title and time.'); return; }
    setSaving(true);
    setError('');
    try {
      const elapsed = dialedAt.current ? Math.max(1, Math.round((Date.now() - dialedAt.current) / 60000)) : null;
      await logCall({
        businessId,
        leadId: lead.id,
        outcome,
        notes,
        durationMinutes: minutes || elapsed,
        nextSteps: steps.map((id) => NEXT_STEPS.find((step) => step.id === id)?.label || id),
      });
      if (steps.includes('set_task')) {
        await createTask({ businessId, leadId: lead.id, kind: 'task', title: taskTitle, dueAt: taskDue, source: 'call' });
      }
      if (steps.includes('set_reminder')) {
        await createTask({ businessId, leadId: lead.id, kind: 'reminder', title: reminderTitle, dueAt: reminderAt, source: 'call' });
      }
      // Anything that needs its own screen (a picker, the sale form, the meeting booking) opens next.
      onSaved?.(steps.filter((id) => ['put_on_sequence', 'add_to_campaign', 'bought', 'schedule_meeting'].includes(id)));
    } catch (saveError) {
      setError(saveError.message || 'Could not save this call.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-overlay fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-8 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sheet-panel w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="call-modal-title">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]"><Phone size={18} /></div>
            <div>
              <div id="call-modal-title" className="text-[16px] font-bold text-slate-900">Call {name}</div>
              <div className="text-[12px] text-slate-500">{phone.kind === 'valid' ? phone.text : 'No number saved yet'}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="flex gap-1 border-b border-slate-100 px-5 pt-2">
          {[{ id: 'now', label: 'Call now' }, { id: 'log', label: 'Log call' }].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.id === 'log' ? handleTabLog() : setTab('now'))}
              aria-pressed={tab === item.id}
              className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition ${tab === item.id ? 'border-[#28A745] text-[#218c3a]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'now' ? (
          <div className="space-y-4 px-5 py-5">
            {phone.kind === 'valid' ? (
              <a
                href={`tel:${lead.phone}`}
                onClick={handleDial}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] text-[15px] font-bold text-white shadow-lg shadow-[#28A745]/25 hover:bg-[#1e7a35]"
              >
                <PhoneCall size={18} /> Call {phone.text}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => { onClose(); onEditLead?.(); }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                Add a phone number first
              </button>
            )}

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-[12.5px] leading-relaxed text-slate-600">
              {lead.next_action_plan && <p><span className="font-semibold text-slate-800">Open with: </span>{lead.next_action_plan}</p>}
              {products.length > 0 && <p className="mt-1.5"><span className="font-semibold text-slate-800">They want: </span>{products.map((product) => formatInterest(String(product))).join(', ')}</p>}
              {(lead.objection_tags || []).length > 0 && <p className="mt-1.5"><span className="font-semibold text-slate-800">Watch out for: </span>{lead.objection_tags.map((tag) => formatInterest(String(tag))).join(', ')}</p>}
              {!lead.next_action_plan && products.length === 0 && (lead.objection_tags || []).length === 0 && <p>No analysis yet. The full call brief is on the lead page.</p>}
            </div>

            <p className="text-center text-[11.5px] text-slate-400">When you are done, come back and tap <span className="font-semibold text-slate-500">Log call</span>.</p>
          </div>
        ) : (
          <div className="space-y-5 px-5 py-5">
            <div>
              <Label>How did it go?</Label>
              <div className="flex flex-wrap gap-1.5">
                {CALL_OUTCOMES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pickOutcome(item.id)}
                    title={item.hint}
                    aria-pressed={outcome === item.id}
                    className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${outcome === item.id ? OUTCOME_TONE[item.tone] : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>What was said</Label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Key points, what they asked for, anything to remember..."
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11.5px] text-slate-400">Length</span>
                <input
                  type="number"
                  min="0"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                  placeholder={dialed ? 'auto' : 'min'}
                  className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12.5px] focus:border-[#28A745] focus:bg-white focus:outline-none"
                />
                <span className="text-[11.5px] text-slate-400">minutes</span>
              </div>
            </div>

            <div>
              <Label>Next step</Label>
              <div className="flex flex-wrap gap-1.5">
                {NEXT_STEPS.map(({ id, label, Icon }) => {
                  const on = steps.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleStep(id)}
                      aria-pressed={on}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${on ? 'border-[#28A745] bg-[#28A745]/10 text-[#1f8d3d] ring-2 ring-[#28A745]/20' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  );
                })}
              </div>

              {steps.includes('set_task') && (
                <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_190px]">
                  <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task" aria-label="Task title" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] focus:border-[#28A745] focus:outline-none" />
                  <input type="datetime-local" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} aria-label="Task due" className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12.5px] focus:border-[#28A745] focus:outline-none" />
                </div>
              )}
              {steps.includes('set_reminder') && (
                <div className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_190px]">
                  <input value={reminderTitle} onChange={(event) => setReminderTitle(event.target.value)} placeholder="Reminder" aria-label="Reminder" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] focus:border-[#28A745] focus:outline-none" />
                  <input type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} aria-label="Reminder time" className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12.5px] focus:border-[#28A745] focus:outline-none" />
                </div>
              )}
              {steps.some((id) => ['put_on_sequence', 'add_to_campaign', 'bought', 'schedule_meeting'].includes(id)) && (
                <p className="mt-2 text-[11.5px] text-slate-400">After you save, the next screen opens for the steps that need details.</p>
              )}
            </div>

            {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
          </div>
        )}

        {tab === 'log' && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
            <button type="button" onClick={onClose} className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-[#28A745] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#1e7a35] disabled:opacity-60">
              {saving && <LoaderCircle size={13} className="animate-spin" />} Save call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{children}</div>;
}
