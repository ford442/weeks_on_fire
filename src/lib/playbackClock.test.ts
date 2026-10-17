import { describe, expect, it } from 'vitest';

import { PlaybackClock } from './playbackClock';

const sec = (n: number) => n * 1000;

describe('PlaybackClock', () => {
  it('stays at 0 until played', () => {
    const clock = new PlaybackClock({ durationSec: 10 });
    expect(clock.tick(sec(5))).toEqual({ timeSec: 0, ended: false });
    clock.play(sec(5));
    expect(clock.tick(sec(7)).timeSec).toBeCloseTo(2);
  });

  it('wraps around when looping', () => {
    const clock = new PlaybackClock({ durationSec: 10, playing: true });
    clock.reset(10, true, 0);
    const wrapped = clock.tick(sec(25));
    expect(wrapped.timeSec).toBeCloseTo(5);
    expect(wrapped.ended).toBe(false);
    expect(clock.playing).toBe(true);
    // The wrap rebases the clock, so time keeps counting from 5.
    expect(clock.tick(sec(27)).timeSec).toBeCloseTo(7);
  });

  it('stops on the last frame without looping and reports ended once', () => {
    const clock = new PlaybackClock({ durationSec: 10, loop: false });
    clock.play(0);
    expect(clock.tick(sec(12))).toEqual({ timeSec: 10, ended: true });
    expect(clock.playing).toBe(false);
    expect(clock.tick(sec(13))).toEqual({ timeSec: 10, ended: false });
  });

  it('pause holds time and resume continues from it', () => {
    const clock = new PlaybackClock({ durationSec: 10, playing: true });
    clock.reset(10, true, 0);
    clock.pause(sec(3));
    expect(clock.tick(sec(9)).timeSec).toBeCloseTo(3);
    clock.play(sec(9));
    expect(clock.tick(sec(10)).timeSec).toBeCloseTo(4);
  });

  it('play from the end restarts the film', () => {
    const clock = new PlaybackClock({ durationSec: 10, loop: false });
    clock.play(0);
    clock.tick(sec(11));
    clock.play(sec(20));
    expect(clock.tick(sec(21)).timeSec).toBeCloseTo(1);
  });

  it('seek clamps to the film and keeps play state', () => {
    const clock = new PlaybackClock({ durationSec: 10 });
    clock.seek(-4, 0);
    expect(clock.peek(0)).toBe(0);
    clock.seek(99, 0);
    expect(clock.peek(0)).toBe(10);
    clock.seek(4, sec(1));
    expect(clock.playing).toBe(false);
    clock.play(sec(1));
    clock.seek(6, sec(2));
    expect(clock.tick(sec(3)).timeSec).toBeCloseTo(7);
  });

  it('restart rewinds and plays', () => {
    const clock = new PlaybackClock({ durationSec: 10, loop: false });
    clock.play(0);
    clock.tick(sec(11));
    clock.restart(sec(30));
    expect(clock.playing).toBe(true);
    expect(clock.tick(sec(32)).timeSec).toBeCloseTo(2);
  });

  it('freeze holds time while hidden and thaw resumes without a jump', () => {
    const clock = new PlaybackClock({ durationSec: 60, playing: true });
    clock.reset(60, true, 0);
    clock.freeze(sec(4));
    expect(clock.isFrozen).toBe(true);
    expect(clock.tick(sec(500)).timeSec).toBeCloseTo(4);
    clock.thaw(sec(500));
    expect(clock.tick(sec(501)).timeSec).toBeCloseTo(5);
  });

  it('freeze is idempotent so a context loss while hidden does not double-count', () => {
    const clock = new PlaybackClock({ durationSec: 60, playing: true });
    clock.reset(60, true, 0);
    clock.freeze(sec(4)); // tab hidden
    clock.freeze(sec(10)); // context lost while hidden
    clock.thaw(sec(20)); // context restored
    expect(clock.tick(sec(20)).timeSec).toBeCloseTo(4);
  });

  it('keeps the paused intent through freeze / thaw', () => {
    const clock = new PlaybackClock({ durationSec: 10 });
    clock.seek(3, 0);
    clock.freeze(sec(1));
    clock.thaw(sec(9));
    expect(clock.playing).toBe(false);
    expect(clock.tick(sec(12)).timeSec).toBeCloseTo(3);
  });

  it('does not wrap or end while frozen', () => {
    const clock = new PlaybackClock({ durationSec: 10, loop: false });
    clock.play(0);
    clock.freeze(sec(9));
    expect(clock.tick(sec(100))).toEqual({ timeSec: 9, ended: false });
    expect(clock.playing).toBe(true);
  });

  it('reset starts a new film at 0', () => {
    const clock = new PlaybackClock({ durationSec: 10, playing: true });
    clock.reset(10, true, 0);
    clock.tick(sec(7));
    clock.reset(30, false, sec(7));
    expect(clock.durationSec).toBe(30);
    expect(clock.playing).toBe(false);
    expect(clock.tick(sec(8)).timeSec).toBe(0);
  });

  it('tolerates a zero-length film', () => {
    const clock = new PlaybackClock({ durationSec: 0, playing: true });
    clock.reset(0, true, 0);
    expect(clock.tick(sec(1)).timeSec).toBe(0);
  });
});

describe('PlaybackClock loop switch', () => {
  it('turning loop off mid-film makes the next end final', () => {
    const clock = new PlaybackClock({ durationSec: 10 });
    clock.play(0);
    clock.setLoop(false);
    expect(clock.loop).toBe(false);
    expect(clock.tick(sec(11))).toEqual({ timeSec: 10, ended: true });
  });
});
