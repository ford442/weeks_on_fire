import { z } from 'zod';

export const SongFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  genre: z.string().min(1),
  description: z.string().min(1),
  episode: z.string().min(1),
  tags: z.array(z.string()),
  instrumental: z.boolean().optional(),
  audioFile: z.string().nullable().optional(),
});

export const CutawaySegmentSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  start: z.string(),
  end: z.string(),
  durationSec: z.number(),
  onScreen: z.string(),
  lyrics: z.string(),
  musicCue: z.string(),
  grokImaginePrompt: z.string(),
  geminiOmniPrompt: z.string(),
  promptVariations: z.array(z.string()),
  stillUrl: z.string().optional(),
  stillImagePath: z.string().optional(),
});

export const SightCandidateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  lane: z.enum(['fall', 'ending']),
  prompt: z.string().min(1),
  description: z.string().min(1),
});

export const CutawaySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['musical', 'gag', 'scene']),
  title: z.string().min(1),
  status: z.enum(['suggested', 'ready-to-generate', 'in-production']),
  runtime: z.string(),
  episode: z.string(),
  songId: z.string(),
  songTitle: z.string(),
  summary: z.string(),
  visualArc: z.string(),
  tags: z.array(z.string()),
  segmentsSource: z.string().optional(),
  segmentStills: z.record(z.string(), z.string()).optional(),
  segments: z.array(CutawaySegmentSchema).optional(),
  sightBank: z.array(SightCandidateSchema).optional(),
});

export const FilmSceneSchema = z.object({
  id: z.string().min(1),
  imageKind: z.enum(['scene', 'suggestion', 'test', 'character']),
  episode: z.string(),
  title: z.string(),
  prompt: z.string(),
  promptVariations: z.array(z.string()),
  imagePath: z.string().optional(),
  mediaType: z.enum(['image', 'video']),
  musicCue: z.string(),
  musicStyle: z.string(),
  description: z.string(),
  theme: z.string(),
  tags: z.array(z.string()),
});

export const SeriesCharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  nameNote: z.string().optional(),
  role: z.string(),
  episodes: z.array(z.string()),
  traits: z.array(z.string()),
  bio: z.string(),
  props: z.array(z.string()),
  tags: z.array(z.string()),
  imagePath: z.string().optional(),
});

export const DaisyBellFrameSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  treatment: z.enum(['color', 'period']),
  beat: z.string(),
  description: z.string(),
  prompt: z.string(),
  imagePath: z.string().optional(),
  tags: z.array(z.string()),
});

export const DaisyBellSightSchema = z.object({
  id: z.string(),
  lyricCue: z.string().nullable(),
  title: z.string(),
  description: z.string(),
});

export const DaisyBellSequenceBeatSchema = z.object({
  id: z.string(),
  step: z.number(),
  title: z.string(),
  treatment: z.enum(['color', 'period', 'flip']),
  summary: z.string(),
});

export const DaisyBellSchema = z.object({
  meta: z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    duo: z.string(),
    audioFile: z.string(),
    conceptFile: z.string(),
    slideshowUrl: z.string(),
    pitch: z.string(),
    constant: z.string(),
  }),
  subjectLock: z.string(),
  stylish1890s: z.string(),
  working1890s: z.string(),
  sequence: z.array(DaisyBellSequenceBeatSchema),
  sights: z.array(DaisyBellSightSchema),
  frames: z.array(DaisyBellFrameSchema),
});

export const StaffRoleSchema = z.enum([
  'Writer',
  'Producer',
  'Director',
  'Music Supervisor',
  'Visual Designer',
]);

export const StaffMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: StaffRoleSchema,
  location: z.string().min(1),
  yearsOnSeries: z.string().min(1),
  specialty: z.string().min(1),
  bio: z.string().min(1),
  quote: z.string().min(1),
  credits: z.array(z.string()),
  /** Filename under public/cast/ (copied to dist/cast on Vite build). */
  imageFile: z.string().min(1),
});

export type SongFrontmatter = z.infer<typeof SongFrontmatterSchema>;
export type CutawaySegment = z.infer<typeof CutawaySegmentSchema>;
export type SightCandidate = z.infer<typeof SightCandidateSchema>;
export type CutawayRecord = z.infer<typeof CutawaySchema>;
export type FilmSceneRecord = z.infer<typeof FilmSceneSchema>;
export type SeriesCharacterRecord = z.infer<typeof SeriesCharacterSchema>;
export type DaisyBellRecord = z.infer<typeof DaisyBellSchema>;
export type StaffMemberRecord = z.infer<typeof StaffMemberSchema>;
