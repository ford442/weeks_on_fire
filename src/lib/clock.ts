/**
 * Wall-clock helpers for the EyeWash Station schedule. Pure and dependency-free: codegen
 * (`scripts/content-index/validate.ts`) and the hub UI both use them, so a time means the same
 * thing in the rundown file, the validator and the guide.
 *
 * A time is "minutes since midnight" (0–1439). There is no date and no time zone here: the
 * station runs one looping broadcast day on the viewer's own clock.
 */

export const DAY_MINUTES = 24 * 60;

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** `"02:30"` → `150`. `undefined` for anything that is not `HH:MM`, 24-hour. */
export function parseClock(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const match = CLOCK_PATTERN.exec(value);
  if (!match) return undefined;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes since local midnight for `date`. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** `150` → `"02:30"`. The form used in `content/schedule.json`, `<time dateTime>` and `?at=`. */
export function toClock(minutes: number): string {
  const wrapped = ((Math.round(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(wrapped / 60);
  return `${String(hours).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

/** `150` → `"2:30 AM"`, `0` → `"12:00 AM"`, `720` → `"12:00 PM"`. */
export function formatClock(minutes: number): string {
  const wrapped = ((Math.round(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(wrapped / 60);
  const suffix = hours < 12 ? 'AM' : 'PM';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${String(wrapped % 60).padStart(2, '0')} ${suffix}`;
}

/**
 * How far past `dayStart` a clock time falls, wrapping at midnight: with a 06:00 day start,
 * 06:00 → 0, 23:00 → 1020, 02:00 → 1200. Slots in a broadcast day must have strictly increasing
 * offsets, which is how a rundown that crosses midnight is ordered without dates.
 */
export function broadcastOffset(minutes: number, dayStart: number): number {
  return (((minutes - dayStart) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}
