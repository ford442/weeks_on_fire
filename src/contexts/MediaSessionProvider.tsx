import { useState, type ReactNode } from 'react';
import { createMediaCoordinator } from '../lib/mediaCoordinator';
import { MediaCoordinatorContext } from './MediaSessionContext';

export default function MediaSessionProvider({ children }: { children: ReactNode }) {
  const [coordinator] = useState(() => createMediaCoordinator());

  return (
    <MediaCoordinatorContext.Provider value={coordinator}>
      {children}
    </MediaCoordinatorContext.Provider>
  );
}
