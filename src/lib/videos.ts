import { crewPath, viewPaths } from '../routes/paths';

import { isFinalized, PRODUCTION_STATUSES } from './status';

import type { ProductionStatus } from './status';

/** Where a video record is authored. Each source keeps its own page; this list only gathers them. */
export type VideoSource = 'scene' | 'timeline' | 'archive' | 'cutaway';

export const VIDEO_SOURCES: readonly VideoSource[] = ['scene', 'timeline', 'archive', 'cutaway'];

export const videoSourceLabel: Record<VideoSource, string> = {
  scene: 'Scene videos',
  timeline: 'Timeline clips',
  archive: 'Archive clips',
  cutaway: 'Cutaways',
};

export interface VideoItem {
  key: string;
  title: string;
  source: VideoSource;
  status: ProductionStatus;
  /** One line of provenance, e.g. "Scene · Daisy Bell · slideshow · ~4:20". */
  context: string;
  /** Where the file or page is hosted, when it is linked. Large video is never committed. */
  url?: string;
  /** In-app page that owns the record. */
  to: string;
  note?: string;
}

/** The slice of each catalog this list reads, so tests can pass plain objects. */
export interface VideoSources {
  scenes: ReadonlyArray<{
    id: string;
    title: string;
    videos: ReadonlyArray<{
      id: string;
      title: string;
      kind: 'slideshow' | 'clip';
      url: string;
      status: ProductionStatus;
      runtime?: string | undefined;
      note?: string | undefined;
    }>;
  }>;
  /** Committed Timeline scenes, tagged with the episode file they came from. */
  timeline: ReadonlyArray<{
    episode: string;
    scene: {
      id: string;
      title: string;
      timestamp: string;
      status: ProductionStatus;
      mediaUrl?: string | undefined;
    };
  }>;
  archive: ReadonlyArray<{
    id: string;
    title: string;
    mediaType: 'image' | 'video';
    status: ProductionStatus;
    episodeLabel: string;
  }>;
  cutaways: ReadonlyArray<{
    id: string;
    title: string;
    status: ProductionStatus;
    episode: string;
    runtime: string;
  }>;
}

const NOT_YET: readonly ProductionStatus[] = ['suggested', 'ready-to-generate'];

/** A take exists: the item is past the idea stages, or it already has a file to open. */
export function hasTake(item: Pick<VideoItem, 'status' | 'url'>): boolean {
  return item.url !== undefined || !NOT_YET.includes(item.status);
}

/** `.mp4` and friends: files a `<video>` can play. Anything else is a page to open. */
export function isDirectVideoUrl(url: string): boolean {
  return /\.(?:mp4|m4v|webm|ogv|mov)(?:[?#].*)?$/i.test(url);
}

const stage = (status: ProductionStatus) => PRODUCTION_STATUSES.indexOf(status);

/**
 * Every video-shaped record across the hub that has a take, finished work first. A Timeline scene,
 * an archive clip or a cutaway that is still an idea is not a video yet and stays on its own page.
 */
export function buildVideoItems(sources: VideoSources): VideoItem[] {
  const items: VideoItem[] = [
    ...sources.scenes.flatMap((scene) =>
      scene.videos.map((video): VideoItem => ({
        key: `scene:${scene.id}:${video.id}`,
        title: `${scene.title} — ${video.title}`,
        source: 'scene',
        status: video.status,
        context: ['Scene', scene.title, video.kind, video.runtime].filter(Boolean).join(' · '),
        url: video.url,
        to: crewPath(`/scenes/${scene.id}`),
        ...(video.note ? { note: video.note } : {}),
      })),
    ),
    ...sources.timeline.map(({ episode, scene }): VideoItem => ({
      key: `timeline:${episode}:${scene.id}`,
      title: scene.title,
      source: 'timeline',
      status: scene.status,
      context: `Timeline · Episode ${episode} · ${scene.timestamp}`,
      ...(scene.mediaUrl ? { url: scene.mediaUrl } : {}),
      to: viewPaths.timeline,
    })),
    ...sources.archive
      .filter((entry) => entry.mediaType === 'video')
      .map((entry): VideoItem => ({
        key: `archive:${entry.id}`,
        title: entry.title,
        source: 'archive',
        status: entry.status,
        context: `Visual archive · ${entry.episodeLabel}`,
        to: `${viewPaths.gallery}?q=${encodeURIComponent(entry.title)}`,
      })),
    ...sources.cutaways.map((cutaway): VideoItem => ({
      key: `cutaway:${cutaway.id}`,
      title: cutaway.title,
      source: 'cutaway',
      status: cutaway.status,
      context: `Cutaway · ${cutaway.episode} · ${cutaway.runtime}`,
      to: crewPath(`/suggestions/${cutaway.id}`),
    })),
  ];

  // Array.prototype.sort is stable, so equal stages keep their source order.
  return items.filter(hasTake).sort((a, b) => stage(b.status) - stage(a.status));
}

/** What the Finalized view shows under Video: the same list, Approved and Final only. */
export function finalizedVideoItems(items: readonly VideoItem[]): VideoItem[] {
  return items.filter((item) => isFinalized(item.status));
}
