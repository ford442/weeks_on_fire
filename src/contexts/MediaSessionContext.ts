import { createContext, useContext } from 'react';
import type { MediaCoordinator } from '../lib/mediaCoordinator';

export const MediaCoordinatorContext = createContext<MediaCoordinator | null>(null);

export function useMediaCoordinator(): MediaCoordinator {
  const coordinator = useContext(MediaCoordinatorContext);
  if (!coordinator) {
    throw new Error('useMediaCoordinator must be used within a MediaSessionProvider');
  }
  return coordinator;
}
