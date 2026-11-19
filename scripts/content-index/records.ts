import {
  CUTAWAY_DETAIL_KEYS,
  CutawayRecordSchema,
  CutawaySummarySchema,
  omitKeys,
  SONG_DETAIL_KEYS,
  SongRecordSchema,
  SongSummarySchema,
  type CutawayFullRecord,
  type CutawaySummaryRecord,
  type SongRecord,
  type SongSummary,
} from './record-schemas';

import type { ParsedSong } from './load';
import type { CutawayRecord } from './schemas';

export interface RecordSet<Summary, Full> {
  summaries: Summary[];
  records: Full[];
}

/**
 * Splits each song into its bundled summary and its fetched record. Both go through the emitted
 * schemas, so codegen can never write a file the app would refuse to load.
 */
export function buildSongRecords(songs: readonly ParsedSong[]): RecordSet<SongSummary, SongRecord> {
  const records = songs.map((song) => {
    const { audioFile, ...rest } = song;
    return SongRecordSchema.parse({ ...rest, ...(audioFile ? { audioFile } : {}) });
  });
  return {
    records,
    summaries: records.map((record) => SongSummarySchema.parse(omitKeys(record, SONG_DETAIL_KEYS))),
  };
}

export function buildCutawayRecords(
  cutaways: readonly CutawayRecord[],
): RecordSet<CutawaySummaryRecord, CutawayFullRecord> & { stillPaths: string[] } {
  const records = cutaways.map((cutaway) => {
    const { segmentsSource, segmentStills, ...rest } = cutaway;
    void segmentsSource;
    void segmentStills;
    const segments = cutaway.segments ?? [];
    return CutawayRecordSchema.parse({
      ...rest,
      segments,
      segmentCount: segments.length,
      sightCount: cutaway.sightBank?.length ?? 0,
    });
  });
  return {
    records,
    summaries: records.map((record) =>
      CutawaySummarySchema.parse(omitKeys(record, CUTAWAY_DETAIL_KEYS)),
    ),
    stillPaths: records.flatMap((record) =>
      record.segments.flatMap((segment) =>
        segment.stillImagePath ? [segment.stillImagePath] : [],
      ),
    ),
  };
}
