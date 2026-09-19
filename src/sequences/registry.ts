import { sequences } from '../data/sequences';
import { createGraphScene } from './graph/interpreter';
import type { SequenceScene } from './types';
import { createHoseChase } from './scenes/hoseChase';
import { createKickLattice } from './scenes/kickLattice';
import { createKitchenCounterOrbit } from './scenes/kitchenCounterOrbit';
import { createMobiusChrome } from './scenes/mobiusChrome';
import { createRubberHoseErrand } from './scenes/rubberHoseErrand';
import { createScreenDoorRecessional } from './scenes/screenDoorRecessional';
import { createSpoonWhip } from './scenes/spoonWhip';
import { createTunnelSmash } from './scenes/tunnelSmash';

/** Hand-written scenes for films that need their own deformers. Keys are `renderer: "custom"` ids. */
const factories: Record<string, () => SequenceScene> = {
  'rubber-hose-errand': createRubberHoseErrand,
  'kitchen-counter-orbit': createKitchenCounterOrbit,
  'mobius-chrome': createMobiusChrome,
  'screen-door-recessional': createScreenDoorRecessional,
  'kick-lattice': createKickLattice,
  'spoon-whip': createSpoonWhip,
  'tunnel-smash': createTunnelSmash,
  'hose-chase': createHoseChase,
};

export const customRendererIds = Object.keys(factories);

/** Graph-backed sequences play from their JSON; everything else needs a factory above. */
export function createSequenceScene(id: string): SequenceScene | undefined {
  const record = sequences.find((sequence) => sequence.id === id);
  if (record?.graph) return createGraphScene(record.graph);
  return factories[id]?.();
}
