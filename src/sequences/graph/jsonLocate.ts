/** Where a value sits in JSON text, as character offsets (`to` exclusive). */
export interface JsonSpan {
  from: number;
  to: number;
}

export type JsonPath = readonly (string | number)[];

const key = (path: JsonPath) => JSON.stringify(path);

/**
 * Maps every value in `text` to its span, keyed by JSON path, so an error at
 * `['nodes', 3, 'scale', 1]` can be underlined and a keyframe's `t` rewritten in place without
 * reformatting the author's file. Null when `text` is not JSON.
 */
export function locateJson(text: string): Map<string, JsonSpan> | null {
  const spans = new Map<string, JsonSpan>();
  let pos = 0;

  const fail = (): never => {
    throw new SyntaxError(`invalid JSON at ${pos}`);
  };
  const space = () => {
    while (pos < text.length && /\s/.test(text[pos] ?? '')) pos += 1;
  };
  const string = (): string => {
    const start = pos;
    if (text[pos] !== '"') fail();
    pos += 1;
    while (pos < text.length && text[pos] !== '"') pos += text[pos] === '\\' ? 2 : 1;
    if (text[pos] !== '"') fail();
    pos += 1;
    return JSON.parse(text.slice(start, pos)) as string;
  };
  const value = (path: (string | number)[]) => {
    space();
    const from = pos;
    const ch = text[pos];
    if (ch === '{') {
      pos += 1;
      space();
      if (text[pos] === '}') pos += 1;
      else {
        for (;;) {
          space();
          const name = string();
          space();
          if (text[pos] !== ':') fail();
          pos += 1;
          value([...path, name]);
          space();
          if (text[pos] === ',') pos += 1;
          else if (text[pos] === '}') {
            pos += 1;
            break;
          } else fail();
        }
      }
    } else if (ch === '[') {
      pos += 1;
      space();
      if (text[pos] === ']') pos += 1;
      else {
        for (let index = 0; ; index++) {
          value([...path, index]);
          space();
          if (text[pos] === ',') pos += 1;
          else if (text[pos] === ']') {
            pos += 1;
            break;
          } else fail();
        }
      }
    } else if (ch === '"') {
      string();
    } else {
      const literal = /^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(
        text.slice(pos),
      );
      if (!literal) fail();
      pos += literal?.[0].length ?? 0;
    }
    spans.set(key(path), { from, to: pos });
  };

  try {
    value([]);
    space();
    if (pos !== text.length) fail();
    return spans;
  } catch {
    return null;
  }
}

/** The span of `path`, or of its deepest ancestor that exists (a missing key underlines its parent). */
export function spanFor(spans: Map<string, JsonSpan>, path: JsonPath): JsonSpan | undefined {
  for (let length = path.length; length >= 0; length--) {
    const span = spans.get(key(path.slice(0, length)));
    if (span) return span;
  }
  return undefined;
}
