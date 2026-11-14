/** "1 segment", "2 segments". Pass `plural` for irregular nouns, e.g. ("person", "people"). */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
