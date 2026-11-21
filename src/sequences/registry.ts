import { sequences } from '../data/sequences';

import { createScene, customSceneFactories } from './scenes';

import type { SequenceScene } from './types';

export const customRendererIds = Object.keys(customSceneFactories);

/** Looks the sequence up in the catalog, then builds its graph or custom scene. */
export function createSequenceScene(id: string): SequenceScene | undefined {
  const record = sequences.find((sequence) => sequence.id === id);
  return createScene({ id, graph: record?.graph });
}
