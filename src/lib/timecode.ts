export function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const whole = Math.floor(clamped);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

/** `m:ss.t`: a take's length, where a tenth of a second is the difference that matters. */
export function formatTimecodeTenths(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const tenthsTotal = Math.floor(clamped * 10 + 1e-6);
  const whole = Math.floor(tenthsTotal / 10);
  return `${formatTimecode(whole)}.${tenthsTotal % 10}`;
}
