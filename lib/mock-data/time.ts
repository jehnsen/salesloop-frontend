/**
 * Mock records are dated relative to "now" so the demo always looks current.
 * The anchor is rounded to the hour so server and client produce identical seeds.
 */
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const MOCK_NOW = Math.floor(Date.now() / HOUR) * HOUR;

export function hoursAgo(hours: number) {
  return new Date(MOCK_NOW - hours * HOUR).toISOString();
}

export function minutesAgo(minutes: number) {
  return new Date(MOCK_NOW - minutes * 60_000).toISOString();
}

export function daysAgo(days: number, extraHours = 0) {
  return new Date(MOCK_NOW - days * DAY - extraHours * HOUR).toISOString();
}

export function daysFromNow(days: number, extraHours = 0) {
  return new Date(MOCK_NOW + days * DAY + extraHours * HOUR).toISOString();
}

export function hoursFromNow(hours: number) {
  return new Date(MOCK_NOW + hours * HOUR).toISOString();
}

/** A specific clock time (Manila, UTC+8) on today's date, shifted by `dayDelta` days. */
export function manilaDayAt(dayDelta: number, hour: number, minute = 0) {
  const manila = new Date(MOCK_NOW + 8 * HOUR);
  const utc = Date.UTC(
    manila.getUTCFullYear(),
    manila.getUTCMonth(),
    manila.getUTCDate() + dayDelta,
    hour - 8,
    minute,
  );
  return new Date(utc).toISOString();
}
