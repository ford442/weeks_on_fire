import { readContextEnv } from '../../lib/webgl/context';
import { isWorkerToMainMessage, type MainToWorkerMessage } from '../worker/protocol';

import { describeError } from './core';

import type { RendererCallbacks, RendererHost, RendererHostOptions } from './host';

export interface WorkerHostOptions extends RendererHostOptions {
  /** Initial drawing-buffer size, set on the canvas before it is transferred. */
  width: number;
  height: number;
  dpr: number;
  /** Test seam; defaults to the bundled render worker. */
  createWorker?: () => Worker;
}

/** How long a disposed worker gets to free its context before it is terminated. */
const DISPOSE_GRACE_MS = 1000;

/**
 * Set once a worker would not load or got no GL context: every later player on the page goes
 * straight to the in-thread path instead of failing over again.
 */
let workerUnavailable = false;

/**
 * Whether this browser can hand a canvas to a worker at all. It does not prove the worker can
 * get a GL context there (Safari 16.4 has OffscreenCanvas without WebGL); the worker reports
 * that as `failed`, the player falls back in-thread and calls `markWorkerUnavailable()`.
 */
export function canRenderInWorker(): boolean {
  return (
    !workerUnavailable &&
    typeof Worker === 'function' &&
    typeof OffscreenCanvas === 'function' &&
    typeof HTMLCanvasElement === 'function' &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function'
  );
}

export function markWorkerUnavailable(): void {
  workerUnavailable = true;
}

/** Lets the next player try the worker again (tests; a page that knows the cause is gone). */
export function resetWorkerAvailability(): void {
  workerUnavailable = false;
}

function spawnRenderWorker(): Worker {
  // Literal `new Worker(new URL(...), { type: 'module' })` so Vite bundles the worker chunk.
  return new Worker(new URL('../worker/renderWorker.ts', import.meta.url), {
    type: 'module',
    name: 'sequence-render',
  });
}

/**
 * Transfers `canvas` to a render worker and drives it. A transferred canvas cannot go back to
 * the page, so the player gives each host its own `<canvas>` and builds a fresh one to fall back.
 *
 * At most one frame is in flight: a frame requested while the worker is still drawing replaces
 * any older pending one and is sent when the worker replies, so a slow device drops frames
 * instead of queueing them.
 */
export function createWorkerHost(
  canvas: HTMLCanvasElement,
  options: WorkerHostOptions,
  callbacks: RendererCallbacks,
): RendererHost {
  let worker: Worker;
  let offscreen: OffscreenCanvas;
  try {
    canvas.width = options.width;
    canvas.height = options.height;
    offscreen = canvas.transferControlToOffscreen();
    worker = (options.createWorker ?? spawnRenderWorker)();
  } catch (error) {
    callbacks.onFailure({ kind: 'none', reason: describeError(error), recoverable: true });
    return { mode: 'worker', frame() {}, resize() {}, dispose() {} };
  }

  let done = false;
  let inFlight = false;
  let pending: { timeSec: number; continuous: boolean } | null = null;
  let size = { width: options.width, height: options.height };

  const post = (message: MainToWorkerMessage, transfer: Transferable[] = []) => {
    worker.postMessage(message, transfer);
  };

  const send = (timeSec: number, continuous: boolean) => {
    inFlight = true;
    post({ type: continuous ? 'tick' : 'seek', timeSec });
  };

  const fail = (failure: { kind: 'none' | 'webgl' | 'webgl2'; reason: string | null }) => {
    if (done) return;
    done = true;
    worker.terminate();
    callbacks.onFailure({ ...failure, recoverable: true });
  };

  worker.onmessage = (event: MessageEvent<unknown>) => {
    if (done) return;
    const message = event.data;
    if (!isWorkerToMainMessage(message)) return;
    switch (message.type) {
      case 'ready':
        callbacks.onReady({
          kind: message.kind,
          preserveDrawingBuffer: message.preserveDrawingBuffer,
          renderer: message.renderer,
        });
        return;
      case 'failed':
        fail({ kind: message.kind, reason: message.reason });
        return;
      case 'contextLost':
        callbacks.onContextLost();
        return;
      case 'contextRestored':
        callbacks.onContextRestored();
        return;
      case 'frameStats': {
        inFlight = false;
        if (message.stats) callbacks.onFrame(message.stats);
        const next = pending;
        pending = null;
        if (next) send(next.timeSec, next.continuous);
        return;
      }
    }
  };
  worker.onerror = (event: ErrorEvent) => {
    event.preventDefault();
    fail({ kind: 'none', reason: event.message || 'The render worker failed to load.' });
  };
  worker.onmessageerror = () => {
    fail({ kind: 'none', reason: 'The render worker sent a message that could not be read.' });
  };

  post(
    {
      type: 'init',
      canvas: offscreen,
      sequenceId: options.source.id,
      graph: options.source.graph,
      durationSec: options.durationSec,
      dpr: options.dpr,
      width: options.width,
      height: options.height,
      capture: options.capture,
      env: readContextEnv(),
    },
    [offscreen],
  );

  return {
    mode: 'worker',
    frame(timeSec, continuous) {
      if (done) return;
      if (inFlight) {
        // A seek anywhere in the dropped run still breaks continuity.
        pending = { timeSec, continuous: (pending?.continuous ?? true) && continuous };
        return;
      }
      send(timeSec, continuous);
    },
    resize(width, height, dpr) {
      if (done || (width === size.width && height === size.height)) return;
      size = { width, height };
      post({ type: 'resize', width, height, dpr });
    },
    dispose() {
      if (done) return;
      done = true;
      post({ type: 'dispose' });
      // The worker closes itself after `dispose`; this only catches one that is stuck.
      setTimeout(() => worker.terminate(), DISPOSE_GRACE_MS);
    },
  };
}
