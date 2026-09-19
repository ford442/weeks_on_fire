import type { CutawaySegment } from '../../data/suggestions';

export const allValue = 'All';
export const sightToken = '[SIGHT]';
const previewStoragePrefix = 'weeks-on-fire:sight-previews:';

export function applySightToPrompt(template: string, prompt: string): string {
  return template.replaceAll(sightToken, prompt);
}

export function isOpenSlot(segment: CutawaySegment): boolean {
  return segment.grokImaginePrompt.includes(sightToken);
}

function openSlots(segments: CutawaySegment[]): CutawaySegment[] {
  return segments.filter(isOpenSlot);
}

export function endingSlot(segments: CutawaySegment[]): CutawaySegment | undefined {
  const open = openSlots(segments);
  return open[open.length - 1];
}

export function fallSlots(segments: CutawaySegment[]): CutawaySegment[] {
  const open = openSlots(segments);
  return open.slice(0, Math.max(0, open.length - 1));
}

export function slotLane(
  segment: CutawaySegment,
  segments: CutawaySegment[],
): 'locked' | 'fall' | 'ending' {
  if (!isOpenSlot(segment)) {
    return 'locked';
  }
  return endingSlot(segments)?.id === segment.id ? 'ending' : 'fall';
}

export function segmentLetter(segment: CutawaySegment): string {
  const letter = segment.label.split('—')[0]?.trim();
  return letter || segment.label;
}

export function loadPreviews(cutawayId: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(`${previewStoragePrefix}${cutawayId}`);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        next[key] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

export function savePreviews(cutawayId: string, map: Record<string, string>) {
  try {
    window.localStorage.setItem(`${previewStoragePrefix}${cutawayId}`, JSON.stringify(map));
  } catch {
    // private mode / quota
  }
}
