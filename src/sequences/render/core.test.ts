import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SequenceEngine } from '../../lib/webgl/engine';
import { createScene } from '../scenes';

import { SequenceRenderCore, describeError, rendererName } from './core';

import type { SequenceGl } from '../../lib/webgl/context';

const engineDispose = vi.fn();
vi.mock('../../lib/webgl/engine', () => ({
  SequenceEngine: vi.fn(
    class {
      stats = { drawCalls: 6, instances: 6, uniformCalls: 30, bufferUploads: 0 };
      beginFrame = vi.fn();
      dispose = engineDispose;
    },
  ),
}));
vi.mock('../scenes', () => ({ createScene: vi.fn() }));

const gl = {} as SequenceGl;

function makeScene() {
  return { init: vi.fn(), draw: vi.fn(), dispose: vi.fn() };
}

describe('SequenceRenderCore', () => {
  let scene: ReturnType<typeof makeScene>;

  beforeEach(() => {
    scene = makeScene();
    engineDispose.mockReset();
    vi.mocked(createScene).mockReturnValue(scene);
  });

  it('draws the scene with progress and aspect, and returns the engine counters', () => {
    const core = new SequenceRenderCore(gl, { id: 'x' }, 20);
    expect(core.start()).toBeNull();
    const stats = core.draw(5, 400, 300);
    expect(scene.draw).toHaveBeenCalledWith(
      expect.objectContaining({ timeSec: 5, progress: 0.25, durationSec: 20, aspect: 4 / 3 }),
    );
    expect(stats).toMatchObject({
      timeSec: 5,
      drawCalls: 6,
      uniformCalls: 30,
      width: 400,
      height: 300,
    });
    expect(stats?.cpuMs).toBeGreaterThanOrEqual(0);
  });

  it('draws nothing into a zero-size buffer or before start', () => {
    const core = new SequenceRenderCore(gl, { id: 'x' }, 20);
    expect(core.draw(1, 100, 100)).toBeNull();
    core.start();
    expect(core.draw(1, 0, 100)).toBeNull();
    expect(scene.draw).not.toHaveBeenCalled();
  });

  it('frees what it built when the scene fails to start, and says why', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    scene.init.mockImplementation(() => {
      throw new Error('  mesh "ribbon" has 70000 vertices  ');
    });
    const core = new SequenceRenderCore(gl, { id: 'mobius-chrome' }, 75);
    expect(core.start()).toBe('mesh "ribbon" has 70000 vertices');
    expect(engineDispose).toHaveBeenCalled();
    expect(core.draw(1, 10, 10)).toBeNull();
  });

  it('swallows dispose errors from a lost context', () => {
    const core = new SequenceRenderCore(gl, { id: 'x' }, 20);
    core.start();
    scene.dispose.mockImplementation(() => {
      throw new Error('context lost');
    });
    expect(() => core.stop()).not.toThrow();
    expect(vi.mocked(SequenceEngine)).toHaveBeenCalledWith(gl, core.kernel);
    expect(core.kernel.name).toBe('ts');
  });
});

describe('describeError / rendererName', () => {
  it('turns anything thrown into a message', () => {
    expect(describeError(new Error('boom'))).toBe('boom');
    expect(describeError('plain')).toBe('plain');
    expect(describeError(new Error('   '))).toBe('unknown error');
  });

  it('prefers the unmasked renderer, then RENDERER, then null', () => {
    const unmasked = {
      RENDERER: 1,
      getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 2 }),
      getParameter: (p: number) => (p === 2 ? 'SwiftShader' : 'WebKit WebGL'),
    } as unknown as SequenceGl;
    expect(rendererName(unmasked)).toBe('SwiftShader');
    const masked = {
      RENDERER: 1,
      getExtension: () => null,
      getParameter: () => 'WebKit WebGL',
    } as unknown as SequenceGl;
    expect(rendererName(masked)).toBe('WebKit WebGL');
    const broken = {
      getExtension: () => {
        throw new Error('lost');
      },
    } as unknown as SequenceGl;
    expect(rendererName(broken)).toBeNull();
  });
});
