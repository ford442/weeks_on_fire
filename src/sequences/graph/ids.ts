/**
 * Sequence ids are file names (`content/sequences/<id>.json`) and URL segments: lowercase words
 * joined by single hyphens. Codegen enforces it (`validateSequences`); the graph editor checks a
 * fork's new id with `newSequenceIdProblem` before it saves a draft under it.
 */
export const SEQUENCE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Why `id` cannot name a new sequence, or null when it can. */
export function newSequenceIdProblem(
  id: string,
  taken: { sequenceIds: Iterable<string>; customRendererIds: Iterable<string> },
): string | null {
  if (id.length === 0) return 'Give the new sequence an id.';
  if (id.length > 60) return 'Keep the id under 60 characters.';
  if (!SEQUENCE_ID_PATTERN.test(id)) {
    return 'Use lowercase letters and digits joined by single hyphens (e.g. "kick-lattice-2").';
  }
  if ([...taken.sequenceIds].includes(id)) return `"${id}" is already a sequence.`;
  if ([...taken.customRendererIds].includes(id)) {
    return `"${id}" is reserved by a custom renderer in src/sequences/scenes/.`;
  }
  return null;
}
