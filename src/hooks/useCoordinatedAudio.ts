import { useEffect } from 'react';

import { useMediaCoordinator } from '../contexts/MediaSessionContext';

import type { RefObject } from 'react';

/** Keeps one element playing at a time across the hub. Works for `<audio>` and `<video>` alike. */
export function useCoordinatedAudio(
  id: string,
  audioRef: RefObject<HTMLMediaElement | null>,
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
