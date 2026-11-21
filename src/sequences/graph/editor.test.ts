import { describe, expect, it } from 'vitest';

import { diagnoseGraphText } from './diagnose';
import { formatGraphJson } from './format';
import { newSequenceIdProblem, SEQUENCE_ID_PATTERN } from './ids';
import { locateJson, spanFor } from './jsonLocate';
import { retimeKey, timelineRows } from './timeline';

import type { SequenceGraph } from './types';

const graph: SequenceGraph = {
  camera: {
    type: 'orbit',
    radius: [
      { t: 0, v: 5 },
      { t: 4, v: 3 },
    ],
    height: 1,
    angle: 0,
  },
  vars: {
    lift: [
      { t: 1, v: 0 },
      { t: 2, v: 1 },
    ],
  },
  nodes: [
    {
      id: 'ball',
      geometry: { type: 'sphere', radius: 0.5 },
      material: { kind: 'lit', color: [1, 0.5, 0] },
      squash: [
        { t: 0, v: 1 },
        { t: 3, v: 0.5 },
      ],
    },
  ],
  clips: [
    {
      target: 'ball',
      property: 'translation',
      keys: [
        { t: 0, v: [0, 0, 0] },
        { t: 5, v: [1, 0, 0] },
      ],
    },
  ],
  markers: [{ t: 2, label: 'drop' }],
};
const text = formatGraphJson(graph);

describe('formatGraphJson', () => {
  it('round-trips and keeps short arrays on one line', () => {
    expect(JSON.parse(text)).toEqual(graph);
    expect(text).toContain('"color": [1, 0.5, 0]');
    expect(text).toContain('{"t": 0, "v": 5}');
    expect(text.endsWith('\n')).toBe(true);
    for (const line of text.split('\n')) expect(line.length).toBeLessThanOrEqual(100);
  });
});

describe('locateJson', () => {
  it('finds the span of any value by path', () => {
    const spans = locateJson(text);
    expect(spans).not.toBeNull();
    const radius = spanFor(spans!, ['nodes', 0, 'geometry', 'radius'])!;
    expect(text.slice(radius.from, radius.to)).toBe('0.5');
    const id = spanFor(spans!, ['nodes', 0, 'id'])!;
    expect(text.slice(id.from, id.to)).toBe('"ball"');
  });

  it('falls back to the deepest existing ancestor, and rejects non-JSON', () => {
    const spans = locateJson('{"a": {"b": [1, 2]}}')!;
    const missing = spanFor(spans, ['a', 'b', 5])!;
    expect('{"a": {"b": [1, 2]}}'.slice(missing.from, missing.to)).toBe('[1, 2]');
    expect(locateJson('{"a": }')).toBeNull();
    expect(locateJson('{"a": 1} x')).toBeNull();
    expect(locateJson('"\\"quoted\\""')?.get('[]')).toEqual({ from: 0, to: 12 });
  });
});

describe('timelineRows', () => {
  it('lists every keyframe track with a readable label', () => {
    expect(timelineRows(graph).map((row) => [row.label, row.times])).toEqual([
      ['camera.radius', [0, 4]],
      ['vars.lift', [1, 2]],
      ['node ball: squash', [0, 3]],
      ['clip ball.translation', [0, 5]],
    ]);
  });
});

describe('retimeKey', () => {
  const row = timelineRows(graph)[2]!;

  it('rewrites only that key, rounded to hundredths', () => {
    const next = retimeKey(text, row.path, 1, 2.3456, 10, { before: 0 })!;
    expect(next).toBe(text.replace('{"t": 3, "v": 0.5}', '{"t": 2.35, "v": 0.5}'));
  });

  it('keeps keys in order and inside the film', () => {
    const early = retimeKey(text, row.path, 1, -4, 10, { before: 0 })!;
    expect(early).toContain('{"t": 0.01, "v": 0.5}');
    const late = retimeKey(text, row.path, 1, 99, 10, { before: 0 })!;
    expect(late).toContain('{"t": 10, "v": 0.5}');
    expect(retimeKey(text, row.path, 0, 9, 10, { after: 3 })).toContain('{"t": 2.99, "v": 1}');
    expect(retimeKey('not json', row.path, 1, 2, 10, {})).toBeNull();
  });
});

describe('diagnoseGraphText', () => {
  it('returns the graph when codegen would accept it', () => {
    const diagnosis = diagnoseGraphText(text, 10);
    expect(diagnosis.diagnostics).toEqual([]);
    expect(diagnosis.graph).toEqual(graph);
  });

  it('points schema problems at the value that failed', () => {
    const broken = text.replace('"radius": 0.5', '"radius": -0.5');
    const [problem] = diagnoseGraphText(broken, 10).diagnostics;
    expect(problem?.message).toBe('node ball: geometry.radius must be positive');
    expect(broken.slice(problem!.from, problem!.to)).toBe('-0.5');
  });

  it('flags times past the film, like codegen', () => {
    const { diagnostics, graph: parsed } = diagnoseGraphText(text, 4);
    expect(parsed).toBeUndefined();
    expect(diagnostics.map((d) => d.message)).toEqual([
      "clips.0.keys[1].t 5 is past the film's 4s",
    ]);
    const marker = text.replace('{"t": 2, "label": "drop"}', '{"t": 9, "label": "drop"}');
    expect(diagnoseGraphText(marker, 8).diagnostics.map((d) => d.message)).toContain(
      'marker "drop" at 9s is past the film\'s 8s',
    );
  });

  it('reports text that is not JSON', () => {
    expect(diagnoseGraphText('{', 10).jsonError).toBeTruthy();
  });
});

describe('sequence ids', () => {
  const taken = { sequenceIds: ['hose-chase'], customRendererIds: ['old-hand-made'] };

  it('accepts lowercase slugs and rejects everything else', () => {
    for (const id of ['hose-chase', 'a', 'kick-lattice-2'])
      expect(SEQUENCE_ID_PATTERN.test(id)).toBe(true);
    for (const id of ['Hose', 'hose--chase', '-hose', 'hose-', 'hose chase', 'hose_chase']) {
      expect(SEQUENCE_ID_PATTERN.test(id), id).toBe(false);
    }
  });

  it('explains why a new id is not available', () => {
    expect(newSequenceIdProblem('new-film', taken)).toBeNull();
    expect(newSequenceIdProblem('', taken)).toMatch(/Give/);
    expect(newSequenceIdProblem('New Film', taken)).toMatch(/lowercase/);
    expect(newSequenceIdProblem('hose-chase', taken)).toMatch(/already a sequence/);
    expect(newSequenceIdProblem('old-hand-made', taken)).toMatch(/custom renderer/);
  });
});
