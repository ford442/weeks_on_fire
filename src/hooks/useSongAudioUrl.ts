import { useEffect, useState } from 'react';

/**
 * The served mp3 for a song id, or undefined while it resolves or when the song has no audio yet.
 * The song index is imported on demand, so a view that only needs one URL (a cutaway preview) does
 * not bundle every song summary.
 */
export function useSongAudioUrl(songId: string | undefined): string | undefined {
  const [resolved, setResolved] = useState<{ songId: string; url: string | undefined }>();

  useEffect(() => {
    if (!songId) return;
    let cancelled = false;
    void Promise.all([import('../data/songs'), import('../lib/songAudio')]).then(
      ([{ songs }, { songAudioUrl }]) => {
        if (cancelled) return;
        const file = songs.find((song) => song.id === songId)?.audioFile;
        setResolved({ songId, url: file ? songAudioUrl(file) : undefined });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [songId]);

  return resolved && resolved.songId === songId ? resolved.url : undefined;
}
