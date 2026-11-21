/**
 * Render worker entry: hosts `SequenceEngine` and the scene on a transferred `OffscreenCanvas`.
 * Loaded by `src/sequences/render/workerHost.ts`; messages are in `protocol.ts`.
 */
import { createRenderWorkerRuntime } from './runtime';

import type { MainToWorkerMessage, WorkerToMainMessage } from './protocol';

/** The slice of `DedicatedWorkerGlobalScope` used here (the app tsconfig has DOM, not WebWorker, types). */
interface WorkerGlobal {
  onmessage: ((event: MessageEvent<MainToWorkerMessage>) => void) | null;
  postMessage(message: WorkerToMainMessage): void;
  close(): void;
}

const scope = globalThis as unknown as WorkerGlobal;
const handle = createRenderWorkerRuntime({
  post: (message) => scope.postMessage(message),
  close: () => scope.close(),
});
scope.onmessage = (event) => handle(event.data);
