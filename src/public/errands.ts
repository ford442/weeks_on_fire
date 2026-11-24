/**
 * Errands — the engine for the public driving game (`ErrandsGame.tsx`). Pure: geometry, the road
 * graph and routing, car motion, the obstacles' timers and the shopping-list rules. No DOM, no
 * canvas; the copy (store names, items, lines) is in `errandsCopy.ts`.
 *
 * The map is a 4 × 3 grid of road centrelines on a 720 × 480 stage, with six blocks between them:
 * home, three stores and two closed buildings. Everything moves in "frames" (1 = 1/60 s).
 */

export const W = 720;
export const H = 480;
/** Road width; centrelines are at VX × HY. */
export const ROAD = 40;
export const VX = [30, 250, 470, 690] as const;
export const HY = [30, 240, 450] as const;

export type Vec = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

const at = <T>(xs: readonly T[], i: number): T => {
  const v = xs[i];
  if (v === undefined) throw new RangeError(`index ${i} out of range`);
  return v;
};

/** The building block between roads `c, c+1` (columns) and `r, r+1` (rows). */
export function block(c: number, r: number): Rect {
  const x = at(VX, c) + ROAD / 2;
  const y = at(HY, r) + ROAD / 2;
  return { x, y, w: at(VX, c + 1) - ROAD / 2 - x, h: at(HY, r + 1) - ROAD / 2 - y };
}

/** A destination: its block, the parking spot on the road outside, and which side the door faces. */
export type Lot = { block: Rect; spot: Vec; door: 'top' | 'bottom' };

export const HOME_LOT: Lot = { block: block(0, 1), spot: { x: 140, y: 240 }, door: 'top' };
/** Store slots, filled in order by `stores` from the copy. */
export const STORE_LOTS: readonly Lot[] = [
  { block: block(1, 0), spot: { x: 360, y: 30 }, door: 'top' },
  { block: block(2, 0), spot: { x: 580, y: 240 }, door: 'bottom' },
  { block: block(2, 1), spot: { x: 580, y: 450 }, door: 'bottom' },
];
/** Lit windows, nobody home. */
export const CLOSED_BLOCKS: readonly Rect[] = [block(0, 0), block(1, 1)];
export const BLOCKS: readonly Rect[] = [
  HOME_LOT.block,
  ...STORE_LOTS.map((l) => l.block),
  ...CLOSED_BLOCKS,
];

/** Park within this of a spot (and slow) to arrive; leave past LEAVE_R to arrive again. */
export const ARRIVE_R = 24;
export const LEAVE_R = 36;

// ---------------------------------------------------------------------------------------------
// Road graph

export const NODES: readonly Vec[] = HY.flatMap((y) => VX.map((x) => ({ x, y })));
const node = (i: number, j: number) => i + j * VX.length;

/** Road segments between neighbouring intersections, as node-index pairs. */
export const SEGMENTS: readonly (readonly [number, number])[] = [
  ...HY.flatMap((_, j) => VX.slice(1).map((_, i) => [node(i, j), node(i + 1, j)] as const)),
  ...VX.flatMap((_, i) => HY.slice(1).map((_, j) => [node(i, j), node(i, j + 1)] as const)),
];

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const ends = (s: number): [Vec, Vec] => {
  const [a, b] = at(SEGMENTS, s);
  return [at(NODES, a), at(NODES, b)];
};

/** The nearest point on any road centreline: which segment, how far along it (0–1), and where. */
export function project(p: Vec): { seg: number; t: number; point: Vec } {
  let best = { seg: 0, t: 0, point: at(NODES, 0), d: Infinity };
  for (let s = 0; s < SEGMENTS.length; s++) {
    const [a, b] = ends(s);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    const point = { x: a.x + dx * t, y: a.y + dy * t };
    const d = dist(p, point);
    if (d < best.d) best = { seg: s, t, point, d };
  }
  return { seg: best.seg, t: best.t, point: best.point };
}

/** The Form 7-09B barricade: across the middle road, between the middle columns. */
export const BARRICADE = (() => {
  const seg = SEGMENTS.findIndex(([a, b]) => a === node(1, 1) && b === node(2, 1));
  const [a, b] = ends(seg);
  const x = (a.x + b.x) / 2;
  const y = a.y;
  return {
    seg,
    /** Where along the segment it stands (0–1). */
    t: (x - a.x) / (b.x - a.x),
    at: { x, y },
    rect: { x: x - 6, y: y - ROAD / 2, w: 12, h: ROAD },
  };
})();

/**
 * Waypoints along the roads from `from` to `to` (both snapped to the nearest road), avoiding the
 * barricade's segment when `barricadeClosed`. The last waypoint is `to`'s road point. `null` only
 * if there is no way through (there always is on this map).
 */
export function route(from: Vec, to: Vec, barricadeClosed = false): Vec[] | null {
  const A = project(from);
  const B = project(to);
  const blocked = barricadeClosed ? BARRICADE.seg : -1;
  // Which end of a segment a point can leave by: both, unless the barricade is between them.
  const exits = (p: { seg: number; t: number }): { n: number; cost: number }[] => {
    const [na, nb] = at(SEGMENTS, p.seg);
    const [a, b] = ends(p.seg);
    const len = dist(a, b);
    const out = [];
    if (p.seg !== blocked || p.t <= BARRICADE.t) out.push({ n: na, cost: p.t * len });
    if (p.seg !== blocked || p.t >= BARRICADE.t) out.push({ n: nb, cost: (1 - p.t) * len });
    return out;
  };
  const sameSide = A.seg !== blocked || A.t <= BARRICADE.t === B.t <= BARRICADE.t;
  if (A.seg === B.seg && sameSide) return [B.point];

  // Dijkstra over 12 intersections: a linear scan is plenty.
  const cost = NODES.map(() => Infinity);
  const prev: number[] = NODES.map(() => -1);
  const done = NODES.map(() => false);
  for (const e of exits(A)) cost[e.n] = Math.min(at(cost, e.n), e.cost);
  for (;;) {
    let u = -1;
    for (let n = 0; n < NODES.length; n++)
      if (!done[n] && at(cost, n) < Infinity && (u < 0 || at(cost, n) < at(cost, u))) u = n;
    if (u < 0) break;
    done[u] = true;
    for (let s = 0; s < SEGMENTS.length; s++) {
      if (s === blocked) continue;
      const [a, b] = at(SEGMENTS, s);
      const v = a === u ? b : b === u ? a : -1;
      if (v < 0 || done[v]) continue;
      const c = at(cost, u) + dist(at(NODES, u), at(NODES, v));
      if (c < at(cost, v)) {
        cost[v] = c;
        prev[v] = u;
      }
    }
  }
  let bestEnd = -1;
  let bestCost = Infinity;
  for (const e of exits(B)) {
    const c = at(cost, e.n) + e.cost;
    if (c < bestCost) {
      bestCost = c;
      bestEnd = e.n;
    }
  }
  if (bestEnd < 0) return null;
  const path: Vec[] = [B.point];
  for (let n = bestEnd; n >= 0; n = at(prev, n)) path.unshift(at(NODES, n));
  return path;
}

// ---------------------------------------------------------------------------------------------
// The car

export type Car = {
  x: number;
  y: number;
  /** Radians; 0 points right (+x). */
  heading: number;
  /** Pixels per frame; negative is reverse. */
  speed: number;
  /** Frames left of a laser-snake stall. */
  stall: number;
};

export const CAR_R = 10;
export const MAX_SPEED = 3.2;
const ACCEL = 0.12;
const BRAKE = 0.22;
const DRAG = 0.96;
const TURN = 0.075;

export function parkedCar(lot: Lot = HOME_LOT): Car {
  // Nose along the road, pointing into the map.
  return { x: lot.spot.x, y: lot.spot.y, heading: 0, speed: 0, stall: 0 };
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Does a circle at `p` (radius `r`) overlap any rect, or leave the stage? */
export function collides(p: Vec, r: number, solids: readonly Rect[]): boolean {
  if (p.x < r || p.y < r || p.x > W - r || p.y > H - r) return true;
  return solids.some((s) => {
    const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
    return (p.x - cx) ** 2 + (p.y - cy) ** 2 < r * r;
  });
}

export type Input = { throttle: number; steer: number };

/**
 * Keyboard driving: light acceleration, steering that needs the wheels to be turning, and
 * walls you slide along (x and y are tried separately). `dt` is in frames.
 */
export function drive(car: Car, input: Input, dt: number, solids: readonly Rect[]) {
  const top = car.stall > 0 ? MAX_SPEED * 0.25 : MAX_SPEED;
  if (car.stall > 0) car.stall = Math.max(0, car.stall - dt);
  if (input.throttle > 0) car.speed += (car.speed < 0 ? BRAKE : ACCEL) * dt;
  else if (input.throttle < 0) car.speed -= (car.speed > 0 ? BRAKE : ACCEL) * dt;
  else car.speed *= DRAG ** dt;
  car.speed = Math.max(-top / 2, Math.min(top, car.speed));
  if (Math.abs(car.speed) < 0.01 && !input.throttle) car.speed = 0;
  const grip = Math.max(-1, Math.min(1, car.speed / 0.6));
  car.heading = wrap(car.heading + input.steer * TURN * grip * dt);
  const dx = Math.cos(car.heading) * car.speed * dt;
  const dy = Math.sin(car.heading) * car.speed * dt;
  let scraped = false;
  if (!collides({ x: car.x + dx, y: car.y }, CAR_R, solids)) car.x += dx;
  else scraped = true;
  if (!collides({ x: car.x, y: car.y + dy }, CAR_R, solids)) car.y += dy;
  else scraped = true;
  if (scraped) car.speed *= 0.6;
}

/**
 * Click-to-drive: moves the car along `path` (mutated: reached waypoints are dropped), easing into
 * corners and the last stop. Returns true once the path is used up. `hold` brakes in place (the
 * Pizza Guy is crossing).
 */
export function follow(car: Car, path: Vec[], dt: number, hold = false): boolean {
  const target = path[0];
  if (!target) {
    car.speed = 0;
    return true;
  }
  const d = dist(car, target);
  const next = path[1];
  const legIn = Math.atan2(target.y - car.y, target.x - car.x);
  const turn = next
    ? Math.abs(wrap(Math.atan2(next.y - target.y, next.x - target.x) - legIn))
    : Math.PI;
  const top = car.stall > 0 ? MAX_SPEED * 0.25 : MAX_SPEED;
  if (car.stall > 0) car.stall = Math.max(0, car.stall - dt);
  const want = hold ? 0 : turn > 0.3 ? Math.min(top, 0.9 + d * 0.05) : top;
  car.speed =
    car.speed < want
      ? Math.min(want, car.speed + ACCEL * dt)
      : Math.max(want, car.speed - BRAKE * dt);
  if (d > 0.5) car.heading = wrap(car.heading + wrap(legIn - car.heading) * Math.min(1, 0.3 * dt));
  const step = car.speed * dt;
  if (step >= d) {
    car.x = target.x;
    car.y = target.y;
    path.shift();
    if (!path.length) car.speed = 0;
    return !path.length;
  }
  car.x += Math.cos(legIn) * step;
  car.y += Math.sin(legIn) * step;
  return false;
}

/** Is the car close to, and slow enough at, a spot to count as parked there? */
export function parkedAt(car: Car, spot: Vec): boolean {
  return dist(car, spot) <= ARRIVE_R && Math.abs(car.speed) < 1.2;
}

export function leftSpot(car: Car, spot: Vec): boolean {
  return dist(car, spot) > LEAVE_R;
}

// ---------------------------------------------------------------------------------------------
// Obstacles

/** The barricade: open for a while, then closed for a while. It waits for a car in the way. */
export type Gate = { closed: boolean; t: number };
export const GATE_OPEN = 840;
export const GATE_CLOSED = 480;

/** Advance the gate; returns the change it made this frame, if any. */
export function stepGate(g: Gate, dt: number, carInTheWay: boolean): 'closed' | 'opened' | null {
  g.t += dt;
  if (!g.closed && g.t >= GATE_OPEN) {
    if (carInTheWay) return null;
    g.closed = true;
    g.t = 0;
    return 'closed';
  }
  if (g.closed && g.t >= GATE_CLOSED) {
    g.closed = false;
    g.t = 0;
    return 'opened';
  }
  return null;
}

/** The Pizza Guy's crosswalk: across the right-middle road, in no hurry. */
export const CROSSWALK = { y: 345, x0: at(VX, 2) - ROAD / 2 - 8, x1: at(VX, 2) + ROAD / 2 + 8 };
export type Walker = { x: number; dir: 1 | -1; wait: number };
const WALK = 0.4;
const CURB_WAIT = 200;

export function stepWalker(w: Walker, dt: number) {
  if (w.wait > 0) {
    w.wait = Math.max(0, w.wait - dt);
    return;
  }
  w.x += w.dir * WALK * dt;
  if (w.x >= CROSSWALK.x1 || w.x <= CROSSWALK.x0) {
    w.x = Math.max(CROSSWALK.x0, Math.min(CROSSWALK.x1, w.x));
    w.dir = w.dir === 1 ? -1 : 1;
    w.wait = CURB_WAIT;
  }
}

export function walkerOnRoad(w: Walker): boolean {
  return Math.abs(w.x - at(VX, 2)) < ROAD / 2 + 4;
}

export function walkerRect(w: Walker): Rect {
  return { x: w.x - 6, y: CROSSWALK.y - 6, w: 12, h: 12 };
}

/** Should a car on autopilot wait? He is on the road, close, and ahead of the car. */
export function mustYield(car: Car, w: Walker): boolean {
  if (!walkerOnRoad(w)) return false;
  const dx = w.x - car.x;
  const dy = CROSSWALK.y - car.y;
  if (Math.hypot(dx, dy) > 38) return false;
  return dx * Math.cos(car.heading) + dy * Math.sin(car.heading) > 0;
}

// ---------------------------------------------------------------------------------------------
// The list

export type ItemState = 'list' | 'car' | 'home';
/** Only items on this run's list have an entry. */
export type ShoppingList = Readonly<Record<string, ItemState>>;
export type Stocked = { id: string; storeId: string };

/** A fresh list of `min`–`max` distinct items. */
export function newList(
  items: readonly Stocked[],
  rng: () => number = Math.random,
  min = 3,
  max = 5,
) {
  const n = Math.min(items.length, min + Math.floor(rng() * (max - min + 1)));
  const pool = [...items];
  const list: Record<string, ItemState> = {};
  for (let i = 0; i < n; i++) {
    const [pick] = pool.splice(Math.floor(rng() * pool.length), 1);
    if (pick) list[pick.id] = 'list';
  }
  return list as ShoppingList;
}

export type Arrival = {
  list: ShoppingList;
  picked: string[];
  delivered: string[];
  complete: boolean;
};

/** Parking at a store picks up what the list wants from it; parking at home drops off the car. */
export function arrive(list: ShoppingList, items: readonly Stocked[], place: string): Arrival {
  const next: Record<string, ItemState> = { ...list };
  const picked: string[] = [];
  const delivered: string[] = [];
  for (const [id, state] of Object.entries(list)) {
    if (place === 'home' && state === 'car') {
      next[id] = 'home';
      delivered.push(id);
    } else if (state === 'list' && items.find((i) => i.id === id)?.storeId === place) {
      next[id] = 'car';
      picked.push(id);
    }
  }
  const complete = Object.values(next).every((s) => s === 'home');
  return { list: next, picked, delivered, complete };
}

/** "1:07" */
export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
