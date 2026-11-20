/**
 * WebGL context factory for the 3D Sequences player.
 *
 * API: try `webgl2`, fall back to `webgl`. The engine is typed against WebGL1 so the fallback
 * stays real; its GLSL ES 1.00 shaders also compile on a WebGL2 context.
 *
 * | Attribute                      | Value                                | Why                                               |
 * | ------------------------------ | ------------------------------------ | ------------------------------------------------- |
 * | `antialias`                    | true; false on coarse pointer        | MSAA is costly on phones / tiled GPUs             |
 * | `alpha`                        | false                                | Opaque film frame                                 |
 * | `depth`                        | true                                 | Explicit; scenes depend on the depth buffer       |
 * | `stencil`                      | false                                | Unused                                            |
 * | `powerPreference`              | 'high-performance'; 'default' coarse | Phones/battery devices should not force the dGPU  |
 * | `failIfMajorPerformanceCaveat` | false                                | A slow context beats a blank canvas               |
 * | `preserveDrawingBuffer`        | false; true only for `capture`       | Playback never reads back; `?capture=1` flips it  |
 * | `desynchronized`               | unset                                | Optional experiment, never required               |
 *
 * Battery state is only available through the async, non-standard Battery API, so a coarse
 * pointer stands in as the "mobile / battery" signal.
 *
 * The canvas may be the page's `<canvas>` (in-thread player) or the `OffscreenCanvas` the render
 * worker received from `transferControlToOffscreen()`. A worker has no `matchMedia`, so the main
 * thread reads the environment with `readContextEnv()` and passes it in as `env`.
 */

export type SequenceGl = WebGLRenderingContext | WebGL2RenderingContext;

/** The page canvas, or the worker's transferred `OffscreenCanvas`. */
export type SequenceCanvas = HTMLCanvasElement | OffscreenCanvas;

/** Which context type the canvas actually got; published as the player's `data-gl` attribute. */
export type GlKind = 'webgl2' | 'webgl' | 'none';

export interface SequenceGlOptions {
  /**
   * Keep the drawing buffer so frames can be read back (`canvas.toDataURL()`, the e2e frame
   * harness, a MediaRecorder follow-on). Costs a copy per frame, so playback leaves it off; the
   * hub turns it on only for a `?capture=1` page load.
   */
  capture?: boolean;
  /**
   * Called with the browser's `statusMessage` for each `webglcontextcreationerror` raised while
   * trying to create a context. A null `getContext` alone says nothing about why.
   */
  onCreationError?: (statusMessage: string) => void;
  /**
   * Device signals for the attribute table. Read from `window` when omitted, which only works on
   * the main thread: the render worker is handed the main thread's `readContextEnv()`.
   */
  env?: ContextEnv;
}

export interface ContextEnv {
  coarsePointer: boolean;
}

export function buildContextAttributes(
  env: ContextEnv,
  opts: SequenceGlOptions = {},
): WebGLContextAttributes {
  return {
    alpha: false,
    antialias: !env.coarsePointer,
    depth: true,
    stencil: false,
    powerPreference: env.coarsePointer ? 'default' : 'high-performance',
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: opts.capture === true,
  };
}

/** Reads the attribute-table signals on the main thread (a worker has no `matchMedia`). */
export function readContextEnv(): ContextEnv {
  const coarsePointer =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  return { coarsePointer };
}

export function createSequenceGl(
  canvas: SequenceCanvas,
  opts: SequenceGlOptions = {},
): SequenceGl | null {
  const attributes = buildContextAttributes(opts.env ?? readContextEnv(), opts);
  const { onCreationError } = opts;
  const onError = (event: Event) => {
    const { statusMessage } = event as WebGLContextEvent;
    onCreationError?.(statusMessage || 'The browser did not say why.');
  };
  canvas.addEventListener('webglcontextcreationerror', onError);
  try {
    const gl2 = canvas.getContext('webgl2', attributes);
    if (gl2) return gl2;
    const gl1 = canvas.getContext('webgl', attributes);
    if (gl1 || isOffscreenCanvas(canvas)) return gl1;
    // `experimental-webgl` is an HTMLCanvasElement-only alias; OffscreenCanvas never had it.
    return canvas.getContext('experimental-webgl', attributes) as WebGLRenderingContext | null;
  } finally {
    canvas.removeEventListener('webglcontextcreationerror', onError);
  }
}

function isOffscreenCanvas(canvas: SequenceCanvas): canvas is OffscreenCanvas {
  return typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
}

/** Reports the real context type, so a silent WebGL1 fallback is visible rather than assumed. */
export function glKind(gl: SequenceGl | null): GlKind {
  if (!gl) return 'none';
  return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
    ? 'webgl2'
    : 'webgl';
}
