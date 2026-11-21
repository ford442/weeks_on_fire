import { stopStream, TakeRecorder, type TakeResult } from './recorder';
import { DEFAULT_CAPTURE_FPS, pickRecordingFormat } from './support';

export interface CanvasTakeOptions {
  fps?: number;
  /** Audio to mux in (a cutaway's song through Web Audio). */
  audioTracks?: MediaStreamTrack[];
  onError?: (message: string) => void;
}

/** A take being recorded from one canvas. */
export interface CanvasTake {
  /** Pause while the picture is not advancing (paused transport, hidden tab, lost context). */
  setPaused(paused: boolean): void;
  readonly elapsedSec: number;
  /** Ends the take and returns the file. */
  finish(): Promise<TakeResult>;
  /** Drops the take. */
  cancel(): void;
}

/**
 * Starts recording `canvas` now. The canvas must stay origin-clean (no cross-origin pixels without
 * CORS), or `captureStream` throws a SecurityError; the caller reports that as the failure.
 */
export function startCanvasTake(
  canvas: HTMLCanvasElement,
  { fps = DEFAULT_CAPTURE_FPS, audioTracks = [], onError }: CanvasTakeOptions = {},
): CanvasTake {
  const format = pickRecordingFormat(audioTracks.length > 0);
  if (!format) throw new Error('This browser cannot encode WebM or MP4 video.');
  const video = canvas.captureStream(fps);
  const stream = new MediaStream([...video.getVideoTracks(), ...audioTracks]);
  const recorder = new TakeRecorder(stream, format, { onError });
  recorder.start();
  let done = false;

  const release = () => {
    done = true;
    stopStream(video);
    stopStream(stream);
  };

  return {
    setPaused(paused) {
      if (!done) recorder.setPaused(paused);
    },
    get elapsedSec() {
      return recorder.elapsedSec;
    },
    async finish() {
      try {
        return await recorder.stop();
      } finally {
        release();
      }
    },
    cancel() {
      if (done) return;
      recorder.cancel();
      release();
    },
  };
}
