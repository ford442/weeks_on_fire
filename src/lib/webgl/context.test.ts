import { describe, expect, it } from 'vitest';

import { buildContextAttributes, createSequenceGl } from './context';
import { shouldAnimate } from './loop';
import { collectUniforms } from './program';

function fakeCanvas(available: string[]) {
  const requested: { type: string; attrs: unknown }[] = [];
  const canvas = {
    getContext(type: string, attrs: unknown) {
      requested.push({ type, attrs });
      return available.includes(type) ? { type } : null;
    },
  } as unknown as HTMLCanvasElement;
  return { canvas, requested };
}

describe('buildContextAttributes', () => {
  it('uses a high-performance antialiased opaque context on desktop', () => {
    expect(buildContextAttributes({ coarsePointer: false })).toEqual({
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
    });
  });

  it('drops antialiasing and the high-performance hint on coarse pointers', () => {
    const attrs = buildContextAttributes({ coarsePointer: true });
    expect(attrs.antialias).toBe(false);
    expect(attrs.powerPreference).toBe('default');
  });

  it('preserves the drawing buffer only for capture', () => {
    expect(buildContextAttributes({ coarsePointer: false }, { capture: true })).toMatchObject({
      preserveDrawingBuffer: true,
    });
  });
});

describe('createSequenceGl', () => {
  it('prefers webgl2', () => {
    const { canvas, requested } = fakeCanvas(['webgl2', 'webgl']);
    expect(createSequenceGl(canvas)).toMatchObject({ type: 'webgl2' });
    expect(requested.map((r) => r.type)).toEqual(['webgl2']);
  });

  it('falls back to webgl with the same attributes', () => {
    const { canvas, requested } = fakeCanvas(['webgl']);
    expect(createSequenceGl(canvas)).toMatchObject({ type: 'webgl' });
    expect(requested.map((r) => r.type)).toEqual(['webgl2', 'webgl']);
    expect(requested[1]?.attrs).toEqual(requested[0]?.attrs);
  });

  it('returns null when nothing is available', () => {
    const { canvas } = fakeCanvas([]);
    expect(createSequenceGl(canvas)).toBeNull();
  });
});

describe('shouldAnimate', () => {
  const base = { playing: true, documentHidden: false, contextLost: false };
  it('ticks only while playing, visible and not lost', () => {
    expect(shouldAnimate(base)).toBe(true);
    expect(shouldAnimate({ ...base, playing: false })).toBe(false);
    expect(shouldAnimate({ ...base, documentHidden: true })).toBe(false);
    expect(shouldAnimate({ ...base, contextLost: true })).toBe(false);
  });
});

describe('collectUniforms', () => {
  it('resolves each active uniform once, stripping array suffixes', () => {
    const calls: string[] = [];
    const gl = {
      ACTIVE_UNIFORMS: 1,
      getProgramParameter: () => 2,
      getActiveUniform: (_p: unknown, i: number) => ({ name: i === 0 ? 'uColor' : 'uPts[0]' }),
      getUniformLocation: (_p: unknown, name: string) => {
        calls.push(name);
        return { name };
      },
    } as unknown as WebGLRenderingContext;
    const map = collectUniforms(gl, {} as WebGLProgram);
    expect([...map.keys()]).toEqual(['uColor', 'uPts']);
    expect(calls).toEqual(['uColor', 'uPts[0]']);
  });
});
