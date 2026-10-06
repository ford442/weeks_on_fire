const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-10-06` → `6 Oct 2026`. Fixed month names so every browser and locale renders the same. */
export function formatSongDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const monthName = month ? months[month - 1] : undefined;
  if (!year || !monthName || !day) return iso;
  return `${day} ${monthName} ${year}`;
}
