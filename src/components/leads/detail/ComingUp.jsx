import { useState } from 'react';
import { BellRing, CalendarClock, Check, CheckSquare, LoaderCircle, UserX } from 'lucide-react';
import { formatDate } from '../../../utils/leadHelpers';

const REMINDER_LABELS = { day_before: '1 day before', two_hours: '2 hours before', thirty_min: '30 min before', no_show: 'No-show nudge' };
const REMINDER_STATUS = {
  queued: { text: 'Scheduled', className: 'text-slate-500' },
  held: { text: 'Waiting (only if no-show)', className: 'text-slate-400' },
  sending: { text: 'Sending', className: 'text-[#FF8C00]' },
  sent: { text: 'Sent', className: 'text-[#218c3a]' },
  failed: { text: 'Not sent', className: 'text-red-600' },
  cancelled: { text: 'Cancelled', className: 'text-slate-400' },
};

// What is coming up for this lead: open tasks and reminders, and meetings with their reminder messages.
// Once a meeting's time has passed it asks "Did they show up?", which is what makes no-show follow-up work.
export default function ComingUp({ workspace, onCompleteTask, onMarkMeeting }) {
  const openTasks = workspace.tasks.filter((task) => task.status === 'open');
  const meetings = workspace.meetings.filter((meeting) => meeting.status === 'scheduled');
  const [busyId, setBusyId] = useState(null);
  if (!openTasks.length && !meetings.length) return null;

  const run = async (id, action) => {
    setBusyId(id);
    try { await action(); } finally { setBusyId(null); }
  };

  return (
    <section className="mx-4 my-3 rounded-xl border border-[#FF8C00]/25 bg-[#FFFAF3] p-4 md:mx-6" aria-label="Coming up">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#c26a00]"><CalendarClock size={13} /> Coming up</h3>
      <ul className="flex flex-col gap-2">
        {meetings.map((meeting) => {
          const started = new Date(meeting.starts_at) <= new Date();
          return (
            <li key={meeting.id} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-slate-800">{meeting.title}</p>
                  <p className="text-[11px] text-slate-500">{formatDate(meeting.starts_at, { withTime: true })}{meeting.location ? ` · ${meeting.location}` : ''}</p>
                </div>
                {started ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Did they show up?</span>
                    <button type="button" disabled={busyId === meeting.id} onClick={() => run(meeting.id, () => onMarkMeeting(meeting, 'attended'))} className="flex items-center gap-1 rounded-md bg-[#28A745] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60">
                      {busyId === meeting.id ? <LoaderCircle size={11} className="animate-spin" /> : <Check size={11} />} Yes
                    </button>
                    <button type="button" disabled={busyId === meeting.id} onClick={() => run(meeting.id, () => onMarkMeeting(meeting, 'no_show'))} className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 disabled:opacity-60">
                      <UserX size={11} /> No-show
                    </button>
                  </div>
                ) : (
                  <button type="button" disabled={busyId === meeting.id} onClick={() => run(meeting.id, () => onMarkMeeting(meeting, 'cancelled'))} className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-red-600">Cancel meeting</button>
                )}
              </div>
              {meeting.reminders.length > 0 && (
                <ul className="mt-2 flex flex-col gap-0.5 border-t border-slate-100 pt-2">
                  {meeting.reminders.map((reminder) => {
                    const status = REMINDER_STATUS[reminder.status] || REMINDER_STATUS.queued;
                    return (
                      <li key={reminder.id} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="flex min-w-0 items-center gap-1 text-slate-500"><BellRing size={10} /> <span className="truncate">{REMINDER_LABELS[reminder.key] || reminder.key}</span></span>
                        <span className={`shrink-0 font-semibold ${status.className}`} title={reminder.error || ''}>{status.text}{reminder.status === 'queued' ? ` · ${formatDate(reminder.send_at, { withTime: true })}` : ''}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}

        {openTasks.map((task) => {
          const overdue = task.due_at && new Date(task.due_at) < new Date();
          return (
            <li key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
              <div className="flex min-w-0 items-center gap-2">
                {task.kind === 'reminder' ? <BellRing size={13} className="shrink-0 text-[#FF8C00]" /> : <CheckSquare size={13} className="shrink-0 text-[#28A745]" />}
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-slate-800">{task.title}</p>
                  {task.due_at && <p className={`text-[11px] ${overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}>{overdue ? 'Overdue · ' : 'Due '}{formatDate(task.due_at, { withTime: true })}</p>}
                </div>
              </div>
              <button type="button" disabled={busyId === task.id} onClick={() => run(task.id, () => onCompleteTask(task))} className="flex shrink-0 items-center gap-1 rounded-md border border-[#28A745]/30 px-2 py-1 text-[11px] font-semibold text-[#218c3a] hover:bg-[#28A745]/5 disabled:opacity-60">
                {busyId === task.id ? <LoaderCircle size={11} className="animate-spin" /> : <Check size={11} />} Done
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
