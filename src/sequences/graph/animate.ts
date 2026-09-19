import { lerp, type Vec3 } from '../../lib/webgl/math';
import type { Animated, Ease, Keyframe } from './types';

export function applyEase(ease: Ease, u: number): number {
  switch (ease) {
    case 'in':
      return u * u;
    case 'out':
      return 1 - (1 - u) * (1 - u);
    case 'inOut':
      return u * u * (3 - 2 * u);
    case 'hold':
      return 0;
    default:
      return u;
  }
}

export function isKeyframes<T>(value: Animated<T>): value is Keyframe<T>[] {
  return (
    Array.isArray(value) && typeof value[0] === 'object' && value[0] !== null && 't' in value[0]
  );
}

function mix<T extends number | Vec3>(a: T, b: T, u: number): T {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, u) as T;
  const va = a as Vec3;
  const vb = b as Vec3;
  return [lerp(va[0], vb[0], u), lerp(va[1], vb[1], u), lerp(va[2], vb[2], u)] as T;
}

function copy<T extends number | Vec3>(value: T): T {
  return (typeof value === 'number' ? value : [...(value as Vec3)]) as T;
}

/** Samples keyframes (ascending `t`) at `timeSec`. Values are clamped to the first / last key. */
export function sampleKeys<T extends number | Vec3>(
  keys: readonly Keyframe<T>[],
  timeSec: number,
  defaultEase: Ease = 'linear',
): T {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) throw new Error('Keyframe track is empty');
  if (timeSec <= first.t) return copy(first.v);
  if (timeSec >= last.t) return copy(last.v);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (a && b && timeSec < b.t) {
      const u = (timeSec - a.t) / (b.t - a.t);
      return mix(a.v, b.v, applyEase(a.ease ?? defaultEase, u));
    }
  }
  return copy(last.v);
}

export function resolve<T extends number | Vec3>(value: Animated<T>, timeSec: number): T {
  return isKeyframes(value) ? sampleKeys(value, timeSec) : copy(value as T);
}

/** Maps film time into loop space: past `outSec`, time wraps back to `inSec`. */
export function loopTime(timeSec: number, loop?: { inSec: number; outSec: number }): number {
  if (!loop || timeSec < loop.outSec) return timeSec;
  const span = loop.outSec - loop.inSec;
  return loop.inSec + ((timeSec - loop.inSec) % span);
}
