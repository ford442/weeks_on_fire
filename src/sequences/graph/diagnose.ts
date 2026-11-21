import { graphProblems } from './issues';
import { locateJson, spanFor, type JsonSpan } from './jsonLocate';
import { SequenceGraphSchema, keyframeLists } from './schema';

import type { SequenceGraph } from './types';

export interface GraphDiagnostic {
  /** Character range in the text; 0-0 when the text is not JSON. */
  from: number;
  to: number;
  /** `node leg-l: scale[1] must be positive`. */
  message: string;
}

export interface GraphDiagnosis {
  /** The parsed graph, when the text is valid JSON and a valid graph. */
  graph?: SequenceGraph;
  /** Set when the text is not JSON at all (CodeMirror's JSON linter points at the spot). */
  jsonError?: string;
  diagnostics: GraphDiagnostic[];
}

/**
 * Everything codegen would say about a `.graph.json`, for the in-hub editor: JSON syntax, the
 * Zod schema (expressions, scopes and structure included), and times past the film's end. Each
 * problem carries the text range of the value it is about.
 */
export function diagnoseGraphText(text: string, durationSec: number): GraphDiagnosis {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      jsonError: message,
      diagnostics: [{ from: 0, to: 0, message: `Not valid JSON: ${message}` }],
    };
  }
  const spans = locateJson(text) ?? new Map<string, JsonSpan>();
  const parsed = SequenceGraphSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      diagnostics: graphProblems(raw, parsed.error).map((problem) => {
        const span = spanFor(spans, problem.path) ?? { from: 0, to: 0 };
        return { ...span, message: `${problem.where} ${problem.message}` };
      }),
    };
  }
  const graph = parsed.data;
  const late: GraphDiagnostic[] = [];
  for (const list of keyframeLists(graph)) {
    list.keys.forEach((key, index) => {
      if (key.t <= durationSec) return;
      const span = spanFor(spans, [...list.path, index, 't']) ?? { from: 0, to: 0 };
      late.push({
        ...span,
        message: `${list.path.join('.')}[${index}].t ${key.t} is past the film's ${durationSec}s`,
      });
    });
  }
  (graph.markers ?? []).forEach((marker, index) => {
    if (marker.t <= durationSec) return;
    const span = spanFor(spans, ['markers', index, 't']) ?? { from: 0, to: 0 };
    late.push({
      ...span,
      message: `marker "${marker.label}" at ${marker.t}s is past the film's ${durationSec}s`,
    });
  });
  if (graph.loop && graph.loop.outSec > durationSec) {
    const span = spanFor(spans, ['loop', 'outSec']) ?? { from: 0, to: 0 };
    late.push({
      ...span,
      message: `loop.outSec ${graph.loop.outSec} is past the film's ${durationSec}s`,
    });
  }
  return late.length > 0 ? { diagnostics: late } : { graph, diagnostics: [] };
}
