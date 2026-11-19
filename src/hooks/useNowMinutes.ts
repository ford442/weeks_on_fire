import { useEffect, useState } from 'react';

import { minutesOfDay } from '../lib/clock';

/**
 * Minutes since local midnight, refreshed while the page is open. State only changes when the
 * minute does, so a consumer re-renders once a minute, not once a tick.
 */
export function useNowMinutes(tickMs = 15_000): number {
  const [minutes, setMinutes] = useState(() => minutesOfDay(new Date()));

  useEffect(() => {
    const id = setInterval(() => setMinutes(minutesOfDay(new Date())), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return minutes;
}
