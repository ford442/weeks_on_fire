import { createSequenceGl, glKind } from '../../lib/webgl/context';
import { selectGeometryKernel } from '../../lib/webgl/kernel';

import { SequenceRenderCore, rendererName } from './core';

import type { RendererCallbacks, RendererHost, RendererHostOptions } from './host';

const inert: Omit<RendererHost, 'mode'> = { frame() {}, resize() {}, dispose() {} };

/**
 * Draws on the page's thread: the fallback where `OffscreenCanvas` WebGL is missing (Safari
 * before 17), where the worker failed, and under `?renderer=main`. Same frame code as the worker.
 */
export function createInThreadHost(
  canvas: HTMLCanvasElement,
  options: RendererHostOptions,
  callbacks: RendererCallbacks,
): RendererHost {
  const creationErrors: string[] = [];
  const gl = createSequenceGl(canvas, {
    capture: options.capture,
    onCreationError: (message) => {
      if (!creationErrors.includes(message)) creationErrors.push(message);
    },
  });
  const kind = glKind(gl);
  if (!gl) {
    callbacks.onFailure({ kind, reason: creationErrors.join(' · ') || null, recoverable: false });
    return { mode: 'main', ...inert };
  }

  const kernel = selectGeometryKernel();
  const build = (): string | null => {
    const next = new SequenceRenderCore(gl, options.source, options.durationSec, kernel);
    const failure = next.start();
    core = failure === null ? next : null;
    return failure;
  };
  let core: SequenceRenderCore | null = null;
  let lost = false;
  let disposed = false;

  const startFailure = build();
  if (startFailure !== null) {
    callbacks.onFailure({ kind, reason: startFailure, recoverable: false });
    return { mode: 'main', ...inert };
  }

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    core?.stop();
    core = null;
    callbacks.onContextLost();
  };
  const onRestored = () => {
    if (disposed) return;
    const failure = build();
    if (failure !== null) {
      callbacks.onFailure({ kind, reason: failure, recoverable: false });
      return;
    }
    lost = false;
    callbacks.onContextRestored();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  callbacks.onReady({
    kind,
    preserveDrawingBuffer: gl.getContextAttributes()?.preserveDrawingBuffer ?? options.capture,
    renderer: options.capture ? rendererName(gl) : null,
    kernel: kernel.name,
  });

  return {
    mode: 'main',
    frame(timeSec) {
      if (lost || !core) return;
      const stats = core.draw(timeSec, canvas.width, canvas.height);
      if (stats) callbacks.onFrame(stats);
    },
    resize(width, height) {
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    },
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      core?.stop();
      core = null;
    },
  };
}
