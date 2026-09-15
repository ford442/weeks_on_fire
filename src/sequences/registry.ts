import type { SequenceScene } from './types';
import { createKitchenCounterOrbit } from './scenes/kitchenCounterOrbit';
import { createLatticeHymn } from './scenes/latticeHymn';
import { createMobiusChrome } from './scenes/mobiusChrome';
import { createRubberHoseErrand } from './scenes/rubberHoseErrand';
import { createScreenDoorRecessional } from './scenes/screenDoorRecessional';

const factories: Record<string, () => SequenceScene> = {
  'lattice-hymn': createLatticeHymn,
  'rubber-hose-errand': createRubberHoseErrand,
  'kitchen-counter-orbit': createKitchenCounterOrbit,
  'mobius-chrome': createMobiusChrome,
  'screen-door-recessional': createScreenDoorRecessional,
};

export const sequenceRendererIds = Object.keys(factories);

export function createSequenceScene(id: string): SequenceScene | undefined {
  return factories[id]?.();
}
