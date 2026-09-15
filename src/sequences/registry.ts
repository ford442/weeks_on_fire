import type { SequenceScene } from './types';
import { createHoseChase } from './scenes/hoseChase';
import { createKickLattice } from './scenes/kickLattice';
import { createKitchenCounterOrbit } from './scenes/kitchenCounterOrbit';
import { createLatticeHymn } from './scenes/latticeHymn';
import { createMobiusChrome } from './scenes/mobiusChrome';
import { createRubberHoseErrand } from './scenes/rubberHoseErrand';
import { createScreenDoorRecessional } from './scenes/screenDoorRecessional';
import { createSpoonWhip } from './scenes/spoonWhip';
import { createTunnelSmash } from './scenes/tunnelSmash';

const factories: Record<string, () => SequenceScene> = {
  'lattice-hymn': createLatticeHymn,
  'rubber-hose-errand': createRubberHoseErrand,
  'kitchen-counter-orbit': createKitchenCounterOrbit,
  'mobius-chrome': createMobiusChrome,
  'screen-door-recessional': createScreenDoorRecessional,
  'kick-lattice': createKickLattice,
  'spoon-whip': createSpoonWhip,
  'tunnel-smash': createTunnelSmash,
  'hose-chase': createHoseChase,
};

export const sequenceRendererIds = Object.keys(factories);

export function createSequenceScene(id: string): SequenceScene | undefined {
  return factories[id]?.();
}
