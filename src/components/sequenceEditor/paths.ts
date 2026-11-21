import { crewPath } from '../../routes/paths';

/** `/sequences/<source>/edit`, plus `?as=<draft>` when the draft is a fork under a new id. */
export function editorPath(sourceId: string, draftId?: string): string {
  const base = crewPath(`/sequences/${sourceId}/edit`);
  return draftId && draftId !== sourceId ? `${base}?as=${encodeURIComponent(draftId)}` : base;
}
