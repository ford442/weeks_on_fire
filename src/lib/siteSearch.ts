import { cartoons } from '../data/cartoons';
import { seriesCharacters } from '../data/characters';
import { episodes } from '../data/episodes';
import { filmScenes } from '../data/films';
import { sequences } from '../data/sequences';
import { songs } from '../data/songs';
import { crewMembers } from '../data/crew';
import { cutawaySuggestions } from '../data/suggestions';
import { episodeWithSlot, toolLabel } from '../data/taxonomy';
import { crewPath } from '../routes/paths';

export type SearchSection =
  | 'Songs'
  | 'Suggestions'
  | 'Visual archive'
  | 'Episodes'
  | 'Characters'
  | 'Cartoons'
  | '3D sequences'
  | 'Crew';

export interface SearchEntry {
  section: SearchSection;
  title: string;
  subtitle: string;
  /** Router path (no basename), including any query string. */
  to: string;
  /** Lowercased title, weighted above body matches. */
  titleText: string;
  /** Lowercased searchable body. */
  bodyText: string;
}

function entry(
  section: SearchSection,
  title: string,
  subtitle: string,
  to: string,
  body: readonly string[],
): SearchEntry {
  return {
    section,
    title,
    subtitle,
    to,
    titleText: title.toLowerCase(),
    bodyText: [subtitle, ...body].join(' ').toLowerCase(),
  };
}

function withQuery(path: string, q: string) {
  return `${path}?${new URLSearchParams({ q }).toString()}`;
}

/** Flattens every catalog into one list. Views without detail routes link to a filtered list. */
export function buildSearchIndex(): SearchEntry[] {
  return [
    ...songs.map((song) =>
      entry(
        'Songs',
        song.title,
        `${episodeWithSlot(song.episode, song.slot)} · ${song.genre}`,
        crewPath(`/songs/${song.id}`),
        [
          song.subgenre ?? '',
          song.description,
          song.stylePrompt,
          song.lyrics ?? '',
          song.tags.join(' '),
        ],
      ),
    ),
    ...cutawaySuggestions.map((cutaway) =>
      entry(
        'Suggestions',
        cutaway.title,
        `${cutaway.episode} · ${cutaway.songTitle}`,
        crewPath(`/suggestions/${cutaway.id}`),
        [cutaway.summary, cutaway.visualArc, cutaway.tags.join(' ')],
      ),
    ),
    ...filmScenes.map((scene) =>
      entry(
        'Visual archive',
        scene.title,
        episodeWithSlot(scene.episode, scene.slot),
        withQuery(crewPath('/'), scene.title),
        [
          scene.tool ? toolLabel(scene.tool) : '',
          scene.description,
          scene.prompt,
          scene.theme,
          scene.tags.join(' '),
        ],
      ),
    ),
    ...episodes.map((episode) =>
      entry(
        'Episodes',
        episode.title,
        `Episode ${episode.number}`,
        crewPath(`/episodes/${episode.id}`),
        [episode.logline],
      ),
    ),
    ...seriesCharacters.map((character) =>
      entry(
        'Characters',
        character.name,
        character.role,
        withQuery(crewPath('/characters'), character.name),
        [character.bio, character.tags.join(' ')],
      ),
    ),
    ...cartoons.map((cartoon) =>
      entry('Cartoons', cartoon.title, cartoon.status, crewPath(`/cartoons/${cartoon.id}`), [
        cartoon.premise,
        cartoon.tags.join(' '),
      ]),
    ),
    ...sequences.map((sequence) =>
      entry(
        '3D sequences',
        sequence.title,
        sequence.medium,
        crewPath(`/sequences/${sequence.id}`),
        [sequence.premise, sequence.tags.join(' ')],
      ),
    ),
    ...crewMembers.map((member) =>
      entry('Crew', member.name, member.role, crewPath('/crew'), [member.bio, member.specialty]),
    ),
  ];
}

/**
 * Every whitespace-separated term must appear in the entry. Title hits rank first, then
 * title-prefix hits, then body-only hits; ties keep catalog order.
 */
export function searchIndex(index: readonly SearchEntry[], query: string, limit = 40) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored: Array<{ entry: SearchEntry; score: number; order: number }> = [];
  index.forEach((candidate, order) => {
    let score = 0;
    for (const term of terms) {
      if (candidate.titleText.includes(term)) {
        score += candidate.titleText.startsWith(term) ? 3 : 2;
      } else if (candidate.bodyText.includes(term)) {
        score += 1;
      } else {
        return;
      }
    }
    scored.push({ entry: candidate, score, order });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((hit) => hit.entry);
}
