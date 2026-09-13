export function firstCatalogItem<T>(items: readonly T[], catalog: string): T {
  const item = items[0];
  if (item === undefined) {
    throw new Error(`Catalog "${catalog}" is empty`);
  }
  return item;
}
