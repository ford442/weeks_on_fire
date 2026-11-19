import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Network } from 'lucide-react';

import { catalogLinks, type CatalogNodeType } from '../lib/catalogGraph';

const NONE: readonly CatalogNodeType[] = [];

interface RelatedLinksProps {
  type: CatalogNodeType;
  id: string;
  /** Section heading, e.g. "Appears in" or "In this episode". */
  heading?: string;
  /** Also list the songs of linked cutaways and scenes (character and episode pages). */
  throughSongs?: boolean;
  /** Shown when nothing links here; omitted → the section is left off. */
  emptyText?: string;
  /** Leave these groups out (already shown elsewhere on the page). */
  hide?: readonly CatalogNodeType[];
}

/**
 * The records linked to this one in the catalog graph, as deep links grouped by type. Links come
 * from ids in `content/` (characterIds, episodeId, promotion, inserts) and Timeline refs.
 */
export default function RelatedLinks({
  type,
  id,
  heading = 'Appears in',
  throughSongs = false,
  emptyText,
  hide = NONE,
}: RelatedLinksProps) {
  const groups = useMemo(
    () =>
      catalogLinks
        .related(type, id, { throughSongs })
        .filter((group) => group.key === 'promotion' || !hide.includes(group.key)),
    [type, id, throughSongs, hide],
  );

  if (groups.length === 0 && !emptyText) return null;

  return (
    <section aria-label={heading}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
        <Network size={14} aria-hidden="true" />
        {heading}
      </h3>
      {groups.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-zinc-400">{emptyText}</p>
      ) : (
        <div className="mt-2 space-y-3">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {group.label}
              </p>
              <ul aria-label={group.label} className="mt-1.5 flex flex-wrap gap-1.5">
                {group.nodes.map((node) => (
                  <li key={node.key}>
                    <Link
                      to={node.path}
                      title={node.via ? `Via ${node.via.title}` : undefined}
                      className="inline-block rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-sm text-zinc-200 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {node.title}
                      {node.via ? (
                        <span className="text-xs text-zinc-400"> · via {node.via.title}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
