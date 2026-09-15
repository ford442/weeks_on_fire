import type { SequenceEngine } from '../lib/webgl/engine';

export interface SequenceDrawContext {
  engine: SequenceEngine;
  timeSec: number;
  progress: number;
  durationSec: number;
  aspect: number;
}

export interface SequenceScene {
  init(engine: SequenceEngine): void;
  draw(ctx: SequenceDrawContext): void;
  dispose(): void;
}
