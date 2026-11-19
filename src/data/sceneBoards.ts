import { sceneBoards } from './generated/scene-boards';

import type { SceneBoard, SceneFrame, SceneTreatment } from './types';

export type { SceneBoard, SceneFrame, SceneTreatment, SceneVideo } from './types';
export { sceneToneMeta } from './types';
export { sceneBoards };

export function sceneBoardById(id: string): SceneBoard | undefined {
  return sceneBoards.find((board) => board.id === id);
}

export function framesByTreatment(board: SceneBoard, treatment: string | null): SceneFrame[] {
  const sorted = [...board.frames].sort((a, b) => a.order - b.order);
  return treatment === null ? sorted : sorted.filter((frame) => frame.treatment === treatment);
}

/**
 * Treatments some keyframe is actually shot in, in the board's own order. A treatment only a
 * sequence beat uses (Daisy Bell's "flip") is a label, not something to filter the board by.
 */
export function framedTreatments(board: SceneBoard): SceneTreatment[] {
  const used = new Set(board.frames.map((frame) => frame.treatment));
  return board.treatments.filter((treatment) => used.has(treatment.id));
}

/** A board's first keyframe that has a still, for list thumbnails. */
export function sceneBoardCover(board: SceneBoard): SceneFrame | undefined {
  return [...board.frames].sort((a, b) => a.order - b.order).find((frame) => frame.imageUrl);
}
