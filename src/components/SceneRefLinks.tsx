import { Link } from 'react-router-dom';

import { sceneRefLinks } from '../lib/catalogRefs';

import type { CatalogRefs } from '../schemas/production';

interface SceneRefLinksProps {
  refs: CatalogRefs;
  /** Open links in a new tab, so following one from the editor cannot discard unsaved edits. */
  newTab?: boolean;
}

/** Deep links to the catalog records a scene points at; renders nothing when none are set. */
export default function SceneRefLinks({ refs, newTab = false }: SceneRefLinksProps) {
  const links = sceneRefLinks(refs);
  if (links.length === 0) return null;

  return (
    <ul aria-label="Catalog links" className="mt-3 flex flex-wrap gap-1.5 text-xs">
      {links.map((link) => (
        <li key={`${link.key}:${link.id}`}>
          {link.to ? (
            <Link
              to={link.to}
              {...(newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="inline-block rounded border border-zinc-700 px-2 py-0.5 text-zinc-300 transition hover:border-orange-400 hover:text-orange-200"
            >
              {link.label}: {link.title}
            </Link>
          ) : (
            <span
              title="Not in the catalog"
              className="inline-block rounded border border-dashed border-zinc-700 px-2 py-0.5 text-zinc-400"
            >
              {link.label}: {link.title} (not in catalog)
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
