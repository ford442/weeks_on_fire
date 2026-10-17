import { daisyBellFrames } from './generated/daisy-bell';

import type { DaisyFrameTreatment } from './types';

export type {
  DaisyBellFrame,
  DaisyBellSight,
  DaisyBellSequenceBeat,
  DaisyFrameTreatment,
} from './types';
export { daisyTreatmentMeta } from './types';

export {
  daisyBellMeta,
  daisyBellAudioFile,
  daisyBellSubjectLock,
  daisyBellStylish1890s,
  daisyBellWorking1890s,
  daisyBellSequence,
  daisyBellSights,
  daisyBellFrames,
} from './generated/daisy-bell';

export function daisyFramesByTreatment(treatment: 'all' | DaisyFrameTreatment) {
  const sorted = [...daisyBellFrames].sort((a, b) => a.order - b.order);
  if (treatment === 'all') return sorted;
  return sorted.filter((frame) => frame.treatment === treatment);
}
