import { SequenceEngine } from '../../lib/webgl/engine';
import { createScene, type SceneSource } from '../scenes';

import type { SequenceGl } from '../../lib/webgl/context';
import type { SequenceScene } from '../types';

/** One drawn frame, measured on the thread that drew it (the render worker, or the page). */
export interface FrameStats {
  /** Film time the frame shows, seconds. */
  timeSec: number;
  /** Wall time of the scene's `draw` (JS plus GL command submission), milliseconds. */
  cpuMs: number;
  /** `drawArrays` / `drawElements` calls, instanced or not. */
  drawCalls: number;
  /** Objects drawn: one per plain draw, one per instance of an instanced draw. */
  instances: number;
  /** `uniform*` calls, including the per-frame block on WebGL1. */
  uniformCalls: number;
  /** `bufferData` / `bufferSubData` calls: particle rewrites, instance data, the frame block. */
  bufferUploads: number;
  /** Drawing-buffer size the frame was drawn at. */
  width: number;
  height: number;
}

export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.trim() || 'unknown error';
}

/**
 * Engine plus scene for one film on one GL context. Has no DOM or worker dependency, so the
 * in-thread player and the render worker run exactly the same frame code.
 *
 * After a context loss, `stop()` and build a new core on the restored context: every GL object
 * from before the loss is gone.
 */
export class SequenceRenderCore {
  private engine: SequenceEngine | null = null;
  private scene: SequenceScene | undefined;

  constructor(
    private readonly gl: SequenceGl,
    private readonly source: SceneSource,
    private readonly durationSec: number,
  ) {}

  /** Compiles programs and builds the scene. Returns why it could not (shader log...), or null. */
  start(): string | null {
    let engine: SequenceEngine | null = null;
    let scene: SequenceScene | undefined;
    try {
      engine = new SequenceEngine(this.gl);
      scene = createScene(this.source);
      scene?.init(engine);
      this.engine = engine;
      this.scene = scene;
      return null;
    } catch (error) {
      console.error(`SequencePlayer: could not start "${this.source.id}"`, error);
      release(scene, engine);
      return describeError(error);
    }
  }

  stop(): void {
    release(this.scene, this.engine);
    this.engine = null;
    this.scene = undefined;
  }

  /** Draws `timeSec` into a `width` x `height` buffer; null when there is nothing to draw. */
  draw(timeSec: number, width: number, height: number): FrameStats | null {
    const { engine, scene } = this;
    if (!engine || !scene || width <= 0 || height <= 0) return null;
    engine.beginFrame();
    const start = performance.now();
    scene.draw({
      engine,
      timeSec,
      progress: this.durationSec > 0 ? timeSec / this.durationSec : 0,
      durationSec: this.durationSec,
      aspect: width / height,
    });
    const cpuMs = performance.now() - start;
    return { timeSec, cpuMs, ...engine.stats, width, height };
  }
}

function release(scene: SequenceScene | undefined, engine: SequenceEngine | null): void {
  try {
    scene?.dispose();
    engine?.dispose();
  } catch {
    // GL objects are already gone after a context loss, or init failed half way.
  }
}

/** The GPU string for capture runs and `?stats`; the masked `RENDERER` when the unmasked one is hidden. */
export function rendererName(gl: SequenceGl): string | null {
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name: unknown = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    return typeof name === 'string' && name ? name : null;
  } catch {
    return null;
  }
}
