import { ArrowRight, Flame, MessageCircle } from 'lucide-react';

// The answer to "what do I do with this list?": the people who need you first, one tap away.
// Shows only on the unfiltered list, and only when somebody actually needs a reply.
export default function StartHere({ stats, onSetStateFilter }) {
  const unread = stats.unread || 0;
  const hot = stats.hot || 0;
  if (unread <= 0 && hot <= 0) return null;

  const useUnread = unread > 0;
  const count = useUnread ? unread : hot;
  const Icon = useUnread ? MessageCircle : Flame;
  const text = useUnread
    ? `${count} ${count === 1 ? 'person is' : 'people are'} waiting for your reply`
    : `${count} ${count === 1 ? 'person looks' : 'people look'} ready to buy`;

  return (
    <button
      type="button"
      onClick={() => onSetStateFilter(useUnread ? 'unread' : 'hot')}
      className="mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-xl border border-[#28A745]/25 bg-gradient-to-br from-[#F7FBF9] to-white px-3 py-2.5 text-left transition hover:border-[#28A745]/50 md:mx-0 md:w-full max-md:min-h-[48px]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#28A745]/10 text-[#28A745]"><Icon size={16} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug text-slate-800">{text}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-bold text-[#28A745]">Start here <ArrowRight size={12} aria-hidden="true" /></span>
    </button>
  );
}
