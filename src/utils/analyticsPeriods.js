// Period maths for the analytics Overview. Everything runs in the viewer's own timezone, weeks start on Monday.
//
// A period has a current range and a comparison range. Finished periods (yesterday, last week, last month)
// compare against the full period before them. Periods still in progress (today, this week, this month)
// compare against the SAME stretch of the previous one (e.g. Mon-Wed this week vs Mon-Wed last week), so a
// Monday morning is never judged against a whole finished week.

export const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This week' },
  { id: 'last_week', label: 'Last week' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
];

const DAY = 24 * 3600 * 1000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

// Returns { id, label, start, end, prevStart, prevEnd, live, grain, noun, prevNoun } with end exclusive.
export function resolvePeriod(id, now = new Date()) {
  const today = startOfDay(now);
  let start; let end; let prevStart; let prevEnd; let live = false; let grain; let noun; let prevNoun;

  switch (id) {
    case 'yesterday':
      start = addDays(today, -1); end = today;
      prevStart = addDays(today, -2); prevEnd = start;
      grain = 'hour'; noun = 'Yesterday'; prevNoun = 'the day before';
      break;
    case 'this_week': {
      start = startOfWeek(now); end = addDays(start, 7); live = true;
      prevStart = addDays(start, -7);
      prevEnd = new Date(Math.min(prevStart.getTime() + (now.getTime() - start.getTime()), start.getTime()));
      grain = 'day'; noun = 'This week'; prevNoun = 'last week';
      break;
    }
    case 'last_week': {
      const thisStart = startOfWeek(now);
      start = addDays(thisStart, -7); end = thisStart;
      prevStart = addDays(start, -7); prevEnd = start;
      grain = 'day'; noun = 'Last week'; prevNoun = 'the week before';
      break;
    }
    case 'this_month': {
      start = startOfMonth(now); end = new Date(now.getFullYear(), now.getMonth() + 1, 1); live = true;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(Math.min(prevStart.getTime() + (now.getTime() - start.getTime()), start.getTime()));
      grain = 'week'; noun = 'This month'; prevNoun = 'last month';
      break;
    }
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = startOfMonth(now);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1); prevEnd = start;
      grain = 'week'; noun = 'Last month'; prevNoun = 'the month before';
      break;
    }
    case 'today':
    default:
      start = today; end = addDays(today, 1); live = true;
      prevStart = addDays(today, -1);
      prevEnd = new Date(Math.min(prevStart.getTime() + (now.getTime() - start.getTime()), today.getTime()));
      grain = 'hour'; noun = 'Today'; prevNoun = 'yesterday';
  }
  return { id: id || 'today', start, end, prevStart, prevEnd, live, grain, noun, prevNoun };
}

export const inRange = (ts, from, to) => {
  if (!ts) return false;
  const t = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
  return t >= from.getTime() && t < to.getTime();
};

// % change from prev to cur. Returns null when there is nothing to compare against, so the UI hides the
// badge instead of showing a meaningless "+400%" or a scary "-100%".
export function changePct(cur, prev) {
  if (prev === null || prev === undefined || !Number.isFinite(prev) || prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

const fmtDay = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const hourLabel = (h) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`);

// Chart buckets for a period. Each bucket: { key, label, from, to, prevFrom, prevTo, full } where prev* is the
// matching bucket in the comparison period (so the chart can show last period as a faint line).
export function buildBuckets(period) {
  const { start, end, prevStart, grain } = period;
  const buckets = [];

  if (grain === 'hour') {
    for (let h = 0; h < 24; h += 1) {
      const from = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h);
      const to = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h + 1);
      const prevFrom = new Date(prevStart.getFullYear(), prevStart.getMonth(), prevStart.getDate(), h);
      const prevTo = new Date(prevStart.getFullYear(), prevStart.getMonth(), prevStart.getDate(), h + 1);
      buckets.push({ key: `h${h}`, label: hourLabel(h), full: `${hourLabel(h)} – ${hourLabel((h + 1) % 24)}`, from, to, prevFrom, prevTo });
    }
    return buckets;
  }

  if (grain === 'day') {
    for (let i = 0; i < 7; i += 1) {
      const from = addDays(start, i);
      const to = addDays(start, i + 1);
      buckets.push({
        key: `d${i}`,
        label: from.toLocaleDateString('en-GB', { weekday: 'short' }),
        full: from.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
        from, to, prevFrom: addDays(prevStart, i), prevTo: addDays(prevStart, i + 1),
      });
    }
    return buckets;
  }

  // month: calendar chunks of 7 days from the 1st, the last one runs to the end of the month. Labelled with
  // the real dates ("1–7 Oct") instead of "Week 1".
  const lastDay = new Date(end.getTime() - DAY);
  let from = new Date(start);
  let i = 0;
  while (from < end) {
    const to = new Date(Math.min(addDays(from, 7).getTime(), end.getTime()));
    const lastInChunk = new Date(to.getTime() - DAY);
    const label = from.getDate() === lastInChunk.getDate()
      ? `${from.getDate()} ${from.toLocaleDateString('en-GB', { month: 'short' })}`
      : `${from.getDate()}–${lastInChunk.getDate()} ${lastInChunk.toLocaleDateString('en-GB', { month: 'short' })}`;
    const prevFrom = addDays(prevStart, i * 7);
    buckets.push({
      key: `w${i}`, label, full: `${fmtDay(from)} – ${fmtDay(lastInChunk)}`,
      from: new Date(from), to, prevFrom, prevTo: addDays(prevFrom, to.getTime() > from.getTime() ? Math.round((to - from) / DAY) : 7),
    });
    from = to; i += 1;
    if (from > lastDay && from >= end) break;
  }
  return buckets;
}

export function periodRangeLabel(period) {
  const last = new Date(period.end.getTime() - DAY);
  if (period.grain === 'hour') return period.start.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  return `${fmtDay(period.start)} – ${fmtDay(last)}`;
}
