import { describe, expect, it, vi } from 'vitest';

import { buildContextAttributes, createSequenceGl, glKind } from './context';
import { shouldAnimate } from './loop';
import { collectUniforms } from './program';

function fakeCanvas(available: string[], creationErrors: Record<string, string> = {}) {
  const requested: { type: string; attrs: unknown }[] = [];
  const listeners = new Set<(event: Event) => void>();
  const canvas = {
    getContext(type: string, attrs: unknown) {
      requested.push({ type, attrs });
      if (available.includes(type)) return { type };
      const statusMessage = creationErrors[type];
      if (statusMessage !== undefined) {
        for (const listener of listeners) listener({ statusMessage } as unknown as Event);
      }
      return null;
    },
    addEventListener(name: string, listener: (event: Event) => void) {
      if (name === 'webglcontextcreationerror') listeners.add(listener);
    },
    removeEventListener(name: string, listener: (event: Event) => void) {
      if (name === 'webglcontextcreationerror') listeners.delete(listener);
    },
  } as unknown as HTMLCanvasElement;
  return { canvas, requested, listeners };
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

  it('requests a preserved drawing buffer for capture and not otherwise', () => {
    const playback = fakeCanvas(['webgl2']);
    createSequenceGl(playback.canvas);
    expect(playback.requested[0]?.attrs).toMatchObject({ preserveDrawingBuffer: false });

    const capture = fakeCanvas(['webgl2']);
    createSequenceGl(capture.canvas, { capture: true });
    expect(capture.requested[0]?.attrs).toMatchObject({ preserveDrawingBuffer: true });
  });

  it('forwards each webglcontextcreationerror statusMessage', () => {
    const { canvas } = fakeCanvas([], {
      webgl2: 'Could not create a WebGL2 context, VENDOR = 0xffff',
      webgl: 'BindToCurrentSequence failed',
    });
    const messages: string[] = [];
    expect(createSequenceGl(canvas, { onCreationError: (m) => messages.push(m) })).toBeNull();
    expect(messages).toEqual([
      'Could not create a WebGL2 context, VENDOR = 0xffff',
      'BindToCurrentSequence failed',
    ]);
  });

  it('substitutes a message when the browser gives an empty statusMessage', () => {
    const { canvas } = fakeCanvas([], { webgl2: '' });
    const messages: string[] = [];
    createSequenceGl(canvas, { onCreationError: (m) => messages.push(m) });
    expect(messages).toEqual(['The browser did not say why.']);
  });

  it('detaches its listener even when getContext throws', () => {
    const { canvas, listeners } = fakeCanvas([]);
    canvas.getContext = () => {
      throw new Error('boom');
    };
    expect(() => createSequenceGl(canvas)).toThrow('boom');
    expect(listeners.size).toBe(0);
  });
});

describe('glKind', () => {
  it('is none without a context', () => {
    expect(glKind(null)).toBe('none');
  });

  it('is webgl for a context that is not WebGL2 (and under jsdom, which has no WebGL2)', () => {
    expect(glKind({} as WebGLRenderingContext)).toBe('webgl');
  });

  it('is webgl2 for a WebGL2 context', () => {
    class FakeWebGL2 {}
    vi.stubGlobal('WebGL2RenderingContext', FakeWebGL2);
    try {
      expect(glKind(new FakeWebGL2() as unknown as WebGL2RenderingContext)).toBe('webgl2');
      expect(glKind({} as WebGLRenderingContext)).toBe('webgl');
    } finally {
      vi.unstubAllGlobals();
    }
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
    const map = collectUniforms(gl, {});
    expect([...map.keys()]).toEqual(['uColor', 'uPts']);
    expect(calls).toEqual(['uColor', 'uPts[0]']);
  });
});
