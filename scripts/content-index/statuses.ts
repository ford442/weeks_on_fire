/**
 * One production pipeline for every item on the hub (songs, stills, videos, cutaways, Timeline
 * scenes). Type (scene / song / image / video / character) is a separate field; this is only the
 * stage. Labels and colors live in `src/lib/status.ts`.
 *
 * Its own module, with no zod import, so the app can read the list without pulling the schema
 * library into every view that shows a status badge (`./schemas.ts` re-exports it).
 */
export const PRODUCTION_STATUSES = [
  'suggested',
  'ready-to-generate',
  'generated',
  'in-edit',
  'approved',
  'final',
] as const;
