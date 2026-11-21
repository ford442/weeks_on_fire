import { createGraphScene } from '../graph/interpreter';

import type { SequenceGraph } from '../graph/types';
import type { SequenceScene } from '../types';

/**
 * Escape hatch: hand-written scenes for films the graph cannot express, keyed by
 * `renderer: "custom"` sequence ids (`'id': createFoo,`, one per line; codegen reads this file).
 *
 * Empty since graph v2: every film is a `content/sequences/<id>.graph.json`. Prefer extending the
 * graph (a node type, a deformer) over adding a factory here, so agents can keep authoring films
 * as data.
 */
export const customSceneFactories: Readonly<Record<string, () => SequenceScene>> = {};

/**
 * What a renderer needs to build a film: its id, and its graph when it has one. Plain data, so the
 * main thread can post it to the render worker, which never imports the sequence catalog.
 */
export interface SceneSource {
  id: string;
  graph?: SequenceGraph;
}

/** Graph-backed sequences play from their JSON; everything else needs a factory above. */
export function createScene(source: SceneSource): SequenceScene | undefined {
  if (source.graph) return createGraphScene(source.graph);
  return customSceneFactories[source.id]?.();
}
