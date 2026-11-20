import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSequenceGl } from '../../lib/webgl/context';
import { createScene } from '../scenes';

import { isWorkerToMainMessage, type WorkerToMainMessage } from './protocol';
import { createRenderWorkerRuntime } from './runtime';

vi.mock('../../lib/webgl/context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/webgl/context')>()),
  createSequenceGl: vi.fn(),
}));
vi.mock('../../lib/webgl/engine', () => ({
  SequenceEngine: class {
    stats = { drawCalls: 2, instances: 5, uniformCalls: 7, bufferUploads: 1 };
    beginFrame() {}
    dispose() {}
  },
}));
vi.mock('../scenes', () => ({ createScene: vi.fn() }));

/** An OffscreenCanvas stand-in: sized, and an EventTarget for context loss. */
class FakeOffscreen extends EventTarget {
  width = 300;
  height = 150;
}

function makeScene() {
  return { init: vi.fn(), draw: vi.fn(), dispose: vi.fn() };
}

function makeGl(loseContext = vi.fn()) {
  return {
    getContextAttributes: () => ({ preserveDrawingBuffer: true }),
    getExtension: (name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null),
    getParameter: () => 'Fake GPU',
    RENDERER: 0x1f01,
  } as unknown as ReturnType<typeof createSequenceGl>;
}

function start(overrides: { capture?: boolean } = {}) {
  const posted: WorkerToMainMessage[] = [];
  const close = vi.fn();
  const handle = createRenderWorkerRuntime({ post: (m) => posted.push(m), close });
  const canvas = new FakeOffscreen();
  handle({
    type: 'init',
    canvas: canvas as unknown as OffscreenCanvas,
    sequenceId: 'lattice-hymn',
    durationSec: 16,
    dpr: 2,
    width: 640,
    height: 360,
    capture: overrides.capture ?? false,
    env: { coarsePointer: true },
  });
  return { posted, close, handle, canvas };
}

describe('render worker runtime', () => {
  let scene: ReturnType<typeof makeScene>;

  beforeEach(() => {
    scene = makeScene();
    vi.mocked(createScene).mockReset();
    vi.mocked(createScene).mockReturnValue(scene);
    vi.mocked(createSequenceGl).mockReset();
    vi.mocked(createSequenceGl).mockReturnValue(makeGl());
  });

  it('sizes the canvas, creates the context with the main thread env, and reports ready', () => {
    const { posted, canvas } = start({ capture: true });
    expect([canvas.width, canvas.height]).toEqual([640, 360]);
    expect(vi.mocked(createSequenceGl).mock.lastCall?.[1]).toMatchObject({
      capture: true,
      env: { coarsePointer: true },
    });
    expect(posted).toEqual([
      // jsdom-free Node has no WebGL2RenderingContext, so the stub counts as WebGL1.
      { type: 'ready', kind: 'webgl', preserveDrawingBuffer: true, renderer: 'Fake GPU' },
    ]);
    expect(scene.init).toHaveBeenCalledTimes(1);
  });

  it('only sends the GPU string for capture runs', () => {
    expect(start().posted[0]).toMatchObject({ type: 'ready', renderer: null });
  });

  it('reports a context failure with the browser messages, once each', () => {
    vi.mocked(createSequenceGl).mockImplementation((_canvas, opts) => {
      opts?.onCreationError?.('GPU process was unable to boot');
      opts?.onCreationError?.('GPU process was unable to boot');
      return null;
    });
    expect(start().posted).toEqual([
      { type: 'failed', kind: 'none', stage: 'context', reason: 'GPU process was unable to boot' },
    ]);
  });

  it('reports a scene that will not start', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    scene.init.mockImplementation(() => {
      throw new Error('ERROR: 0:3: undeclared identifier');
    });
    expect(start().posted).toEqual([
      {
        type: 'failed',
        kind: 'webgl',
        stage: 'scene',
        reason: 'ERROR: 0:3: undeclared identifier',
      },
    ]);
  });

  it('answers every tick and seek with frame stats measured in the worker', () => {
    const { posted, handle } = start();
    handle({ type: 'tick', timeSec: 4 });
    handle({ type: 'seek', timeSec: 12 });
    const frames = posted.filter((m) => m.type === 'frameStats');
    expect(frames).toHaveLength(2);
    expect(frames[0]).toMatchObject({
      stats: { timeSec: 4, drawCalls: 2, instances: 5, width: 640, height: 360 },
    });
    expect(scene.draw.mock.calls[1]?.[0]).toMatchObject({
      timeSec: 12,
      progress: 0.75,
      durationSec: 16,
      aspect: 640 / 360,
    });
  });

  it('draws at the size from the latest resize', () => {
    const { handle, canvas } = start();
    handle({ type: 'resize', width: 320, height: 240, dpr: 1 });
    handle({ type: 'tick', timeSec: 1 });
    expect([canvas.width, canvas.height]).toEqual([320, 240]);
    expect(scene.draw.mock.lastCall?.[0]).toMatchObject({ aspect: 320 / 240 });
  });

  it('answers frames with null stats while the context is lost, and rebuilds on restore', () => {
    const { posted, handle, canvas } = start();
    const lost = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(scene.dispose).toHaveBeenCalled();
    handle({ type: 'tick', timeSec: 2 });
    expect(posted.slice(-2)).toEqual([
      { type: 'contextLost' },
      { type: 'frameStats', stats: null },
    ]);

    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(posted.at(-1)).toEqual({ type: 'contextRestored' });
    expect(vi.mocked(createScene)).toHaveBeenCalledTimes(2);
    handle({ type: 'tick', timeSec: 3 });
    expect(posted.at(-1)).toMatchObject({ type: 'frameStats', stats: { timeSec: 3 } });
  });

  it('reports a draw that throws instead of leaving the main thread waiting', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { posted, handle } = start();
    scene.draw.mockImplementation(() => {
      throw new Error('bad frame');
    });
    handle({ type: 'tick', timeSec: 1 });
    expect(posted.slice(-2)).toEqual([
      { type: 'failed', kind: 'webgl', stage: 'scene', reason: 'bad frame' },
      { type: 'frameStats', stats: null },
    ]);
  });

  it('frees the scene and context, then closes, on dispose', () => {
    const loseContext = vi.fn();
    vi.mocked(createSequenceGl).mockReturnValue(makeGl(loseContext));
    const { handle, close, canvas, posted } = start();
    handle({ type: 'dispose' });
    expect(scene.dispose).toHaveBeenCalled();
    expect(loseContext).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    // Listeners are gone: a late loss is not reported.
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(posted.some((m) => m.type === 'contextLost')).toBe(false);
  });

  it('only ever posts messages the main thread recognises', () => {
    const { posted, handle } = start();
    handle({ type: 'tick', timeSec: 1 });
    for (const message of posted) expect(isWorkerToMainMessage(message)).toBe(true);
  });
});

describe('isWorkerToMainMessage', () => {
  it('rejects anything that is not one of the worker replies', () => {
    expect(isWorkerToMainMessage(null)).toBe(false);
    expect(isWorkerToMainMessage('ready')).toBe(false);
    expect(isWorkerToMainMessage({ type: 'tick', timeSec: 1 })).toBe(false);
    expect(isWorkerToMainMessage({ type: 'frameStats', stats: null })).toBe(true);
  });
});
