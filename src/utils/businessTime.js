const WEEKDAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function getTimeZoneParts(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'long',
  }).formatToParts(date).reduce((parts, part) => {
    if (part.type !== 'literal') parts[part.type] = part.value;
    return parts;
  }, {});
}

export function formatDateTimeLocalInTimeZone(date, timeZone = 'UTC') {
  const parts = getTimeZoneParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseDateTimeLocalInTimeZone(value, timeZone = 'UTC') {
  if (!value) return new Date();
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = (datePart || '').split('-').map(Number);
  const [hour, minute] = (timePart || '').split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return new Date();

  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let result = new Date(targetUtc);
  const actual = getTimeZoneParts(result, timeZone);
  const actualUtc = Date.UTC(Number(actual.year), Number(actual.month) - 1, Number(actual.day), Number(actual.hour), Number(actual.minute), 0, 0);
  result = new Date(targetUtc + (targetUtc - actualUtc));
  return result;
}

export function getTimeZoneHour(date, timeZone = 'UTC') {
  return Number(getTimeZoneParts(date, timeZone).hour);
}

export function getTimeZoneWeekday(date, timeZone = 'UTC') {
  return WEEKDAY_INDEX[getTimeZoneParts(date, timeZone).weekday];
}
