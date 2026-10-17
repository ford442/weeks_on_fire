import { useCallback, useEffect, useState } from 'react';

import { loadSongAudioUrl } from '../lib/songAudio';

export function useSongAudio(filename: string | undefined) {
  const [url, setUrl] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUrl(undefined);
    setLoading(false);
  }, [filename]);

  const load = useCallback(async () => {
    if (!filename) return undefined;
    if (url) return url;

    setLoading(true);
    try {
      const resolved = await loadSongAudioUrl(filename);
      setUrl(resolved);
      return resolved;
    } finally {
      setLoading(false);
    }
  }, [filename, url]);

  return { url, loading, load };
}
