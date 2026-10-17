import { Maximize2, X } from 'lucide-react';

import { useEscapeKey } from '../hooks/useEscapeKey';

import PromptCard from './PromptCard';

import type { FilmScene } from '../data/films';

interface LightboxProps {
  scene: FilmScene;
  copiedKey: string | null;
  onClose: () => void;
  onCopy: (text: string, label: string, key: string) => void;
}

export default function Lightbox({ scene, copiedKey, onClose, onCopy }: LightboxProps) {
  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/92 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${scene.title} prompt details`}
        className="relative m-auto grid max-h-[calc(100vh-1.5rem)] w-full max-w-7xl grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-hidden lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:grid-rows-1"
      >
        <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-zinc-800 bg-black shadow-2xl shadow-black">
          {scene.imageUrl ? (
            <img
              src={scene.imageUrl}
              alt={scene.title}
              className="h-full max-h-[70vh] w-full object-contain lg:max-h-[calc(100vh-3rem)]"
            />
          ) : (
            <div className="flex min-h-[280px] flex-col justify-center gap-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Prompt-only suggestion
              </p>
              <p className="max-w-prose text-sm leading-7 text-zinc-300">{scene.prompt}</p>
            </div>
          )}
          {scene.imageUrl && (
            <a
              href={scene.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-md bg-black/75 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-zinc-900"
            >
              <Maximize2 size={16} />
              Open
            </a>
          )}
        </div>

        <div className="min-h-0 overflow-auto">
          <PromptCard scene={scene} copiedKey={copiedKey} onCopy={onCopy} />
        </div>

        <button
          type="button"
          aria-label="Close lightbox"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md bg-black/75 p-2 text-white ring-1 ring-white/15 transition hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
