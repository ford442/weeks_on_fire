import { Check, Copy, ExternalLink, Music2, Tags } from 'lucide-react';

import { imageKindMeta, type FilmScene } from '../data/films';

interface PromptCardProps {
  scene: FilmScene;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}

export default function PromptCard({ scene, copiedKey, onCopy }: PromptCardProps) {
  return (
    <aside className="flex min-h-0 flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${imageKindMeta[scene.imageKind].accent}`}
          >
            {imageKindMeta[scene.imageKind].label}
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
            {scene.episode}
          </p>
        </div>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">{scene.title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{scene.description}</p>
      </div>

      <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/80 p-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Music2 size={16} />
            <span>Music Cue</span>
          </div>
          <p className="mt-2 font-medium text-zinc-100">{scene.musicCue}</p>
          <p className="mt-1 text-xs text-zinc-500">{scene.musicStyle}</p>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-900/80 p-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Tags size={16} />
            <span>Theme</span>
          </div>
          <p className="mt-2 font-medium text-zinc-100">{scene.theme}</p>
          <p className="mt-1 text-xs text-zinc-500">{scene.tags.join(', ')}</p>
        </div>
      </div>

      <section className="min-h-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Exact Prompt
          </h3>
          <CopyButton
            copied={copiedKey === `${scene.id}:prompt`}
            label="Copy Prompt"
            onClick={() => onCopy(scene.prompt, 'Prompt', `${scene.id}:prompt`)}
          />
        </div>
        <pre className="max-h-52 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
          {scene.prompt}
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Variations
        </h3>
        <div className="space-y-3">
          {scene.promptVariations.map((variation, index) => (
            <div key={variation} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-zinc-500">Variation {index + 1}</span>
                <CopyButton
                  copied={copiedKey === `${scene.id}:variation:${index}`}
                  label="Copy"
                  onClick={() =>
                    onCopy(variation, `Variation ${index + 1}`, `${scene.id}:variation:${index}`)
                  }
                />
              </div>
              <p className="text-sm leading-6 text-zinc-300">{variation}</p>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() =>
          scene.imageUrl
            ? onCopy(scene.imageUrl, 'Image URL', `${scene.id}:url`)
            : onCopy(scene.prompt, 'Prompt', `${scene.id}:prompt`)
        }
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
      >
        {copiedKey === `${scene.id}:url` || copiedKey === `${scene.id}:prompt` ? (
          <Check size={18} />
        ) : (
          <ExternalLink size={18} />
        )}
        {scene.imageUrl
          ? copiedKey === `${scene.id}:url`
            ? 'Image URL Copied'
            : 'Copy Image URL'
          : copiedKey === `${scene.id}:prompt`
            ? 'Prompt Copied'
            : 'Copy Main Prompt'}
      </button>
    </aside>
  );
}

interface CopyButtonProps {
  copied: boolean;
  label: string;
  onClick: () => void;
}

function CopyButton({ copied, label, onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </button>
  );
}
