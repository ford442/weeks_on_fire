import { useMemo, useState } from 'react';
import { Copy, ImageIcon, PanelRightClose, PanelRightOpen, Search } from 'lucide-react';
import { filmScenes, imageKindMeta, type FilmScene, type ImageKind } from '../data/films';
import { firstCatalogItem } from '../lib/catalog';
import Lightbox from './Lightbox';
import PromptCard from './PromptCard';

const allValue = 'All';

export default function Gallery() {
  const [selected, setSelected] = useState<FilmScene>(firstCatalogItem(filmScenes, 'gallery'));
  const [lightboxScene, setLightboxScene] = useState<FilmScene | null>(null);
  const [query, setQuery] = useState('');
  const [episode, setEpisode] = useState(allValue);
  const [theme, setTheme] = useState(allValue);
  const [imageKind, setImageKind] = useState<typeof allValue | ImageKind>(allValue);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const kindCounts = useMemo(() => {
    const counts: Record<ImageKind, number> = { scene: 0, suggestion: 0, test: 0, character: 0 };
    for (const scene of filmScenes) {
      counts[scene.imageKind] += 1;
    }
    return counts;
  }, []);

  const filters = useMemo(
    () => ({
      episodes: uniqueValues(filmScenes.map((scene) => scene.episode)),
      themes: uniqueValues(filmScenes.map((scene) => scene.theme)),
    }),
    [],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return filmScenes.filter((scene) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [
          scene.title,
          scene.episode,
          scene.prompt,
          scene.description,
          scene.theme,
          scene.musicCue,
          scene.musicStyle,
          imageKindMeta[scene.imageKind].label,
          scene.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return (
        matchesSearch &&
        (episode === allValue || scene.episode === episode) &&
        (theme === allValue || scene.theme === theme) &&
        (imageKind === allValue || scene.imageKind === imageKind)
      );
    });
  }, [episode, imageKind, query, theme]);

  const copyToClipboard = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      window.prompt(`Copy ${label}`, text);
    }
  };

  const openItem = (scene: FilmScene) => {
    setSelected(scene);
    if (scene.imageUrl) {
      setLightboxScene(scene);
    } else {
      setShowWorkspace(true);
    }
  };

  return (
    <>
      <section
        className={`mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8 ${
          showWorkspace ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                {filtered.length} of {filmScenes.length} items
                <span className="mx-2 text-zinc-700">·</span>
                {filmScenes.filter((s) => s.imageUrl).length} with images
              </p>
              <button
                type="button"
                onClick={() => setShowWorkspace((open) => !open)}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {showWorkspace ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                {showWorkspace ? 'Hide prompts' : 'Show prompts'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <KindChip
                active={imageKind === allValue}
                label={`All (${filmScenes.length})`}
                onClick={() => setImageKind(allValue)}
              />
              {(Object.keys(imageKindMeta) as ImageKind[]).map((kind) => (
                <KindChip
                  key={kind}
                  active={imageKind === kind}
                  label={`${imageKindMeta[kind].label} (${kindCounts[kind]})`}
                  accentClass={imageKindMeta[kind].accent}
                  onClick={() => setImageKind(kind)}
                />
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(200px,1fr)_160px_160px]">
              <label className="relative block">
                <span className="sr-only">Search prompts, titles, and tags</span>
                <Search
                  aria-hidden="true"
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search prompts, scenes, tags..."
                  className="h-10 w-full rounded-md border border-zinc-800 bg-black/70 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
                />
              </label>
              <FilterSelect
                label="Episode"
                value={episode}
                options={filters.episodes}
                onChange={setEpisode}
              />
              <FilterSelect
                label="Theme"
                value={theme}
                options={filters.themes}
                onChange={setTheme}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((scene) => (
              <GalleryCard
                key={scene.id}
                scene={scene}
                selected={selected.id === scene.id}
                copiedKey={copiedKey}
                onOpen={() => openItem(scene)}
                onSelect={() => setSelected(scene)}
                onCopy={copyToClipboard}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
              No items match the current filters.
            </div>
          )}
        </div>

        {showWorkspace && (
          <div className="xl:sticky xl:top-4 xl:self-start">
            <PromptCard scene={selected} copiedKey={copiedKey} onCopy={copyToClipboard} />
          </div>
        )}
      </section>

      {lightboxScene && (
        <Lightbox
          scene={lightboxScene}
          copiedKey={copiedKey}
          onClose={() => setLightboxScene(null)}
          onCopy={copyToClipboard}
        />
      )}
    </>
  );
}

interface GalleryCardProps {
  scene: FilmScene;
  selected: boolean;
  copiedKey: string | null;
  onOpen: () => void;
  onSelect: () => void;
  onCopy: (text: string, label: string, key: string) => void;
}

function GalleryCard({ scene, selected, copiedKey, onOpen, onSelect, onCopy }: GalleryCardProps) {
  const kind = imageKindMeta[scene.imageKind];

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-lg border bg-zinc-950 transition ${
        selected
          ? 'border-orange-500/60 ring-1 ring-orange-500/25'
          : 'border-zinc-800 hover:border-zinc-600'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          onSelect();
          onOpen();
        }}
        className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
      >
        {scene.imageUrl ? (
          <div className="relative aspect-[4/5] overflow-hidden bg-black">
            <img
              src={scene.imageUrl}
              alt={scene.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <span
              className={`absolute left-2 top-2 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${kind.accent}`}
            >
              {kind.label}
            </span>
          </div>
        ) : (
          <div className="relative flex aspect-[4/5] flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-3">
            <span
              className={`self-start rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${kind.accent}`}
            >
              {kind.label}
            </span>
            <div className="flex flex-1 flex-col justify-center gap-2">
              <ImageIcon size={22} className="text-zinc-600" aria-hidden="true" />
              <p className="line-clamp-4 text-xs leading-5 text-zinc-400">{scene.prompt}</p>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">
              Prompt only
            </p>
          </div>
        )}

        <div className="space-y-2 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-300/90">
            {scene.episode}
          </p>
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
            {scene.title}
          </h2>
          <p className="line-clamp-2 text-xs leading-5 text-zinc-500">{scene.description}</p>
        </div>
      </button>

      <div className="mt-auto grid grid-cols-2 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => onCopy(scene.prompt, 'Prompt', `${scene.id}:card-prompt`)}
          className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-orange-200"
        >
          <Copy size={14} />
          {copiedKey === `${scene.id}:card-prompt` ? 'Copied' : 'Prompt'}
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect();
            onOpen();
          }}
          className="border-l border-zinc-800 px-2 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-orange-200"
        >
          {scene.imageUrl ? 'Open' : 'Details'}
        </button>
      </div>
    </article>
  );
}

function KindChip({
  active,
  label,
  accentClass,
  onClick,
}: {
  active: boolean;
  label: string;
  accentClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active
          ? (accentClass ?? 'border-orange-500/60 bg-orange-500/15 text-orange-100')
          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-zinc-800 bg-black/70 px-3 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
      >
        <option value={allValue}>{label}: All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function uniqueValues(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
