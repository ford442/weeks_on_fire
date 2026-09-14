const markdownModules = {
  ...import.meta.glob<string>('../../episodes/**/*.md', { query: '?raw', import: 'default' }),
  ...import.meta.glob<string>('../../notes/**/*.md', { query: '?raw', import: 'default' }),
  ...import.meta.glob<string>('../../docs/**/*.md', { query: '?raw', import: 'default' }),
};

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? raw.slice(match[0].length) : raw;
}

/** repoPath is repo-relative, e.g. "episodes/episode-01/synopsis.md" (as authored in content/episodes.json). */
export async function loadMarkdownFile(repoPath: string): Promise<string | null> {
  const loader = markdownModules[`../../${repoPath}`];
  if (!loader) return null;
  const raw = await loader();
  return stripFrontmatter(raw);
}
