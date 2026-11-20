import { createSequenceGl, glKind, type GlKind, type SequenceGl } from '../../lib/webgl/context';
import { selectGeometryKernel } from '../../lib/webgl/kernel';
import { SequenceRenderCore, describeError, rendererName } from '../render/core';

import type { MainToWorkerMessage, WorkerToMainMessage } from './protocol';

export interface RenderWorkerScope {
  post(message: WorkerToMainMessage): void;
  /** Ends the worker after `dispose`. */
  close(): void;
}

/**
 * The render worker's message handler, apart from `self` so it can be tested in Node. One
 * runtime draws one film on one transferred canvas; the player starts a new worker per film.
 */
export function createRenderWorkerRuntime(
  scope: RenderWorkerScope,
): (message: MainToWorkerMessage) => void {
  let canvas: OffscreenCanvas | null = null;
  let gl: SequenceGl | null = null;
  let kind: GlKind = 'none';
  let core: SequenceRenderCore | null = null;
  let lost = false;
  let failed = false;
  let removeListeners = () => {};

  const fail = (stage: 'context' | 'scene', reason: string | null) => {
    failed = true;
    core?.stop();
    core = null;
    scope.post({ type: 'failed', kind, stage, reason });
  };

  const draw = (timeSec: number) => {
    if (!canvas || !core || lost || failed) return null;
    try {
      return core.draw(timeSec, canvas.width, canvas.height);
    } catch (error) {
      console.error('render worker: draw failed', error);
      fail('scene', describeError(error));
      return null;
    }
  };

  return (message) => {
    switch (message.type) {
      case 'init': {
        if (canvas) return;
        canvas = message.canvas;
        if (canvas.width !== message.width) canvas.width = message.width;
        if (canvas.height !== message.height) canvas.height = message.height;

        const creationErrors: string[] = [];
        gl = createSequenceGl(canvas, {
          capture: message.capture,
          env: message.env,
          onCreationError: (statusMessage) => {
            if (!creationErrors.includes(statusMessage)) creationErrors.push(statusMessage);
          },
        });
        kind = glKind(gl);
        if (!gl) {
          fail('context', creationErrors.join(' · ') || null);
          return;
        }

        const source = { id: message.sequenceId, graph: message.graph };
        const kernel = selectGeometryKernel();
        const build = () => {
          if (!gl) return 'no context';
          const next = new SequenceRenderCore(gl, source, message.durationSec, kernel);
          const failure = next.start();
          core = failure === null ? next : null;
          return failure;
        };
        const startFailure = build();
        if (startFailure !== null) {
          fail('scene', startFailure);
          return;
        }

        const target = canvas;
        const onLost = (event: Event) => {
          // Without preventDefault the browser never offers a restore.
          event.preventDefault();
          lost = true;
          core?.stop();
          core = null;
          scope.post({ type: 'contextLost' });
        };
        const onRestored = () => {
          if (failed) return;
          const failure = build();
          if (failure !== null) {
            fail('scene', failure);
            return;
          }
          lost = false;
          scope.post({ type: 'contextRestored' });
        };
        target.addEventListener('webglcontextlost', onLost);
        target.addEventListener('webglcontextrestored', onRestored);
        removeListeners = () => {
          target.removeEventListener('webglcontextlost', onLost);
          target.removeEventListener('webglcontextrestored', onRestored);
        };

        const attributes = gl.getContextAttributes();
        scope.post({
          type: 'ready',
          kind,
          preserveDrawingBuffer: attributes?.preserveDrawingBuffer ?? message.capture,
          renderer: message.capture ? rendererName(gl) : null,
          kernel: kernel.name,
        });
        return;
      }
      case 'tick':
      case 'seek':
        scope.post({ type: 'frameStats', stats: draw(message.timeSec) });
        return;
      case 'resize':
        if (!canvas) return;
        if (canvas.width !== message.width) canvas.width = message.width;
        if (canvas.height !== message.height) canvas.height = message.height;
        return;
      case 'dispose':
        removeListeners();
        core?.stop();
        core = null;
        // Hand the GPU memory back now rather than whenever the worker is collected.
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        gl = null;
        canvas = null;
        scope.close();
        return;
    }
  };
}
