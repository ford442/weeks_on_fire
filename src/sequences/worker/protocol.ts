/**
 * Messages between `SequencePlayer` (main thread) and the render worker (`renderWorker.ts`).
 *
 * The main thread owns the film clock, React, the transport UI, MediaSession and the context-loss
 * overlay. The worker owns the transferred `OffscreenCanvas`, its GL context, the engine and the
 * scene. Every message is structured-cloneable plain data; only `init` transfers anything (the
 * canvas). Kept as a hand-written discriminated union: both ends are this repo, so there is no
 * untrusted input to validate.
 *
 * Flow: `init` → `ready` | `failed`. Then one `frameStats` reply per `tick` / `seek`, so the main
 * thread can hold back the next frame until the worker has drawn the last one (no queue builds up
 * on a slow device). `contextLost` / `contextRestored` arrive whenever the browser says so.
 */

import type { ContextEnv, GlKind } from '../../lib/webgl/context';
import type { SequenceGraph } from '../graph/types';
import type { FrameStats } from '../render/core';

/** Starts the worker on a film. Sent once; the canvas is in the transfer list. */
export interface InitMessage {
  type: 'init';
  canvas: OffscreenCanvas;
  sequenceId: string;
  /** Graph-backed films send their graph, so the worker never imports the catalog. */
  graph?: SequenceGraph;
  durationSec: number;
  /** Device pixel ratio the backing size was computed with (capped at 2 by the player). */
  dpr: number;
  /** Drawing-buffer size; the canvas arrives already sized to it. */
  width: number;
  height: number;
  /** Keep the drawing buffer (`?capture=1`). */
  capture: boolean;
  /** Read on the main thread: a worker has no `matchMedia`. */
  env: ContextEnv;
}

/** Draws the next frame of continuous playback. */
export interface TickMessage {
  type: 'tick';
  timeSec: number;
}

/**
 * Draws a frame that does not follow the last one (slider seek, restart, loop wrap, first frame).
 * Today's scenes are pure functions of time, so it draws exactly like `tick`; a scene that
 * integrates state (particles, hose IK) must reset it here instead of integrating across the jump.
 */
export interface SeekMessage {
  type: 'seek';
  timeSec: number;
}

/** New drawing-buffer size. The placeholder `<canvas>` cannot be resized after the transfer. */
export interface ResizeMessage {
  type: 'resize';
  width: number;
  height: number;
  dpr: number;
}

/** Frees the scene, engine and context, then closes the worker. */
export interface DisposeMessage {
  type: 'dispose';
}

export type MainToWorkerMessage =
  InitMessage | TickMessage | SeekMessage | ResizeMessage | DisposeMessage;

/** The context and scene are up; frames may follow. */
export interface ReadyMessage {
  type: 'ready';
  kind: GlKind;
  /** As the context reports it, not as requested. */
  preserveDrawingBuffer: boolean;
  /** GPU string; only sent for capture runs. */
  renderer: string | null;
}

/**
 * The worker cannot draw this film: no GL on an OffscreenCanvas (Safari before 17), a shader
 * that failed to compile, or a restore that did not come back. The player falls back in-thread.
 */
export interface FailedMessage {
  type: 'failed';
  kind: GlKind;
  stage: 'context' | 'scene';
  reason: string | null;
}

export interface ContextLostMessage {
  type: 'contextLost';
}

export interface ContextRestoredMessage {
  type: 'contextRestored';
}

/**
 * Reply to every `tick` / `seek`, drawn or not, so the main thread's one-frame-in-flight window
 * always reopens. `stats` is absent when nothing was drawn (context lost, zero-size canvas).
 */
export interface FrameStatsMessage {
  type: 'frameStats';
  stats: FrameStats | null;
}

export type WorkerToMainMessage =
  ReadyMessage | FailedMessage | ContextLostMessage | ContextRestoredMessage | FrameStatsMessage;

const workerToMainTypes: ReadonlySet<string> = new Set<WorkerToMainMessage['type']>([
  'ready',
  'failed',
  'contextLost',
  'contextRestored',
  'frameStats',
]);

/** Cheap shape check for `message` events, which are `any`-typed and could come from elsewhere. */
export function isWorkerToMainMessage(data: unknown): data is WorkerToMainMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as { type?: unknown }).type === 'string' &&
    workerToMainTypes.has((data as { type: string }).type)
  );
}
