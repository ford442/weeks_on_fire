import { mediaElementTrack, type PlaybackGraph, type PlaybackTrack } from '../playbackGraph';

import { startCanvasTake, type CanvasTake } from './canvasTake';
import { drawCutawayFrame, type CompositorShot } from './compositor';

import type { ColorWhipDialect } from '../colorWhip';
import type { CutawayTimeline } from '../cutawayTimeline';
import type { TakeResult } from './recorder';

/**
 * Records a cutaway preview: the stills compositor and the song, both driven by the preview's own
 * `PlaybackGraph`, so the take is cut exactly where the preview cuts. Loaded on the first Record
 * press, never with the Suggestions view.
 */

/** The assembler's default frame (`scripts/assemble-cutaway.py`, `DEFAULT_SIZE`). */
export const CAPTURE_SIZE = { width: 1280, height: 720 } as const;

const AUDIO_LOAD_TIMEOUT_MS = 20_000;
const HIDDEN_HOLD = 'capture:hidden';

export interface ShotSource {
  label: string;
  stillUrl?: string;
  whip: ColorWhipDialect | null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  // Hosted stills must come with CORS: a still drawn without it taints the canvas and the
  // recorder refuses it. A still that fails here is drawn as a placeholder instead.
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.src = url;
  return image.decode().then(() => image);
}

/** Decodes every still up front, so no frame of the take waits on the network. */
export async function loadShots(sources: readonly ShotSource[]): Promise<CompositorShot[]> {
  return Promise.all(
    sources.map(async ({ label, stillUrl, whip }): Promise<CompositorShot> => {
      if (!stillUrl) return { label, image: null, whip };
      try {
        return { label, image: await loadImage(stillUrl), whip };
      } catch {
        return {
          label,
          image: null,
          whip,
          note: 'Still could not be loaded for capture (host must allow CORS)',
        };
      }
    }),
  );
}

function whenPlayable(element: HTMLAudioElement): Promise<void> {
  if (element.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => done(new Error('The song took too long to load.')),
      AUDIO_LOAD_TIMEOUT_MS,
    );
    const done = (error?: Error) => {
      window.clearTimeout(timer);
      element.removeEventListener('canplaythrough', ok);
      element.removeEventListener('error', failed);
      if (error) reject(error);
      else resolve();
    };
    const ok = () => done();
    const failed = () => done(new Error('The song could not be loaded.'));
    element.addEventListener('canplaythrough', ok);
    element.addEventListener('error', failed);
    element.load();
  });
}

/** The song, through Web Audio, so it is both heard and recorded (Safari has no `captureStream` on media). */
async function songSource(url: string) {
  const element = new Audio();
  element.preload = 'auto';
  element.crossOrigin = 'anonymous';
  element.src = url;
  await whenPlayable(element);
  const context = new AudioContext();
  await context.resume();
  const source = context.createMediaElementSource(element);
  const destination = context.createMediaStreamDestination();
  source.connect(destination);
  source.connect(context.destination);
  return {
    element,
    tracks: destination.stream.getAudioTracks(),
    close() {
      element.pause();
      element.removeAttribute('src');
      element.load();
      void context.close();
    },
  };
}

export function compositorTrack(
  canvas: HTMLCanvasElement,
  timeline: CutawayTimeline,
  shots: readonly CompositorShot[],
  motion: boolean,
): PlaybackTrack {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('This browser has no 2D canvas.');
  const draw = (timeSec: number) => drawCutawayFrame(ctx, timeline, shots, timeSec, { motion });
  return { transport: ({ timeSec }) => draw(timeSec), frame: ({ timeSec }) => draw(timeSec) };
}

export interface CutawayCaptureOptions {
  graph: PlaybackGraph;
  canvas: HTMLCanvasElement;
  timeline: CutawayTimeline;
  shots: readonly CompositorShot[];
  /** The cutaway's song, when it has audio. */
  audioUrl?: string;
  motion: boolean;
  /** The take reached the end of the cut. */
  onEnd: () => void;
  onError: (message: string) => void;
}

export interface CutawayCapture {
  readonly withAudio: boolean;
  /** Stops recording and returns the take (all of it, or as far as it got). */
  finish(): Promise<TakeResult>;
  cancel(): void;
}

/**
 * Starts a full take from 0: loop off, song from the top. The recorder pauses whenever the graph
 * does (Pause, another player taking over, a hidden tab), so the file stays as long as the cut.
 */
export async function startCutawayCapture({
  graph,
  canvas,
  timeline,
  shots,
  audioUrl,
  motion,
  onEnd,
  onError,
}: CutawayCaptureOptions): Promise<CutawayCapture> {
  canvas.width = CAPTURE_SIZE.width;
  canvas.height = CAPTURE_SIZE.height;
  const song = audioUrl ? await songSource(audioUrl) : null;

  let take: CanvasTake;
  const removals: (() => void)[] = [];
  try {
    graph.pause();
    graph.setLoop(false);
    graph.seek(0);
    removals.push(graph.addTrack(compositorTrack(canvas, timeline, shots, motion)));
    if (song) removals.push(graph.addTrack(mediaElementTrack(song.element)));
    take = startCanvasTake(canvas, { audioTracks: song?.tracks, onError });
  } catch (error) {
    removals.forEach((remove) => remove());
    song?.close();
    throw error;
  }

  let ended = false;
  const unsubscribe = graph.subscribe((snapshot) => {
    take.setPaused(!snapshot.playing || snapshot.held);
    if (!ended && !snapshot.playing && snapshot.timeSec >= snapshot.durationSec - 1e-3) {
      ended = true;
      onEnd();
    }
  });
  const onVisibility = () => {
    if (document.hidden) graph.hold(HIDDEN_HOLD);
    else graph.release(HIDDEN_HOLD);
  };
  document.addEventListener('visibilitychange', onVisibility);
  graph.play();

  const teardown = () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', onVisibility);
    graph.release(HIDDEN_HOLD);
    graph.pause();
    removals.forEach((remove) => remove());
    song?.close();
  };

  return {
    withAudio: song !== null,
    async finish() {
      graph.pause();
      try {
        return await take.finish();
      } finally {
        teardown();
      }
    },
    cancel() {
      take.cancel();
      teardown();
    },
  };
}
