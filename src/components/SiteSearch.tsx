import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search, X } from 'lucide-react';

import { useEscapeKey } from '../hooks/useEscapeKey';
import { buildSearchIndex, searchIndex } from '../lib/siteSearch';

interface SiteSearchProps {
  onClose: () => void;
}

/** Site-wide search across every catalog. Loaded on first open so the index stays out of the main chunk. */
export default function SiteSearch({ onClose }: SiteSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const index = useMemo(() => buildSearchIndex(), []);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchIndex(index, query), [index, query]);

  useEscapeKey(onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = (to: string) => {
    onClose();
    void navigate(to);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      const hit = results[active];
      if (hit) go(hit.to);
    }
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the hub"
        className="relative flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
          <Search size={18} className="shrink-0 text-zinc-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={results.length > 0 ? `${listId}-${active}` : undefined}
            aria-label="Search songs, suggestions, episodes, characters…"
            placeholder="Search songs, suggestions, episodes, characters…"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <X size={18} />
          </button>
        </div>

        <ul id={listId} role="listbox" className="overflow-y-auto py-2">
          {results.map((hit, position) => (
            // Keyboard selection lives on the combobox input (arrows + Enter), per the ARIA pattern.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={`${hit.section}:${hit.to}:${hit.title}`}
              id={`${listId}-${position}`}
              role="option"
              aria-selected={position === active}
              onMouseMove={() => setActive(position)}
              onClick={() => go(hit.to)}
              className={`mx-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 ${
                position === active ? 'bg-orange-500/15' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-white">{hit.title}</p>
                <p className="truncate text-sm text-zinc-400">{hit.subtitle}</p>
              </div>
              <span className="shrink-0 rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                {hit.section}
              </span>
              {position === active && (
                <CornerDownLeft size={15} className="shrink-0 text-orange-300" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>

        {query.trim() && results.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">Nothing matches “{query}”.</p>
        )}
        {!query.trim() && (
          <p className="px-5 py-6 text-sm text-zinc-400">
            Searches titles, lyrics, prompts, loglines, and tags across every tab. Use ↑ ↓ and
            Enter.
          </p>
        )}
      </div>
    </div>
  );
}
