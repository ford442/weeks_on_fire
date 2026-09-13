// Production timeline data models for weeks_on_fire
// These map directly to episodes/<episode>/scenes.json
// Git-friendly structured data with full change history.
//
// Types and runtime validation both come from the shared Zod contract in
// src/schemas/production.ts — do not redefine these shapes here.

import {
  ClipStackerPayloadSchema,
  EpisodeProductionSchema,
  ProductionSceneSchema,
} from '../schemas/production';
import type {
  ClipStackerClip,
  ClipStackerPayload,
  EpisodeHistoryEntry,
  EpisodeProduction,
  ProductionScene,
  SceneHistoryEntry,
  SceneStatus,
} from '../schemas/production';

export type {
  ClipStackerClip,
  ClipStackerPayload,
  EpisodeHistoryEntry,
  EpisodeProduction,
  ProductionScene,
  SceneHistoryEntry,
  SceneStatus,
};

export const AVAILABLE_EPISODES = ['01', '02', '03', '04'] as const;
export type EpisodeId = (typeof AVAILABLE_EPISODES)[number];

const episodeLoaders = import.meta.glob<{ default: EpisodeProduction }>(
  '../../episodes/episode-*/scenes.json',
);

const committedCache = new Map<string, EpisodeProduction>();

function episodeJsonPath(episode: string): string {
  return `../../episodes/episode-${episode}/scenes.json`;
}

export function isValidProductionScene(data: unknown): data is ProductionScene {
  return ProductionSceneSchema.safeParse(data).success;
}

export function isValidEpisodeProduction(data: unknown): data is EpisodeProduction {
  return EpisodeProductionSchema.safeParse(data).success;
}

export function isClipStackerPayload(data: unknown): data is ClipStackerPayload {
  return ClipStackerPayloadSchema.safeParse(data).success;
}

async function loadCommittedEpisode(episode: string): Promise<EpisodeProduction | null> {
  const cached = committedCache.get(episode);
  if (cached) {
    return structuredClone(cached);
  }

  const loader = episodeLoaders[episodeJsonPath(episode)];
  if (!loader) return null;

  const mod = await loader();
  const data = mod.default ?? (mod as unknown as EpisodeProduction);
  if (!isValidEpisodeProduction(data)) return null;

  committedCache.set(episode, data);
  return structuredClone(data);
}

export async function loadEpisodeProduction(episode: string): Promise<EpisodeProduction | null> {
  return loadCommittedEpisode(episode);
}

export function getEpisodeProductionSync(episode: string): EpisodeProduction | null {
  const cached = committedCache.get(episode);
  if (!cached) return null;
  return structuredClone(cached);
}

export function exportToClipStacker(production: EpisodeProduction): ClipStackerPayload {
  return {
    project: production.title,
    version: 'weeks_on_fire_v1',
    exportedAt: new Date().toISOString(),
    clips: production.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      timestamp: scene.timestamp,
      order: scene.order,
      status: scene.status,
      mediaUrl: scene.mediaUrl || null,
      description: scene.description,
    })),
    episodeHistory: production.episodeHistory,
  };
}

export function clipStackerToProduction(
  payload: ClipStackerPayload,
  episode: string,
  baseline?: EpisodeProduction | null,
): EpisodeProduction {
  const now = new Date().toISOString();
  const existingById = new Map((baseline?.scenes ?? []).map((scene) => [scene.id, scene]));

  const scenes = payload.clips
    .map((clip) => {
      const existing = existingById.get(clip.id);
      if (existing) {
        return {
          ...existing,
          title: clip.title,
          timestamp: clip.timestamp,
          order: clip.order,
          status: clip.status,
          mediaUrl: clip.mediaUrl ?? '',
          description: clip.description,
          lastEditedAt: now,
          history: [
            ...existing.history,
            {
              date: now,
              action: 'edited',
              note: 'Imported from clip_stacker',
            },
          ],
        };
      }

      const created = createEmptyScene(clip.order);
      return {
        ...created,
        id: clip.id,
        title: clip.title,
        timestamp: clip.timestamp,
        order: clip.order,
        status: clip.status,
        mediaUrl: clip.mediaUrl ?? '',
        description: clip.description,
        lastEditedAt: now,
        history: [
          {
            date: now,
            action: 'added',
            note: 'Imported from clip_stacker',
          },
        ],
      };
    })
    .sort((a, b) => a.order - b.order);

  return {
    episode,
    title: payload.project,
    lastUpdated: now,
    scenes,
    episodeHistory: payload.episodeHistory,
  };
}

// Create a new empty scene template
export function createEmptyScene(order: number): ProductionScene {
  const now = new Date().toISOString();
  return {
    id: `scene-${String(order).padStart(3, '0')}`,
    order,
    title: 'New Scene',
    timestamp: '00:00:00',
    description: '',
    prompt: '',
    mediaUrl: '',
    status: 'draft',
    addedAt: now,
    lastEditedAt: now,
    history: [
      {
        date: now,
        action: 'added',
        note: 'Created in Timeline editor',
      },
    ],
  };
}

// Append a history entry and bump timestamps
export function appendSceneHistory(
  scene: ProductionScene,
  action: string,
  note: string,
): ProductionScene {
  const now = new Date().toISOString();
  return {
    ...scene,
    lastEditedAt: now,
    history: [
      ...scene.history,
      {
        date: now,
        action,
        note,
      },
    ],
  };
}

export function updateSceneStatus(
  scene: ProductionScene,
  newStatus: SceneStatus,
  note?: string,
): ProductionScene {
  if (scene.status === newStatus) return scene;
  const now = new Date().toISOString();
  return {
    ...scene,
    status: newStatus,
    lastEditedAt: now,
    history: [
      ...scene.history,
      {
        date: now,
        action: 'status-changed',
        note: note || `Status changed to ${newStatus}`,
      },
    ],
  };
}

// Flatten all events for a production timeline (most recent first)
export function flattenTimeline(production: EpisodeProduction) {
  const events: Array<{
    id: string;
    date: string;
    type: 'episode' | 'scene';
    sceneId?: string;
    sceneTitle?: string;
    action: string;
    note: string;
  }> = [];

  // Episode level
  production.episodeHistory.forEach((entry, idx) => {
    events.push({
      id: `ep-${idx}`,
      date: entry.date,
      type: 'episode',
      action: entry.action,
      note: entry.note,
    });
  });

  // Per-scene
  production.scenes.forEach((scene) => {
    scene.history.forEach((entry, idx) => {
      events.push({
        id: `${scene.id}-h${idx}`,
        date: entry.date,
        type: 'scene',
        sceneId: scene.id,
        sceneTitle: scene.title,
        action: entry.action,
        note: entry.note,
      });
    });
  });

  // Sort newest first
  return events.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Status badge colors (Tailwind classes)
export const statusColors: Record<SceneStatus, string> = {
  draft: 'bg-zinc-700 text-zinc-200',
  generated: 'bg-sky-900 text-sky-200',
  approved: 'bg-emerald-900 text-emerald-200',
  'in-edit': 'bg-amber-900 text-amber-200',
  final: 'bg-orange-700 text-orange-100',
};
