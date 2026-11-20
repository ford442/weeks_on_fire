import type { GlKind } from '../../lib/webgl/context';
import type { SceneSource } from '../scenes';
import type { FrameStats } from './core';

/** Where frames are drawn: the render worker (default), or the page's own thread. */
export type RendererMode = 'worker' | 'main';

export interface RendererHostOptions {
  source: SceneSource;
  durationSec: number;
  /** Keep the drawing buffer (`?capture=1`). */
  capture: boolean;
}

export interface RendererInfo {
  kind: GlKind;
  /** As the created context reports it. */
  preserveDrawingBuffer: boolean;
  /** GPU string, capture runs only. */
  renderer: string | null;
  /** The `GeometryKernel` the renderer picked. */
  kernel: string;
}

export interface RendererFailure {
  kind: GlKind;
  reason: string | null;
  /**
   * True when the in-thread renderer may still work (any worker failure: no OffscreenCanvas GL,
   * a worker that would not load). False means show the failure overlay.
   */
  recoverable: boolean;
}

/**
 * Called by a host. `onReady` / `onFailure` may fire before the `create*Host` call returns (the
 * in-thread host creates its context synchronously), so callers must not depend on the host
 * object inside them.
 */
export interface RendererCallbacks {
  onReady(info: RendererInfo): void;
  onFailure(failure: RendererFailure): void;
  onContextLost(): void;
  onContextRestored(): void;
  onFrame(stats: FrameStats): void;
}

/** The player's handle on whichever thread draws. The film clock stays with the player. */
export interface RendererHost {
  readonly mode: RendererMode;
  /**
   * Draws `timeSec`. `continuous` is false after a seek, restart or loop wrap, so a scene that
   * integrates state knows not to integrate across the jump.
   */
  frame(timeSec: number, continuous: boolean): void;
  /** Drawing-buffer size; `dpr` is what the player used to compute it. */
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}
