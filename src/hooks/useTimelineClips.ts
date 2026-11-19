import { useEffect, useState } from 'react';

import { AVAILABLE_EPISODES, loadEpisodeProduction } from '../data/production';

import type { VideoSources } from '../lib/videos';

/**
 * Every scene in the committed `episodes/episode-NN/scenes.json` files, in episode order. These are
 * the repo's clips; a visitor's unsaved Timeline edits (localStorage) are deliberately not read.
 */
export function useTimelineClips(): VideoSources['timeline'] {
  const [clips, setClips] = useState<VideoSources['timeline']>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(AVAILABLE_EPISODES.map((episode) => loadEpisodeProduction(episode))).then(
      (productions) => {
        if (cancelled) return;
        setClips(
          productions.flatMap((production) =>
            (production?.scenes ?? []).map((scene) => ({
              episode: production?.episode ?? '',
              scene,
            })),
          ),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return clips;
}
