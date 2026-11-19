import { useMemo } from 'react';

import { filmScenes } from '../data/films';
import { sceneBoards } from '../data/sceneBoards';
import { cutawaySuggestions } from '../data/suggestions';
import { episodeWithSlot } from '../data/taxonomy';
import { buildVideoItems, type VideoItem } from '../lib/videos';

import { useTimelineClips } from './useTimelineClips';

const archive = filmScenes.map((scene) => ({
  id: scene.id,
  title: scene.title,
  mediaType: scene.mediaType,
  status: scene.status,
  episodeLabel: episodeWithSlot(scene.episode, scene.slot),
}));

/** Every video on the hub with a take, from the catalogs plus the committed Timeline files. */
export function useVideoItems(): VideoItem[] {
  const timeline = useTimelineClips();
  return useMemo(
    () => buildVideoItems({ scenes: sceneBoards, timeline, archive, cutaways: cutawaySuggestions }),
    [timeline],
  );
}
