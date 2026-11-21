import { smoothstep } from '../../lib/webgl/math';

/**
 * Graph expressions: small arithmetic strings such as `"abs(sin(t * 16)) * 0.06"` that drive a
 * number from film time and named variables. Parsed once (no `eval`, no property access, no
 * assignment) into closures that read a slot array, so evaluating one is a few calls.
 *
 * Grammar (loosest first): `c ? a : b`, `||`, `&&`, `== != < <= > >=`, `+ -`, `* / %`, unary
 * `- + !`, then numbers, names, calls and parentheses. Comparisons and logic return 1 or 0. `%` is
 * JavaScript's remainder (sign of the left side); `mod(a, b)` is the always-positive one.
 */

export type Compiled = (slots: Float64Array) => number;

export class ExprError extends Error {
  constructor(
    message: string,
    /** Character offset in the source string. */
    readonly at: number,
  ) {
    super(message);
    this.name = 'ExprError';
  }
}

/** Names every expression can read. The renderer sets them; they are not graph `vars`. */
export const BUILTIN_VARIABLES = {
  /** Scene time in seconds, after `loop` wraps it. */
  t: 'scene time, seconds (after loop)',
  /** Film progress 0-1 (film time / duration; not wrapped by `loop`). */
  p: 'film progress, 0-1',
  dur: 'film duration, seconds',
  /** Copy index on an `instances` node (and its children); point index inside `field`. */
  i: 'instance index (point index in a field)',
  /** Copy count. */
  n: 'instance count (point count in a field)',
  /** Repeat copy, centred on 0 (`-1, 0, 1` for three copies). */
  k: 'repeat copy, centred on 0',
} as const;

export const BUILTIN_SLOTS = Object.keys(BUILTIN_VARIABLES) as (keyof typeof BUILTIN_VARIABLES)[];

const CONSTANTS: Record<string, number> = { pi: Math.PI, tau: Math.PI * 2 };

const fract = (x: number) => x - Math.floor(x);

/** Function name → [arity (or -1 for 1+), implementation]. */
const FUNCTIONS: Record<string, [number, (...args: number[]) => number]> = {
  sin: [1, Math.sin],
  cos: [1, Math.cos],
  tan: [1, Math.tan],
  asin: [1, Math.asin],
  acos: [1, Math.acos],
  atan: [1, Math.atan],
  atan2: [2, Math.atan2],
  abs: [1, Math.abs],
  floor: [1, Math.floor],
  ceil: [1, Math.ceil],
  round: [1, Math.round],
  fract: [1, fract],
  sqrt: [1, Math.sqrt],
  exp: [1, Math.exp],
  log: [1, Math.log],
  pow: [2, Math.pow],
  sign: [1, Math.sign],
  min: [-1, Math.min],
  max: [-1, Math.max],
  clamp: [3, (x, lo, hi) => Math.min(Math.max(x, lo), hi)],
  mix: [3, (a, b, u) => a + (b - a) * u],
  smoothstep: [3, smoothstep],
  step: [2, (edge, x) => (x < edge ? 0 : 1)],
  mod: [2, (a, b) => a - b * Math.floor(a / b)],
  /** Radians → degrees: node rotations are degrees, trig is radians. */
  deg: [1, (r) => (r * 180) / Math.PI],
  rad: [1, (d) => (d * Math.PI) / 180],
  /** Repeatable pseudo-random 0-1 from a number (an index, a seed). */
  hash: [1, (x) => fract(Math.sin(x * 12.9898) * 43758.5453)],
  /** `pick(i, a, b, c)`: the `i`-th of the values (floored, clamped to the list). */
  pick: [
    -1,
    (index, ...values) =>
      values[Math.min(values.length - 1, Math.max(0, Math.floor(index)))] ?? Number.NaN,
  ],
};

export const FUNCTION_NAMES = Object.keys(FUNCTIONS);

type Token =
  | { kind: 'num'; value: number; at: number }
  | { kind: 'name'; value: string; at: number }
  | { kind: 'op'; value: string; at: number }
  | { kind: 'end'; at: number };

const OPERATORS = [
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '!',
  '?',
  ':',
  '(',
  ')',
  ',',
];

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let at = 0;
  while (at < source.length) {
    const ch = source[at] ?? '';
    if (/\s/.test(ch)) {
      at += 1;
      continue;
    }
    const number = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(at));
    if (number) {
      tokens.push({ kind: 'num', value: Number(number[0]), at });
      at += number[0].length;
      continue;
    }
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(at));
    if (name) {
      tokens.push({ kind: 'name', value: name[0], at });
      at += name[0].length;
      continue;
    }
    const op = OPERATORS.find((candidate) => source.startsWith(candidate, at));
    if (!op) throw new ExprError(`unexpected "${ch}"`, at);
    tokens.push({ kind: 'op', value: op, at });
    at += op.length;
  }
  tokens.push({ kind: 'end', at: source.length });
  return tokens;
}

/** Resolves a variable name to its slot; returns undefined for an unknown name. */
export type ResolveSlot = (name: string) => number | undefined;

const BINARY: Record<string, (a: number, b: number) => number> = {
  '||': (a, b) => (a !== 0 || b !== 0 ? 1 : 0),
  '&&': (a, b) => (a !== 0 && b !== 0 ? 1 : 0),
  '==': (a, b) => (a === b ? 1 : 0),
  '!=': (a, b) => (a !== b ? 1 : 0),
  '<': (a, b) => (a < b ? 1 : 0),
  '<=': (a, b) => (a <= b ? 1 : 0),
  '>': (a, b) => (a > b ? 1 : 0),
  '>=': (a, b) => (a >= b ? 1 : 0),
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
};

/** Binary levels, loosest first. Each level is left-associative. */
const LEVELS = [['||'], ['&&'], ['==', '!=', '<', '<=', '>', '>='], ['+', '-'], ['*', '/', '%']];

/**
 * Compiles `source` against `resolve` (graph and node variables, plus the built-ins). Unknown
 * names, wrong arity and syntax errors throw `ExprError` with the offset that failed.
 */
export function compileExpr(source: string, resolve: ResolveSlot): Compiled {
  const tokens = tokenize(source);
  let pos = 0;
  const peek = (): Token => tokens[pos] ?? { kind: 'end', at: source.length };
  const next = (): Token => {
    const token = peek();
    pos += 1;
    return token;
  };
  const isOp = (value: string) => {
    const token = peek();
    return token.kind === 'op' && token.value === value;
  };
  const expect = (value: string) => {
    const token = next();
    if (token.kind !== 'op' || token.value !== value) {
      throw new ExprError(`expected "${value}"`, token.at);
    }
  };

  const ternary = (): Compiled => {
    const condition = binary(0);
    if (!isOp('?')) return condition;
    next();
    const whenTrue = ternary();
    expect(':');
    const whenFalse = ternary();
    return (s) => (condition(s) !== 0 ? whenTrue(s) : whenFalse(s));
  };

  const binary = (level: number): Compiled => {
    const ops = LEVELS[level];
    if (!ops) return unary();
    let left = binary(level + 1);
    for (;;) {
      const token = peek();
      if (token.kind !== 'op' || !ops.includes(token.value)) return left;
      next();
      const right = binary(level + 1);
      const fn = BINARY[token.value];
      if (!fn) throw new ExprError(`unknown operator "${token.value}"`, token.at);
      const a = left;
      left = (s) => fn(a(s), right(s));
    }
  };

  const unary = (): Compiled => {
    const token = peek();
    if (
      token.kind === 'op' &&
      (token.value === '-' || token.value === '+' || token.value === '!')
    ) {
      next();
      const operand = unary();
      if (token.value === '-') return (s) => -operand(s);
      if (token.value === '!') return (s) => (operand(s) === 0 ? 1 : 0);
      return operand;
    }
    return primary();
  };

  const primary = (): Compiled => {
    const token = next();
    if (token.kind === 'num') {
      const value = token.value;
      return () => value;
    }
    if (token.kind === 'op' && token.value === '(') {
      const inner = ternary();
      expect(')');
      return inner;
    }
    if (token.kind === 'name') {
      if (isOp('(')) return call(token.value, token.at);
      const constant = CONSTANTS[token.value];
      if (constant !== undefined) return () => constant;
      const slot = resolve(token.value);
      if (slot === undefined) {
        throw new ExprError(`unknown name "${token.value}"`, token.at);
      }
      return (s) => s[slot] ?? 0;
    }
    if (token.kind === 'end') throw new ExprError('expression ends too early', token.at);
    throw new ExprError(`unexpected "${token.value}"`, token.at);
  };

  const call = (name: string, at: number): Compiled => {
    const entry = FUNCTIONS[name];
    if (!entry) throw new ExprError(`unknown function "${name}"`, at);
    expect('(');
    const args: Compiled[] = [];
    if (!isOp(')')) {
      args.push(ternary());
      while (isOp(',')) {
        next();
        args.push(ternary());
      }
    }
    expect(')');
    const [arity, fn] = entry;
    if (arity >= 0 ? args.length !== arity : args.length < 1) {
      throw new ExprError(
        `${name}() takes ${arity >= 0 ? arity : 'at least 1'} argument${arity === 1 ? '' : 's'}, got ${args.length}`,
        at,
      );
    }
    if (args.length === 1) {
      const [a] = args as [Compiled];
      return (s) => fn(a(s));
    }
    if (args.length === 2) {
      const [a, b] = args as [Compiled, Compiled];
      return (s) => fn(a(s), b(s));
    }
    if (args.length === 3) {
      const [a, b, c] = args as [Compiled, Compiled, Compiled];
      return (s) => fn(a(s), b(s), c(s));
    }
    return (s) => fn(...args.map((arg) => arg(s)));
  };

  const result = ternary();
  const rest = peek();
  if (rest.kind !== 'end') {
    throw new ExprError(
      `unexpected "${rest.kind === 'num' ? String(rest.value) : rest.value}"`,
      rest.at,
    );
  }
  return result;
}

/** Names `source` reads (variables only, not functions or constants); [] if it does not parse. */
export function exprNames(source: string): string[] {
  const names = new Set<string>();
  try {
    compileExpr(source, (name) => {
      names.add(name);
      return 0;
    });
  } catch {
    return [];
  }
  return [...names];
}
