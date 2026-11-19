import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Clock,
  Film,
  Headphones,
  Lightbulb,
  Music2,
  PenLine,
  Sparkles,
} from 'lucide-react';

import { about } from '../data/about';
import { seriesCharacters } from '../data/characters';
import { crewMembers } from '../data/crew';
import { episodes, episodeStatusMeta } from '../data/episodes';
import { whatsNew, type WhatsNewKind } from '../data/generated/whats-new';
import { pluralize } from '../lib/plural';
import { formatSongDate } from '../lib/songDate';
import { whatsNewKindLabel, whatsNewPath } from '../lib/whatsNew';
import { viewPaths } from '../routes/paths';

const sectionHeading = 'text-lg font-semibold text-white sm:text-xl';
const focusRing = 'focus:outline-none focus:ring-2 focus:ring-orange-300';

/** Episodes the show has announced. A candidate is an unannounced idea and stays on the Episodes tab. */
const announcedEpisodes = episodes.filter((episode) => !episode.isCandidate);

function Intro() {
  return (
    <section aria-labelledby="overview-intro" className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
          A comedy series
        </p>
        <h2
          id="overview-intro"
          className="mt-2 text-2xl font-semibold leading-snug text-white sm:text-3xl"
        >
          {about.logline}
        </h2>
        <div className="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-zinc-300 sm:text-base">
          {about.synopsis.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={viewPaths.episodes}
            className={`inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 ${focusRing}`}
          >
            Read the episodes
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            to="/listen"
            className={`inline-flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white ${focusRing}`}
          >
            <Headphones size={16} aria-hidden="true" />
            Listen to the soundtrack
          </Link>
        </div>
      </div>

      <aside
        aria-label="Tone and format"
        className="self-start rounded-lg border border-zinc-800 bg-zinc-950/80 p-5"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Tone</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-200">{about.tone.line}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {about.tone.words.map((word) => (
            <li
              key={word}
              className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-200"
            >
              {word}
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">Format</h3>
        <dl className="mt-2 space-y-2 text-sm leading-6">
          {about.format.map((item) => (
            <div key={item.label}>
              <dt className="inline font-semibold text-zinc-200">{item.label}: </dt>
              <dd className="inline text-zinc-400">{item.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}

const kindIcons: Record<WhatsNewKind, typeof Film> = {
  song: Music2,
  suggestion: Lightbulb,
  cartoon: PenLine,
  sequence: Box,
  video: Film,
  image: Film,
};

/** Stand-in for records with no still, so every card in the strip has the same shape. */
function KindTile({ kind }: { kind: WhatsNewKind }) {
  const Icon = kindIcons[kind];
  return (
    <div
      aria-hidden="true"
      className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-orange-950/40"
    >
      <Icon size={28} className="text-orange-300/60" />
    </div>
  );
}

function WhatsNew() {
  if (whatsNew.length === 0) return null;

  return (
    <section aria-labelledby="overview-new">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="overview-new" className={`${sectionHeading} inline-flex items-center gap-2`}>
          <Sparkles size={18} className="text-orange-300" aria-hidden="true" />
          What’s new
        </h2>
        <Link
          to={viewPaths.suggestions}
          className={`rounded text-sm text-orange-300 underline-offset-2 hover:underline ${focusRing}`}
        >
          All suggestions
        </Link>
      </div>

      <ul
        aria-label="Latest additions, newest first"
        className="-mx-4 mt-3 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
      >
        {whatsNew.map((entry) => (
          <li key={`${entry.kind}:${entry.id}`} className="w-64 shrink-0 snap-start">
            <Link
              to={whatsNewPath(entry)}
              className={`flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 transition hover:-translate-y-0.5 hover:border-orange-500/70 ${focusRing}`}
            >
              {entry.imageUrl ? (
                <img
                  src={entry.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-full bg-zinc-900 object-cover object-top"
                />
              ) : (
                <KindTile kind={entry.kind} />
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-orange-300">
                    {whatsNewKindLabel[entry.kind]}
                  </span>
                  <time dateTime={entry.added} className="text-zinc-400">
                    {formatSongDate(entry.added)}
                  </time>
                </div>
                <h3 className="mt-2 flex items-center gap-1.5 font-semibold leading-snug text-white">
                  {entry.title}
                  {entry.audio ? (
                    <Headphones
                      size={14}
                      className="shrink-0 text-zinc-400"
                      aria-label="Has audio"
                      role="img"
                    />
                  ) : null}
                </h3>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-zinc-400">{entry.blurb}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EpisodeList() {
  return (
    <section aria-labelledby="overview-episodes">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="overview-episodes" className={sectionHeading}>
          Episodes
        </h2>
        <Link
          to={viewPaths.episodes}
          className={`rounded text-sm text-orange-300 underline-offset-2 hover:underline ${focusRing}`}
        >
          Episode bible
        </Link>
      </div>

      <ol className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {announcedEpisodes.map((episode) => {
          const status = episodeStatusMeta[episode.status];

          return (
            <li key={episode.id}>
              <Link
                to={`${viewPaths.episodes}/${episode.id}`}
                className={`flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-5 transition hover:-translate-y-0.5 hover:border-orange-500/70 ${focusRing}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-orange-300">Episode {episode.number}</p>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${status.accent}`}
                  >
                    {status.label}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold leading-tight text-white">
                  {episode.title}
                </h3>
                {episode.register ? (
                  <p className="mt-1 text-sm text-zinc-400">{episode.register}</p>
                ) : null}
                <p className="mt-3 line-clamp-4 flex-1 text-sm leading-6 text-zinc-300">
                  {episode.logline}
                </p>
                {episode.runtime ? (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock size={13} aria-hidden="true" />
                    {episode.runtime}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

interface PortraitCardProps {
  to: string;
  title: string;
  summary: string;
  cta: string;
  portraits: ReadonlyArray<{ src: string; label: string }>;
}

function PortraitCard({ to, title, summary, cta, portraits }: PortraitCardProps) {
  return (
    <Link
      to={to}
      className={`group flex h-full flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5 transition hover:border-orange-500/70 ${focusRing}`}
    >
      {/* Decorative: the names are on the destination page, and would bloat the link's name. */}
      <ul className="flex -space-x-3" aria-hidden="true">
        {portraits.map((portrait) => (
          <li key={portrait.label}>
            <img
              src={portrait.src}
              alt=""
              loading="lazy"
              className="size-14 rounded-full border-2 border-zinc-950 bg-zinc-900 object-cover object-top"
            />
          </li>
        ))}
      </ul>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{summary}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-300">
        {cta}
        <ArrowRight
          size={16}
          className="transition group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function CastAndCrew() {
  const cast = seriesCharacters.flatMap((character) =>
    character.imageUrl ? [{ src: character.imageUrl, label: character.name }] : [],
  );
  const crew = crewMembers.map((member) => ({ src: member.imageUrl, label: member.name }));

  return (
    <section aria-labelledby="overview-people">
      <h2 id="overview-people" className={sectionHeading}>
        Cast and crew
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <PortraitCard
          to={viewPaths.characters}
          title="Characters"
          cta="Meet the cast"
          summary={`${pluralize(seriesCharacters.length, 'recurring character')} — the building pair, the lawn ensemble, and everyone who is not impressed.`}
          portraits={cast.slice(0, 5)}
        />
        <PortraitCard
          to={viewPaths.crew}
          title="Crew"
          cta="Meet the crew"
          summary={`${pluralize(crewMembers.length, 'person', 'people')} behind the show — writer, producer, director, music, visuals. Bios, quotes, and credits.`}
          portraits={crew.slice(0, 5)}
        />
      </div>
    </section>
  );
}

export default function Overview() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
      <Intro />
      <WhatsNew />
      <EpisodeList />
      <CastAndCrew />

      <section
        aria-label="Browse the archive"
        className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm leading-6 text-zinc-300">
          Looking for the stills and their prompts? The Visual Archive has its own tab now.
        </p>
        <Link
          to={viewPaths.gallery}
          className={`inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white ${focusRing}`}
        >
          Open the Visual Archive
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <p className="border-t border-zinc-800 pt-4 text-xs leading-5 text-zinc-500">
        {about.disclosure}
      </p>
    </div>
  );
}
