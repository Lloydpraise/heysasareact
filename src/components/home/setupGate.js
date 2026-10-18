// Is this business still in its first-day setup? One rule, used by Home (which screen to show) and by the app shell
// (whether the sidebar is locked), so the two can never disagree.
//
// Setup is over when the owner finished it, or when the business was already in use before setup existed
// (an idle setup with customers). While the answer is not known yet, or could not be fetched, nothing is locked:
// a slow or failed check must never trap an owner on one screen.
export function isOnboarding(status) {
  if (!status) return false;
  const finished = status.answers?.finished === true;
  const alreadyInUse = status.status === 'idle' && (status.counters?.customers || 0) > 0;
  return !finished && !alreadyInUse;
}
