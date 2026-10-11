import { ListChecks, Megaphone, Plus, X } from 'lucide-react';
import { formatDate } from '../../../utils/leadHelpers';
import { Bar } from '../../shared/Skeleton';

// Where this lead sits in the automation: which lists they are in, which follow-up each list runs, and which
// follow-up they are actually on (step X of Y, when the next message goes out). Replaces the old consent box.
export default function MembershipStrip({ workspace, loading, lead, onAddToList, onAddToCampaign, onRemoveFromCampaign }) {
  const { lists, followups } = workspace;
  const active = followups.filter((item) => ['pending', 'active'].includes(item.enrollmentStatus));
  const past = followups.filter((item) => !['pending', 'active'].includes(item.enrollmentStatus));

  return (
    <section className="mx-4 my-3 rounded-xl border border-slate-200 bg-white md:mx-6" aria-label="Lists and follow-ups">
      <div className="grid gap-px overflow-hidden rounded-xl bg-slate-100 md:grid-cols-2">
        <div className="bg-white p-4">
          <Header icon={ListChecks} title="Lists" action={onAddToList && <AddButton onClick={onAddToList}>Add to list</AddButton>} />
          {loading && lists.length === 0 ? <RowSkeleton /> : lists.length === 0 ? (
            <Muted>Not on any list.</Muted>
          ) : (
            <ul className="flex flex-col gap-2">
              {lists.map((list) => (
                <li key={list.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12.5px] font-semibold text-slate-800">{list.name}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{list.type === 'auto' ? 'Auto' : list.type === 'ad' ? 'Ad' : 'Manual'}</span>
                  </div>
                  {list.followup && (
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{list.followup.name}</span>
                      {list.followup.status !== 'active' ? ` (${list.followup.status})` : list.followup.enrolled ? ' · in it' : ' · not in it yet'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-4">
          <Header icon={Megaphone} title="Follow-up" action={onAddToCampaign && active.length === 0 && <AddButton onClick={onAddToCampaign}>Add to campaign</AddButton>} />
          {loading && followups.length === 0 ? <RowSkeleton /> : active.length === 0 ? (
            <Muted>
              None running.
              {past.length > 0 ? ` Last: ${past[0].name} (${past[0].enrollmentStatus}).` : ''}
              {lead.do_not_contact ? ' Do not contact.' : ''}
            </Muted>
          ) : (
            <ul className="flex flex-col gap-2">
              {active.map((item) => (
                <li key={item.enrollmentId} className="rounded-lg bg-[#F7FBF9] px-3 py-2 ring-1 ring-[#28A745]/15">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12.5px] font-semibold text-slate-800">{item.name}</span>
                    {onRemoveFromCampaign && (
                      <button type="button" onClick={() => onRemoveFromCampaign(item)} className="flex shrink-0 items-center gap-0.5 rounded px-1 text-[10.5px] font-semibold text-slate-400 hover:bg-white hover:text-red-600" title="Take them out of this follow-up">
                        <X size={11} /> Remove
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.totalSteps ? `Step ${Math.min(item.currentStep + 1, item.totalSteps)} of ${item.totalSteps}` : `Step ${item.currentStep + 1}`}
                    {item.nextSendAt ? ` · next message ${formatDate(item.nextSendAt, { withTime: true })}` : ''}
                    {item.viaList ? ` · through list ${item.viaList}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Header({ icon: Icon, title, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500"><Icon size={13} className="text-[#28A745]" /> {title}</h3>
      {action}
    </div>
  );
}

function AddButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 rounded-md border border-[#28A745]/30 px-2 py-1 text-[11px] font-semibold text-[#218c3a] hover:bg-[#28A745]/5">
      <Plus size={12} /> {children}
    </button>
  );
}

function Muted({ children }) {
  return <p className="text-[12px] leading-relaxed text-slate-400">{children}</p>;
}

function RowSkeleton() {
  return (
    <div className="animate-pulse space-y-2" aria-hidden="true">
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 space-y-1.5"><Bar className="h-3 w-1/2" /><Bar className="h-2.5 w-1/3 bg-slate-100" /></div>
    </div>
  );
}
