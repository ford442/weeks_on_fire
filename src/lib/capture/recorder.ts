import { withWebmDuration } from './webmDuration';

import type { RecordingFormat } from './support';

/**
 * In-browser take recording: `MediaRecorder` over a canvas `captureStream()` (plus an audio track
 * for cutaways). No library: WebM from MediaRecorder is enough for a preview take, and the
 * authoritative assembly stays `scripts/assemble-cutaway.py` + ffmpeg (docs/capture.md).
 */

/** Enough for a 1080p preview take without the encoder smearing a Color Whip strobe. */
const VIDEO_BITS_PER_SECOND = 8_000_000;

export interface TakeResult {
  blob: Blob;
  /** Seconds the recorder was actually recording (pauses excluded); what the file reports. */
  durationSec: number;
  format: RecordingFormat;
}

export interface TakeRecorderOptions {
  /** Clock in ms (`performance.now()`); a seam for tests. */
  now?: () => number;
  /** A seam for tests. */
  Recorder?: typeof MediaRecorder;
  videoBitsPerSecond?: number;
  onError?: (message: string) => void;
}

/**
 * One take: start, pause while the picture cannot advance (hidden tab, paused transport, lost GL
 * context), stop. Pausing keeps the file's length equal to the film time it shows, so a full take
 * of a 30 s sequence is a 30 s file even if the tab was hidden half way.
 */
export class TakeRecorder {
  private readonly recorder: MediaRecorder;
  private readonly chunks: Blob[] = [];
  private readonly now: () => number;
  private activeMs = 0;
  private resumedAt: number | null = null;
  private stopped: Promise<void> | null = null;
  private failed: string | null = null;

  constructor(
    stream: MediaStream,
    readonly format: RecordingFormat,
    options: TakeRecorderOptions = {},
  ) {
    this.now = options.now ?? (() => performance.now());
    const Recorder = options.Recorder ?? MediaRecorder;
    this.recorder = new Recorder(stream, {
      mimeType: format.mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond ?? VIDEO_BITS_PER_SECOND,
    });
    this.recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    });
    this.recorder.addEventListener('error', (event) => {
      const error = (event as Event & { error?: unknown }).error;
      this.failed = error instanceof Error ? error.message : 'The recorder stopped with an error.';
      options.onError?.(this.failed);
    });
  }

  get state(): RecordingState {
    return this.recorder.state;
  }

  /** Recorded seconds so far, pauses excluded. */
  get elapsedSec(): number {
    const running = this.resumedAt === null ? 0 : this.now() - this.resumedAt;
    return (this.activeMs + running) / 1000;
  }

  start(): void {
    if (this.recorder.state !== 'inactive') return;
    // One-second chunks: a long take is not held as one growing buffer inside the encoder.
    this.recorder.start(1000);
    this.resumedAt = this.now();
  }

  /** Pauses or resumes to match whether the picture is advancing. Idempotent. */
  setPaused(paused: boolean): void {
    const { state } = this.recorder;
    if (paused && state === 'recording') {
      this.recorder.pause();
      this.fold();
    } else if (!paused && state === 'paused') {
      this.recorder.resume();
      this.resumedAt = this.now();
    }
  }

  /** Finishes the take. The WebM gets its Duration written so players and editors can seek it. */
  async stop(): Promise<TakeResult> {
    this.fold();
    await this.finish();
    if (this.failed) throw new Error(this.failed);
    const durationSec = this.activeMs / 1000;
    const raw = new Blob(this.chunks, { type: this.format.mimeType.split(';')[0] });
    const blob = this.format.extension === 'webm' ? await withWebmDuration(raw, durationSec) : raw;
    return { blob, durationSec, format: this.format };
  }

  /** Drops the take. */
  cancel(): void {
    this.fold();
    void this.finish().then(() => {
      this.chunks.length = 0;
    });
  }

  private fold(): void {
    if (this.resumedAt === null) return;
    this.activeMs += this.now() - this.resumedAt;
    this.resumedAt = null;
  }

  private finish(): Promise<void> {
    if (this.stopped) return this.stopped;
    this.stopped = new Promise((resolve) => {
      if (this.recorder.state === 'inactive') {
        resolve();
        return;
      }
      this.recorder.addEventListener('stop', () => resolve(), { once: true });
      this.recorder.stop();
    });
    return this.stopped;
  }
}

/** Stops every track of a capture stream (canvas and audio), so the browser stops capturing. */
export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}
