import { Check, Copy, FileText, Music2, Tags } from 'lucide-react';

import { formatSongDate } from '../lib/songDate';

import SongAudioPlayer from './SongAudioPlayer';

import type { Song } from '../data/songs';

interface SongDetailProps {
  song: Song;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}

export default function SongDetail({ song, copiedKey, onCopy }: SongDetailProps) {
  const minimaxPayload = song.lyrics ? `${song.stylePrompt}\n\n${song.lyrics}` : song.stylePrompt;

  return (
    <aside className="flex min-h-0 flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <p className="text-sm font-semibold text-orange-300">
          {song.episode}
          <span className="text-zinc-400">
            {' · '}
            <time dateTime={song.added}>{formatSongDate(song.added)}</time>
          </span>
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">{song.title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{song.description}</p>
      </div>

      {song.audioFile && <SongAudioPlayer audioFile={song.audioFile} title={song.title} />}

      <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/80 p-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Music2 size={16} />
            <span>Genre</span>
          </div>
          <p className="mt-2 font-medium text-zinc-100">{song.genre}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {song.instrumental ? 'Instrumental' : 'Vocals'}
          </p>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-900/80 p-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Tags size={16} />
            <span>Tags</span>
          </div>
          <p className="mt-2 font-medium text-zinc-100">{song.tags.join(', ')}</p>
          <p className="mt-1 text-xs text-zinc-400">{song.sourceFile}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-orange-500/30 bg-orange-500/5 p-3">
        <p className="text-xs text-zinc-400">
          {song.lyrics ? 'Style prompt, blank line, lyrics' : 'Style prompt (instrumental)'}
        </p>
        <CopyButton
          primary
          copied={copiedKey === `${song.id}:minimax`}
          label="Copy for Minimax"
          onClick={() => onCopy(minimaxPayload, 'Minimax prompt', `${song.id}:minimax`)}
        />
      </div>

      <section className="min-h-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-400">Minimax style prompt</h3>
          <CopyButton
            copied={copiedKey === `${song.id}:style`}
            label="Copy style"
            onClick={() => onCopy(song.stylePrompt, 'Style prompt', `${song.id}:style`)}
          />
        </div>
        <pre className="max-h-52 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
          {song.stylePrompt}
        </pre>
      </section>

      {song.lyrics && (
        <section className="min-h-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-400">Lyrics</h3>
            <CopyButton
              copied={copiedKey === `${song.id}:lyrics`}
              label="Copy lyrics"
              onClick={() => onCopy(song.lyrics!, 'Lyrics', `${song.id}:lyrics`)}
            />
          </div>
          <pre className="max-h-52 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {song.lyrics}
          </pre>
        </section>
      )}

      {song.notes && (
        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <FileText size={14} />
            Notes
          </div>
          <p className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-sm leading-6 whitespace-pre-wrap text-zinc-400">
            {song.notes}
          </p>
        </section>
      )}
    </aside>
  );
}

interface CopyButtonProps {
  primary?: boolean;
  copied: boolean;
  label: string;
  onClick: () => void;
}

function CopyButton({ primary = false, copied, label, onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        primary
          ? 'border-orange-400 bg-orange-500 text-orange-950 hover:bg-orange-400'
          : 'border-zinc-700 text-zinc-200 hover:border-orange-400 hover:text-orange-200'
      }`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </button>
  );
}
