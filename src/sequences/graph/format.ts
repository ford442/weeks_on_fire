/**
 * JSON for graph files the way `content/sequences/*.graph.json` are written: two-space indent,
 * and any array or object that fits on one line kept on one line (vectors, keyframes, small
 * materials), so a graph stays readable instead of one number per line.
 */
export function formatGraphJson(value: unknown, width = 100): string {
  return `${format(value, 0, width)}\n`;
}

/** `lead`: characters already on the line before the value (a `"key": ` prefix). */
function format(value: unknown, indent: number, width: number, lead = 0): string {
  const flat = JSON.stringify(value, null, 1)
    // `JSON.stringify(x, null, 1)` then squeezed: `[1, 2]`, `{"t": 0, "v": 1}`.
    .replace(/\n\s*/g, ' ')
    .replace(/\[ /g, '[')
    .replace(/ \]/g, ']')
    .replace(/\{ /g, '{')
    .replace(/ \}/g, '}');
  if (typeof value !== 'object' || value === null || indent + lead + flat.length <= width) {
    return flat;
  }
  const pad = ' '.repeat(indent + 2);
  const close = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((item) => pad + format(item, indent + 2, width)).join(',\n')}\n${close}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, item]) => item !== undefined,
  );
  if (entries.length === 0) return '{}';
  return `{\n${entries
    .map(([key, item]) => {
      const name = `${JSON.stringify(key)}: `;
      return `${pad}${name}${format(item, indent + 2, width, name.length)}`;
    })
    .join(',\n')}\n${close}}`;
}
