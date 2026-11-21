import { PlaybackClock } from './playbackClock';

import type { MediaCoordinator, MediaCoordinatorMetadata } from './mediaCoordinator';

/**
 * One transport (play / pause / seek / loop) driving several tracks off one clock, so a song, a
 * canvas and a run of timed stills cannot drift apart, and a capture of them stays aligned.
 *
 * - The clock is `PlaybackClock` (the film clock `SequencePlayer` already uses); the graph adds
 *   the frame loop, tracks, holds and the media-coordinator hook on top of it.
 * - Media Session and "one thing plays at a time" stay with the hub's existing coordinator
 *   (`MediaSessionProvider`): a graph registers through `connect`, as one player, instead of
 *   keeping a second session of its own.
 *
 * Tracks are told two things: `transport` on every play, pause, seek, wrap, hold and end (an
 * `<audio>` element follows the graph here), and `frame` on every drawn frame (a canvas draws, the
 * stills track picks the active segment).
 */

export interface TransportState {
  timeSec: number;
  /** True only while the clock runs and nothing holds it. */
  playing: boolean;
  /** The time did not follow on from the last one (seek, restart, loop wrap, first sync). */
  jumped: boolean;
}

export interface GraphFrame {
  timeSec: number;
  /** False on the first frame after a seek, restart or loop wrap. */
  continuous: boolean;
  playing: boolean;
}

export interface PlaybackTrack {
  transport?(state: TransportState): void;
  frame?(frame: GraphFrame): void;
  dispose?(): void;
}

export interface GraphSnapshot {
  timeSec: number;
  durationSec: number;
  /** The viewer's intent; a hold (hidden tab while recording) does not clear it. */
  playing: boolean;
  loop: boolean;
  held: boolean;
}

export interface GraphScheduler {
  now(): number;
  request(callback: (now: number) => void): number;
  cancel(handle: number): void;
}

export interface PlaybackGraphOptions {
  durationSec: number;
  loop?: boolean;
  scheduler?: GraphScheduler;
}

const browserScheduler: GraphScheduler = {
  now: () => performance.now(),
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
};

export class PlaybackGraph {
  readonly clock: PlaybackClock;
  private readonly scheduler: GraphScheduler;
  private readonly tracks = new Set<PlaybackTrack>();
  private readonly holds = new Set<string>();
  private readonly listeners = new Set<(snapshot: GraphSnapshot) => void>();
  private link: { coordinator: MediaCoordinator; id: string } | null = null;
  private metadata: MediaCoordinatorMetadata | undefined;
  private handle = 0;
  private lastTime = -1;
  private jumped = true;
  private disposed = false;

  constructor({ durationSec, loop = false, scheduler = browserScheduler }: PlaybackGraphOptions) {
    this.clock = new PlaybackClock({ durationSec, loop, playing: false });
    this.scheduler = scheduler;
  }

  /** Clock running and not held: what tracks are told. */
  get running(): boolean {
    return this.clock.playing && this.holds.size === 0;
  }

  snapshot(): GraphSnapshot {
    return {
      timeSec: this.clock.peek(this.scheduler.now()),
      durationSec: this.clock.durationSec,
      playing: this.clock.playing,
      loop: this.clock.loop,
      held: this.holds.size > 0,
    };
  }

  /** Adds a track and brings it to the current time. Returns its removal. */
  addTrack(track: PlaybackTrack): () => void {
    this.tracks.add(track);
    track.transport?.({ timeSec: this.currentTime(), playing: this.running, jumped: true });
    this.requestFrame();
    return () => {
      if (!this.tracks.delete(track)) return;
      track.dispose?.();
    };
  }

  /** Changes `{ state, time }` listeners hear on transport changes (not every frame). */
  subscribe(listener: (snapshot: GraphSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  play(): void {
    if (this.disposed) return;
    const now = this.scheduler.now();
    const atEnd = this.clock.peek(now) >= this.clock.durationSec;
    this.clock.play(now);
    if (atEnd) this.jumped = true;
    this.changed(atEnd);
    this.activate();
  }

  pause(): void {
    if (this.disposed || !this.clock.playing) return;
    this.clock.pause(this.scheduler.now());
    this.changed(false);
    this.deactivate();
  }

  toggle(): void {
    if (this.clock.playing) this.pause();
    else this.play();
  }

  seek(timeSec: number): void {
    if (this.disposed) return;
    this.clock.seek(timeSec, this.scheduler.now());
    this.jumped = true;
    this.changed(true);
  }

  restart(): void {
    if (this.disposed) return;
    this.clock.restart(this.scheduler.now());
    this.jumped = true;
    this.changed(true);
    this.activate();
  }

  setLoop(loop: boolean): void {
    this.clock.setLoop(loop);
    this.emit();
  }

  /** New length (and time 0, paused): the cut changed. */
  reset(durationSec: number): void {
    this.clock.reset(durationSec, false, this.scheduler.now());
    this.jumped = true;
    this.changed(true);
    this.deactivate();
  }

  /**
   * Holds the clock (and pauses the tracks) while `reason` stands: a hidden tab during a capture,
   * so the take does not skip ahead. The play / pause intent is kept and resumes on release.
   */
  hold(reason: string): void {
    if (this.holds.has(reason)) return;
    const wasRunning = this.running;
    this.holds.add(reason);
    this.clock.freeze(this.scheduler.now());
    if (wasRunning) this.changed(false);
    else this.emit();
  }

  release(reason: string): void {
    if (!this.holds.delete(reason)) return;
    if (this.holds.size > 0) return;
    this.clock.thaw(this.scheduler.now());
    this.changed(false);
  }

  /** Draws one frame soon, even while paused (seek, resize, a track that just loaded). */
  requestFrame(): void {
    if (this.disposed || this.handle !== 0) return;
    this.handle = this.scheduler.request(this.tick);
  }

  /**
   * Plays through the hub's media coordinator: starting this graph pauses whatever else was
   * playing (a song, a sequence), and something else starting pauses this graph.
   */
  connect(coordinator: MediaCoordinator, id: string, metadata?: MediaCoordinatorMetadata) {
    this.deactivate();
    this.link = { coordinator, id };
    this.metadata = metadata;
    if (this.clock.playing) this.activate();
    return () => {
      if (this.link?.id !== id) return;
      this.deactivate();
      this.link = null;
    };
  }

  /** Updates what the Media Session shows (e.g. "Recording · Color Whip"). */
  setMetadata(metadata: MediaCoordinatorMetadata): void {
    this.metadata = metadata;
    if (this.clock.playing) this.activate();
  }

  dispose(): void {
    if (this.disposed) return;
    if (this.handle !== 0) this.scheduler.cancel(this.handle);
    this.handle = 0;
    this.clock.pause(this.scheduler.now());
    this.notifyTransport(false);
    this.deactivate();
    this.link = null;
    this.tracks.forEach((track) => track.dispose?.());
    this.tracks.clear();
    this.listeners.clear();
    this.disposed = true;
  }

  private currentTime(): number {
    return this.clock.peek(this.scheduler.now());
  }

  private readonly tick = (now: number) => {
    this.handle = 0;
    if (this.disposed) return;
    const { timeSec, ended } = this.clock.tick(now);
    const wrapped = !this.jumped && timeSec < this.lastTime;
    const continuous = !this.jumped && !wrapped;
    this.jumped = false;
    this.lastTime = timeSec;
    // A loop wrap is a jump for element-backed tracks: the song goes back to the top.
    if (wrapped) this.notifyTransport(true, timeSec);
    const frame: GraphFrame = { timeSec, continuous, playing: this.running };
    this.tracks.forEach((track) => track.frame?.(frame));
    if (ended) {
      this.notifyTransport(false, timeSec);
      this.deactivate();
      this.emit();
      return;
    }
    if (this.running) this.handle = this.scheduler.request(this.tick);
  };

  /** Tells tracks and listeners, then draws: the loop if running, one frame if paused. */
  private changed(jumped: boolean): void {
    this.notifyTransport(jumped);
    this.emit();
    this.requestFrame();
  }

  private notifyTransport(jumped: boolean, timeSec = this.currentTime()): void {
    const state: TransportState = { timeSec, playing: this.running, jumped };
    this.tracks.forEach((track) => track.transport?.(state));
  }

  private emit(): void {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private activate(): void {
    if (!this.link) return;
    this.link.coordinator.activate(
      this.link.id,
      { play: () => this.play(), pause: () => this.pause() },
      this.metadata,
    );
  }

  private deactivate(): void {
    this.link?.coordinator.deactivate(this.link.id);
  }
}

export interface MediaElementTrackOptions {
  /** Drift (seconds) past which the element is re-seeked to the graph. */
  toleranceSec?: number;
}

/**
 * An `<audio>` (or `<video>`) that follows the graph: seeks with it, plays and pauses with it, and
 * is pulled back when it drifts (a stall while buffering). The graph's clock is the master; the
 * element is never allowed to run the picture.
 */
export function mediaElementTrack(
  element: HTMLMediaElement,
  { toleranceSec = 0.25 }: MediaElementTrackOptions = {},
): PlaybackTrack {
  let lastCheck = -Infinity;

  const playable = (timeSec: number) => {
    const { duration } = element;
    return !Number.isFinite(duration) || timeSec < duration;
  };

  const align = (timeSec: number) => {
    const { duration } = element;
    const target = Number.isFinite(duration) ? Math.min(timeSec, duration) : timeSec;
    if (Math.abs(element.currentTime - target) > 0.01) element.currentTime = target;
  };

  return {
    transport({ timeSec, playing, jumped }) {
      if (jumped || Math.abs(element.currentTime - timeSec) > toleranceSec) align(timeSec);
      if (playing && playable(timeSec)) {
        void element.play().catch(() => {
          // Autoplay refusals and aborted loads leave the picture running silent.
        });
      } else if (!element.paused) {
        element.pause();
      }
    },
    frame({ timeSec, playing }) {
      // Twice a second is plenty; reading currentTime every frame is not free.
      if (!playing || element.paused || Math.abs(timeSec - lastCheck) < 0.5) return;
      lastCheck = timeSec;
      if (playable(timeSec) && Math.abs(element.currentTime - timeSec) > toleranceSec) {
        align(timeSec);
      }
    },
    dispose() {
      element.pause();
    },
  };
}
