import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useMediaCoordinator } from '../contexts/MediaSessionContext';

export function useCoordinatedAudio(
  id: string,
  audioRef: RefObject<HTMLAudioElement | null>,
  title: string,
  artist = 'Weeks on Fire',
): void {
  const coordinator = useMediaCoordinator();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      coordinator.activate(
        id,
        {
          play: () => audio.play(),
          pause: () => audio.pause(),
        },
        { title, artist },
      );
    };
    const onPauseOrEnded = () => coordinator.deactivate(id);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPauseOrEnded);
    audio.addEventListener('ended', onPauseOrEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPauseOrEnded);
      audio.removeEventListener('ended', onPauseOrEnded);
      coordinator.deactivate(id);
    };
  }, [artist, audioRef, coordinator, id, title]);
}
