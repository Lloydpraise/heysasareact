import { AlertTriangle, Clock, Flame, MessageSquare, Send, Wallet } from 'lucide-react';
import { comma } from '../../utils/analyticsHelpers';
import { goToTab, openPreferences } from './homeCopy';

const plural = (n, one, many) => `${comma(n)} ${n === 1 ? one : many}`;

// One short list, most urgent first. Each row is a number, a few words and one button.
// Nothing here is advice: every row is something that is actually true about the business right now.
export function buildMoves({ summary, walletEmpty, canTopUp, topUp, setupFailed, onRetrySetup }) {
  const moves = [];
  const live = summary?.live;
  if (walletEmpty) moves.push({ key: 'wallet', tone: 'red', icon: Wallet, title: 'Your balance is empty', sub: 'Follow-ups and the AI are paused.', cta: canTopUp ? 'Top up' : 'See billing', run: () => (canTopUp ? topUp() : openPreferences('billing')) });
  else if (live && live.messages_left !== null && live.messages_left < 200) moves.push({ key: 'low', tone: 'amber', icon: Wallet, title: `About ${comma(live.messages_left)} messages left`, sub: 'Top up before follow-ups pause.', cta: canTopUp ? 'Top up' : 'See billing', run: () => (canTopUp ? topUp() : openPreferences('billing')) });
  if (setupFailed) moves.push({ key: 'setup', tone: 'red', icon: AlertTriangle, title: 'Setup did not finish', sub: 'Some chats could not be checked.', cta: 'Try again', run: () => onRetrySetup?.() });

  const waiting = summary ? summary.waiting_messages + summary.waiting_plans : 0;
  if (waiting > 0) moves.push({ key: 'approve', tone: 'amber', icon: Send, title: `${plural(waiting, 'follow-up', 'follow-ups')} to approve`, sub: 'One tap sends them.', cta: 'Review', run: () => document.getElementById('home-approvals')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) });
  if (live?.handoffs_open > 0) moves.push({ key: 'handoff', tone: 'amber', icon: MessageSquare, title: `${plural(live.handoffs_open, 'chat needs', 'chats need')} you`, sub: 'The AI passed them to a real person.', cta: 'Open', run: () => goToTab('leads') });
  if (summary?.ready_to_buy > 0) moves.push({ key: 'hot', tone: 'green', icon: Flame, title: `${plural(summary.ready_to_buy, 'person looks', 'people look')} ready to buy`, sub: 'Talk to them while they are warm.', cta: 'See who', run: () => goToTab('leads') });
  const stuck = summary?.opportunities?.waiting_for_reply || 0;
  if (stuck > 0) moves.push({ key: 'stuck', tone: 'blue', icon: Clock, title: `${plural(stuck, 'customer is', 'customers are')} waiting on you`, sub: 'No reply for 12 hours or more.', cta: 'Reply', run: () => goToTab('leads') });
  return moves.slice(0, 5);
}
