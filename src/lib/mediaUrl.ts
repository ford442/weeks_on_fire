/**
 * Two kinds of `mediaUrl` reach the Timeline: a hosted take (Drive, Imgur, any http(s) link) that
 * can be committed and handed to clip_stacker, and an in-browser capture (`blob:`), which only this
 * tab can play and which dies with it. Blob URLs are never saved, exported or committed.
 */

/** An in-browser take: playable in this tab only. */
export function isSessionMediaUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.trim().toLowerCase().startsWith('blob:');
}

/** A link anyone can open: the only kind that goes into scenes.json or a clip_stacker export. */
export function isHostedMediaUrl(url: string | null | undefined): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const { protocol } = new URL(url.trim());
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}
