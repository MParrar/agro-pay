// All helpers work in the browser's local timezone.

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Weeks start on Monday
export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  return addDays(d, -((d.getDay() + 6) % 7));
}

// "YYYY-MM-DD" for <input type="date">
export function toInputDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Parses "YYYY-MM-DD" as local midnight (new Date(str) would use UTC)
export function fromInputDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Given day + the time of day of timeSource (now by default), so entries keep a natural order
export function entryTimestamp(dateValue, timeSource = new Date()) {
  const time = new Date(timeSource);
  const date = fromInputDate(dateValue);
  date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
  return date;
}
