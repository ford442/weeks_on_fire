import { useEffect, useMemo, useState } from 'react';
import type { CutawaySuggestion, SightCandidate } from '../../data/suggestions';
import {
  allValue,
  endingSlot,
  fallSlots,
  isOpenSlot,
  loadPreviews,
  savePreviews,
  segmentLetter,
  slotLane,
} from './sightSlots';

/** Sight-bank preview state for the selected cutaway: slot → sight assignments, persisted per cutaway. */
export function useSightPreviews(
  selected: CutawaySuggestion | undefined,
  activeSegmentId: string,
  setActiveSegmentId: (id: string) => void,
) {
  const [previewBySegment, setPreviewBySegment] = useState<Record<string, string>>({});
  const [sightCategory, setSightCategory] = useState(allValue);

  useEffect(() => {
    if (!selected?.id) {
      setPreviewBySegment({});
      return;
    }
    setPreviewBySegment(loadPreviews(selected.id));
    setSightCategory(allValue);
  }, [selected?.id]);

  const sightBank = useMemo(() => selected?.sightBank ?? [], [selected]);

  const sightCategories = useMemo(() => {
    const seen: string[] = [];
    for (const sight of sightBank) {
      if (!seen.includes(sight.category)) {
        seen.push(sight.category);
      }
    }
    return seen;
  }, [sightBank]);

  const filteredSights = useMemo(() => {
    if (sightCategory === allValue) {
      return sightBank;
    }
    return sightBank.filter((sight) => sight.category === sightCategory);
  }, [sightBank, sightCategory]);

  const previewSightBySegment = useMemo(() => {
    const map = new Map<string, SightCandidate>();
    if (!selected?.sightBank) {
      return map;
    }
    for (const [segmentId, sightId] of Object.entries(previewBySegment)) {
      const sight = selected.sightBank.find((candidate) => candidate.id === sightId);
      if (sight) {
        map.set(segmentId, sight);
      }
    }
    return map;
  }, [previewBySegment, selected]);

  const slotLettersBySight = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!selected) {
      return map;
    }
    for (const [segmentId, sightId] of Object.entries(previewBySegment)) {
      const segment = selected.segments.find((entry) => entry.id === segmentId);
      if (!segment) {
        continue;
      }
      const letters = map.get(sightId) ?? [];
      letters.push(segmentLetter(segment));
      map.set(sightId, letters);
    }
    return map;
  }, [previewBySegment, selected]);

  const persistPreviews = (cutawayId: string, next: Record<string, string>) => {
    setPreviewBySegment(next);
    savePreviews(cutawayId, next);
  };

  const assignSight = (sight: SightCandidate) => {
    if (!selected) {
      return;
    }
    const active = selected.segments.find((segment) => segment.id === activeSegmentId);
    const activeKind = active ? slotLane(active, selected.segments) : 'locked';
    let targetId = activeSegmentId;

    if (sight.lane === 'ending') {
      targetId = endingSlot(selected.segments)?.id ?? targetId;
    } else if (activeKind !== 'fall') {
      targetId = fallSlots(selected.segments)[0]?.id ?? targetId;
    }

    const target = selected.segments.find((segment) => segment.id === targetId);
    if (!target || !isOpenSlot(target)) {
      return;
    }
    if (slotLane(target, selected.segments) !== sight.lane) {
      return;
    }

    setActiveSegmentId(target.id);
    const next = { ...previewBySegment };
    if (next[target.id] === sight.id) {
      delete next[target.id];
    } else {
      next[target.id] = sight.id;
    }
    persistPreviews(selected.id, next);
  };

  const clearPreview = (segmentId: string) => {
    if (!selected) {
      return;
    }
    const next = { ...previewBySegment };
    delete next[segmentId];
    persistPreviews(selected.id, next);
  };

  return {
    sightBank,
    sightCategories,
    sightCategory,
    setSightCategory,
    filteredSights,
    previewBySegment,
    previewSightBySegment,
    slotLettersBySight,
    assignSight,
    clearPreview,
  };
}
