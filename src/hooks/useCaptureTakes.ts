import { useSyncExternalStore } from 'react';

import { getTakes, subscribeTakes, type CaptureTake } from '../lib/capture/takes';

/** Takes recorded in this tab, newest first (session only; see `src/lib/capture/takes.ts`). */
export function useCaptureTakes(): readonly CaptureTake[] {
  return useSyncExternalStore(subscribeTakes, getTakes, getTakes);
}
