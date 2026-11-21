import type { z } from 'zod';

/** One readable graph problem: where (`node leg-l: scale[1]`) and what (`must be positive`). */
export interface GraphProblem {
  /** Raw JSON path, for editors that point at the text. */
  path: (string | number)[];
  /** `node leg-l: scale[1]`, `camera.eye`, `clip leg-l.rotation: keys[2].t`, or `graph`. */
  where: string;
  message: string;
}

type Raw = Record<string, unknown> | undefined;

function asRecord(value: unknown): Raw {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function joinPath(path: readonly (string | number)[]): string {
  return path
    .map((segment, index) =>
      typeof segment === 'number' ? `[${segment}]` : index === 0 ? segment : `.${segment}`,
    )
    .join('');
}

/** Names the node or clip a path points into, from the raw (possibly invalid) graph. */
export function describePath(raw: unknown, path: readonly (string | number)[]): string {
  const graph = asRecord(raw);
  const [head, index, ...rest] = path;
  if ((head === 'nodes' || head === 'clips') && typeof index === 'number') {
    const list = graph?.[head];
    const item = Array.isArray(list) ? asRecord(list[index]) : undefined;
    const tail = rest.length > 0 ? `: ${joinPath(rest)}` : ':';
    if (head === 'nodes') {
      const id = typeof item?.id === 'string' ? item.id : `#${index}`;
      return `node ${id}${tail}`;
    }
    const target = typeof item?.target === 'string' ? item.target : '?';
    const property = typeof item?.property === 'string' ? item.property : '?';
    return `clip ${target}.${property}${tail}`;
  }
  return path.length === 0 ? 'graph:' : joinPath(path);
}

/** Zod's messages, shortened to read after a path ("must be positive", "unknown key spinn"). */
export function describeIssue(issue: z.core.$ZodIssue): string {
  switch (issue.code) {
    case 'too_small': {
      const min = Number(issue.minimum);
      if (issue.origin === 'number') {
        if (min === 0 && !issue.inclusive) return 'must be positive';
        return `must be ${issue.inclusive ? '≥' : '>'} ${min}`;
      }
      if (issue.origin === 'array') return `needs at least ${min} item${min === 1 ? '' : 's'}`;
      if (issue.origin === 'string') return issue.message;
      return issue.message;
    }
    case 'too_big': {
      const max = Number(issue.maximum);
      if (issue.origin === 'number') return `must be ${issue.inclusive ? '≤' : '<'} ${max}`;
      if (issue.origin === 'array') return `allows at most ${max} item${max === 1 ? '' : 's'}`;
      return issue.message;
    }
    case 'invalid_type':
      return issue.input === undefined
        ? `is required (${issue.expected})`
        : `must be ${issue.expected === 'tuple' ? 'an [x, y, z] list' : `a ${issue.expected}`}`;
    case 'unrecognized_keys':
      return `unknown key${issue.keys.length === 1 ? '' : 's'} ${issue.keys.join(', ')}`;
    case 'invalid_value':
      return `must be one of ${issue.values.map((value) => JSON.stringify(value)).join(', ')}`;
    case 'not_multiple_of':
      return 'must be a whole number';
    case 'invalid_format':
      return issue.message;
    default:
      return issue.message;
  }
}

/** Every Zod issue as `{ where, message }`, naming nodes and clips by id. */
export function graphProblems(raw: unknown, error: z.ZodError): GraphProblem[] {
  return error.issues.map((issue) => ({
    path: issue.path.filter((segment): segment is string | number => typeof segment !== 'symbol'),
    where: describePath(
      raw,
      issue.path.filter((segment): segment is string | number => typeof segment !== 'symbol'),
    ),
    message: describeIssue(issue),
  }));
}

/** `sequence hose-chase node leg-l: scale[1] must be positive`, one line per problem. */
export function formatGraphProblems(sequenceId: string, problems: readonly GraphProblem[]): string {
  return problems
    .map((problem) => `sequence ${sequenceId} ${problem.where} ${problem.message}`)
    .join('\n');
}
