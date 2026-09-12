import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CutawaySegment } from '../schemas';

function parseTimeToSeconds(value: string): number {
  const parts = value.trim().split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function durationFromRange(start: string, end: string): number {
  const startSec = parseTimeToSeconds(start);
  const endSec = parseTimeToSeconds(end);
  return Math.max(0, endSec - startSec);
}

function extractFencedBlock(text: string, label: string): string {
  const pattern = new RegExp(
    `\\*\\*${label}\\*\\*\\s*\\n+\`\`\`[\\w]*\\n([\\s\\S]*?)\\n\`\`\``,
    'i',
  );
  return text.match(pattern)?.[1]?.trim() ?? '';
}

function extractVariations(text: string): string[] {
  const pattern = /\*\*Prompt variations\*\*\s*\n+([\s\S]*?)(?=\n---|\n## |$)/i;
  const block = text.match(pattern)?.[1] ?? '';
  return block
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('```'));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseSegmentPromptsFile(
  repoRoot: string,
  relativePath: string,
  cutawayId: string,
): CutawaySegment[] {
  const fullPath = join(repoRoot, relativePath);
  const markdown = readFileSync(fullPath, 'utf8');
  const segments: CutawaySegment[] = [];

  const headerPattern = /^##\s+([A-Z0-9]+)\s+—\s+(.+?)\s+\(([^)]+)\)/gm;
  const matches = [...markdown.matchAll(headerPattern)];

  for (const match of matches) {
    const [, letter, title, timeRange] = match;
    const headerIndex = match.index ?? 0;
    const nextHeader = markdown.slice(headerIndex + match[0].length).search(/^##\s/m);
    const section =
      nextHeader === -1
        ? markdown.slice(headerIndex)
        : markdown.slice(headerIndex, headerIndex + match[0].length + nextHeader);

    const timeParts = timeRange.split(/[–-]/).map((part) => part.trim());
    const start = timeParts[0] ?? '0:00';
    const end = timeParts[1] ?? start;

    const segmentId = `${cutawayId.split('-').slice(0, 2).join('-')}-${letter.toLowerCase()}-${slugify(title).split('-').slice(0, 2).join('-')}`;
    const onScreenLine = section.match(/\*\*On screen:\*\*\s*(.+)/i)?.[1]?.trim();

    segments.push({
      id: segmentId,
      label: `${letter} — ${title}`,
      start,
      end,
      durationSec: durationFromRange(start, end),
      onScreen: onScreenLine || title,
      lyrics:
        extractFencedBlock(section, 'Spoken') ||
        extractFencedBlock(section, 'Lyrics') ||
        '',
      musicCue:
        extractFencedBlock(section, 'Sound') ||
        extractFencedBlock(section, 'Voice bed') ||
        '',
      grokImaginePrompt: extractFencedBlock(section, 'Grok Imagine'),
      geminiOmniPrompt: extractFencedBlock(section, 'Gemini Omni'),
      promptVariations: extractVariations(section),
    });
  }

  if (segments.length > 0) {
    return segments;
  }

  return parseSoftGyreTable(markdown, cutawayId);
}

function parseSoftGyreTable(markdown: string, cutawayId: string): CutawaySegment[] {
  const segments: CutawaySegment[] = [];
  const rowPattern = /\|\s*([0-9:]+)[–-]([0-9:]+)\s*\|\s*\*\*([A-Z])\s+—\s+([^*]+)\*\*/g;

  for (const match of markdown.matchAll(rowPattern)) {
    const [, start, end, letter, title] = match;
    const sectionPattern = new RegExp(
      `##\\s+Shot\\s+${letter}\\s+—[\\s\\S]*?(?=##\\s+Shot\\s+[A-Z]|##\\s+Gemini|$)`,
      'i',
    );
    const section = markdown.match(sectionPattern)?.[0] ?? '';

    segments.push({
      id: `${cutawayId.split('-').pop()}-${letter.toLowerCase()}`,
      label: `${letter} — ${title.trim()}`,
      start,
      end,
      durationSec: durationFromRange(start, end),
      onScreen: title.trim(),
      lyrics: '[Instrumental — no vocal]',
      musicCue: '',
      grokImaginePrompt: extractFencedBlock(section, 'Grok Imagine') || extractFencedBlock(section, 'First frame'),
      geminiOmniPrompt: extractFencedBlock(section, 'Gemini Omni') || extractFencedBlock(section, 'Video'),
      promptVariations: extractVariations(section),
    });
  }

  return segments;
}

export function countEditTimelineRows(repoRoot: string, relativePath: string): number | null {
  const markdown = readFileSync(join(repoRoot, relativePath), 'utf8');
  const timelineMatch = markdown.match(/## Edit timeline[\s\S]*?```([\s\S]*?)```/i);
  if (!timelineMatch) return null;

  return timelineMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|') && /\d+:\d+/.test(line)).length;
}
