import { createGraphScene } from '../graph/interpreter';

import { createHoseChase } from './hoseChase';
import { createKickLattice } from './kickLattice';
import { createKitchenCounterOrbit } from './kitchenCounterOrbit';
import { createMobiusChrome } from './mobiusChrome';
import { createRubberHoseErrand } from './rubberHoseErrand';
import { createScreenDoorRecessional } from './screenDoorRecessional';
import { createSpoonWhip } from './spoonWhip';
import { createTunnelSmash } from './tunnelSmash';

import type { SequenceGraph } from '../graph/types';
import type { SequenceScene } from '../types';

/** Hand-written scenes for films that need their own deformers. Keys are `renderer: "custom"` ids. */
export const customSceneFactories: Readonly<Record<string, () => SequenceScene>> = {
  'rubber-hose-errand': createRubberHoseErrand,
  'kitchen-counter-orbit': createKitchenCounterOrbit,
  'mobius-chrome': createMobiusChrome,
  'screen-door-recessional': createScreenDoorRecessional,
  'kick-lattice': createKickLattice,
  'spoon-whip': createSpoonWhip,
  'tunnel-smash': createTunnelSmash,
  'hose-chase': createHoseChase,
};

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
