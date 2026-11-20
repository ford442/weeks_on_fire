import { afterEach, describe, expect, it, vi } from 'vitest';

import { createWorkerHost } from './workerHost';

import type { MainToWorkerMessage, WorkerToMainMessage } from '../worker/protocol';
import type { RendererCallbacks } from './host';

function setup() {
  const posted: MainToWorkerMessage[] = [];
  const worker = {
    onmessage: null as ((event: MessageEvent<unknown>) => void) | null,
    onerror: null as ((event: ErrorEvent) => void) | null,
    onmessageerror: null as (() => void) | null,
    postMessage: (message: MainToWorkerMessage) => posted.push(message),
    terminate: vi.fn(),
  };
  const offscreen = {};
  const canvas = {
    width: 300,
    height: 150,
    transferControlToOffscreen: vi.fn(() => offscreen),
  };
  const callbacks = {
    onReady: vi.fn<RendererCallbacks['onReady']>(),
    onFailure: vi.fn<RendererCallbacks['onFailure']>(),
    onContextLost: vi.fn<RendererCallbacks['onContextLost']>(),
    onContextRestored: vi.fn<RendererCallbacks['onContextRestored']>(),
    onFrame: vi.fn<RendererCallbacks['onFrame']>(),
  };
  const host = createWorkerHost(
    canvas as unknown as HTMLCanvasElement,
    {
      source: { id: 'kick-lattice' },
      durationSec: 16,
      capture: false,
      width: 800,
      height: 450,
      dpr: 2,
      createWorker: () => worker as unknown as Worker,
    },
    callbacks,
  );
  const reply = (message: WorkerToMainMessage | object) =>
    worker.onmessage?.({ data: message } as MessageEvent<unknown>);
  const frames = () => posted.filter((m) => m.type === 'tick' || m.type === 'seek');
  return { host, posted, worker, canvas, callbacks, reply, frames, offscreen };
}

const stats = {
  timeSec: 1,
  cpuMs: 0.3,
  drawCalls: 4,
  instances: 7,
  uniformCalls: 9,
  bufferUploads: 2,
  width: 800,
  height: 450,
};

describe('createWorkerHost', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sizes the canvas before the transfer and sends it in init', () => {
    const { canvas, posted, offscreen } = setup();
    expect([canvas.width, canvas.height]).toEqual([800, 450]);
    expect(posted[0]).toMatchObject({
      type: 'init',
      canvas: offscreen,
      width: 800,
      height: 450,
      dpr: 2,
    });
  });

  it('drops intermediate frames while one is in flight, keeping the newest', () => {
    const { host, reply, frames } = setup();
    host.frame(1, true);
    host.frame(1.1, true);
    host.frame(1.2, true);
    expect(frames()).toEqual([{ type: 'tick', timeSec: 1 }]);
    reply({ type: 'frameStats', stats });
    expect(frames()).toEqual([
      { type: 'tick', timeSec: 1 },
      { type: 'tick', timeSec: 1.2 },
    ]);
  });

  it('keeps a dropped seek a seek, even if later frames were continuous', () => {
    const { host, reply, frames } = setup();
    host.frame(1, true);
    host.frame(7, false);
    host.frame(7.02, true);
    reply({ type: 'frameStats', stats: null });
    expect(frames().at(-1)).toEqual({ type: 'seek', timeSec: 7.02 });
  });

  it('passes drawn frames on, and not the empty replies', () => {
    const { host, reply, callbacks } = setup();
    host.frame(0, false);
    reply({ type: 'frameStats', stats: null });
    host.frame(0.1, true);
    reply({ type: 'frameStats', stats });
    expect(callbacks.onFrame).toHaveBeenCalledTimes(1);
    expect(callbacks.onFrame).toHaveBeenCalledWith(stats);
  });

  it('only posts a resize when the size changed', () => {
    const { host, posted } = setup();
    host.resize(800, 450, 2);
    host.resize(400, 225, 1);
    host.resize(400, 225, 1);
    expect(posted.filter((m) => m.type === 'resize')).toEqual([
      { type: 'resize', width: 400, height: 225, dpr: 1 },
    ]);
  });

  it('ignores messages that are not worker replies', () => {
    const { reply, callbacks } = setup();
    reply({ type: 'something-else' });
    reply({ type: 'ready', kind: 'webgl2', preserveDrawingBuffer: false, renderer: null });
    expect(callbacks.onReady).toHaveBeenCalledTimes(1);
  });

  it('reports every worker failure as recoverable and stops the worker', () => {
    const failed = setup();
    failed.reply({ type: 'failed', kind: 'webgl2', stage: 'scene', reason: 'link error' });
    expect(failed.callbacks.onFailure).toHaveBeenCalledWith({
      kind: 'webgl2',
      reason: 'link error',
      recoverable: true,
    });
    expect(failed.worker.terminate).toHaveBeenCalled();
    // Nothing more is sent to a failed worker.
    failed.host.frame(1, true);
    expect(failed.frames()).toHaveLength(0);

    const unreadable = setup();
    unreadable.worker.onmessageerror?.();
    expect(unreadable.callbacks.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'none', recoverable: true }),
    );
  });

  it('reports a canvas that cannot be transferred without starting a worker', () => {
    const onFailure = vi.fn<RendererCallbacks['onFailure']>();
    const callbacks = { onFailure } as unknown as RendererCallbacks;
    const createWorker = vi.fn();
    const canvas = {
      transferControlToOffscreen: () => {
        throw new DOMException('already transferred', 'InvalidStateError');
      },
    };
    createWorkerHost(
      canvas as unknown as HTMLCanvasElement,
      {
        source: { id: 'x' },
        durationSec: 10,
        capture: false,
        width: 1,
        height: 1,
        dpr: 1,
        createWorker,
      },
      callbacks,
    );
    expect(createWorker).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledWith({
      kind: 'none',
      reason: 'already transferred',
      recoverable: true,
    });
  });

  it('asks the worker to dispose, and terminates it only if it lingers', () => {
    vi.useFakeTimers();
    const { host, posted, worker } = setup();
    host.dispose();
    expect(posted.at(-1)).toEqual({ type: 'dispose' });
    expect(worker.terminate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(worker.terminate).toHaveBeenCalled();
  });
});
