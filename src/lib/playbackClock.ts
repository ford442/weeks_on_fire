export interface PlaybackClockOptions {
  durationSec: number;
  loop?: boolean;
  playing?: boolean;
}

export interface ClockTick {
  /** Film time in seconds, always within `[0, durationSec]`. */
  timeSec: number;
  /** True on the single tick where a non-looping clock reached the end and stopped itself. */
  ended: boolean;
}

/**
 * Film clock for `SequencePlayer`: pure arithmetic over caller-supplied timestamps (ms, as from
 * `performance.now()`), so wrap-around, end-of-film, seek and freeze rules are unit-testable
 * without a browser.
 *
 * Time is `offset + (now - origin) / 1000` while running; every state change folds the elapsed
 * span into `offset` and moves `origin` to `now`.
 */
export class PlaybackClock {
  private looping: boolean;
  private duration: number;
  private running: boolean;
  private frozen = false;
  private offset = 0;
  private origin = 0;

  constructor({ durationSec, loop = true, playing = false }: PlaybackClockOptions) {
    this.duration = Math.max(0, durationSec);
    this.looping = loop;
    this.running = playing;
  }

  get durationSec(): number {
    return this.duration;
  }

  get loop(): boolean {
    return this.looping;
  }

  get playing(): boolean {
    return this.running;
  }

  /** True while the clock is held by `freeze` (hidden tab, lost GL context). */
  get isFrozen(): boolean {
    return this.frozen;
  }

  /** Film time at `now` without advancing or wrapping the clock. */
  peek(now: number): number {
    return Math.min(this.duration, this.rawTime(now));
  }

  setLoop(loop: boolean): void {
    this.looping = loop;
  }

  /** Starts a fresh film: time 0, new duration. */
  reset(durationSec: number, playing: boolean, now: number): void {
    this.duration = Math.max(0, durationSec);
    this.running = playing;
    this.frozen = false;
    this.offset = 0;
    this.origin = now;
  }

  /** Resumes playback; a clock parked at the end starts over from 0. */
  play(now: number): void {
    if (this.offset >= this.duration) this.offset = 0;
    this.origin = now;
    this.running = true;
  }

  pause(now: number): void {
    this.offset = this.rawTime(now);
    this.origin = now;
    this.running = false;
  }

  /** Jumps to `timeSec` (clamped to the film) without changing play / pause. */
  seek(timeSec: number, now: number): void {
    this.offset = Math.min(this.duration, Math.max(0, timeSec));
    this.origin = now;
  }

  restart(now: number): void {
    this.offset = 0;
    this.origin = now;
    this.running = true;
  }

  /**
   * Advances to `now`. Looping clocks wrap past the end; non-looping clocks stop on the last
   * frame and report `ended` once.
   */
  tick(now: number): ClockTick {
    let timeSec = this.rawTime(now);
    let ended = false;
    if (timeSec >= this.duration) {
      if (this.looping && this.running && !this.frozen && this.duration > 0) {
        timeSec %= this.duration;
        this.offset = timeSec;
        this.origin = now;
      } else {
        timeSec = this.duration;
        this.offset = this.duration;
        this.origin = now;
        if (this.running) {
          this.running = false;
          ended = true;
        }
      }
    }
    return { timeSec, ended };
  }

  /**
   * Holds film time while the clock cannot be drawn (tab hidden, GL context lost) so it does not
   * jump ahead on return. Idempotent; the play / pause intent is kept.
   */
  freeze(now: number): void {
    if (this.frozen) return;
    this.offset = this.rawTime(now);
    this.origin = now;
    this.frozen = true;
  }

  /** Releases a `freeze`; the frozen span is discarded rather than played catch-up. */
  thaw(now: number): void {
    this.origin = now;
    this.frozen = false;
  }

  private rawTime(now: number): number {
    if (!this.running || this.frozen) return this.offset;
    return this.offset + (now - this.origin) / 1000;
  }
}
