import { episodeRecords } from './generated/episodes';

export type { EpisodeRecord, EpisodeStatus, EpisodeFiles } from './types';
export { episodeStatusMeta } from './types';

export const episodes = episodeRecords;
