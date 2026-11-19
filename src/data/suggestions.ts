import { CutawayRecordSchema } from '../../scripts/content-index/record-schemas';

import { cutawayStillPictures, cutawayStillUrls, cutawaySuggestions } from './generated/cutaways';
import { fetchRecord, prefetch, useRecord, type RecordSource } from './records';

import type { CutawaySuggestion } from './types';

export type {
  CutawaySegment,
  CutawaySuggestion,
  CutawaySummary,
  SightCandidate,
  SightLane,
  SuggestionKind,
} from './types';
export { cutawaySuggestions } from './generated/cutaways';

const cutawaySource: RecordSource<CutawaySuggestion> = {
  kind: 'cutaways',
  known: new Set(cutawaySuggestions.map((cutaway) => cutaway.id)),
  parse: (raw) => {
    const record = CutawayRecordSchema.parse(raw);
    return {
      ...record,
      // A repo still is a bundled asset; the JSON names it by path.
      segments: record.segments.map(({ stillImagePath, ...segment }) => {
        const stillUrl = segment.stillUrl ?? (stillImagePath && cutawayStillUrls[stillImagePath]);
        const stillPicture = stillImagePath ? cutawayStillPictures[stillImagePath] : undefined;
        return {
          ...segment,
          ...(stillUrl ? { stillUrl } : {}),
          ...(stillPicture ? { stillPicture } : {}),
        };
      }),
    };
  },
};

/** Full cutaway (segments, prompts, sight bank) from `public/catalog/cutaways/<id>.json`. */
export const loadCutaway = (id: string): Promise<CutawaySuggestion> =>
  fetchRecord(cutawaySource, id);
export const prefetchCutaway = (id: string): void => prefetch(cutawaySource, id);
export const useCutawayRecord = (id: string | undefined) => useRecord(cutawaySource, id);
