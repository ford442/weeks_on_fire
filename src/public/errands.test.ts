import { describe, expect, it } from 'vitest';

import {
  arrive,
  BARRICADE,
  BLOCKS,
  CAR_R,
  clock,
  collides,
  CROSSWALK,
  drive,
  follow,
  HOME_LOT,
  mustYield,
  newList,
  parkedAt,
  parkedCar,
  project,
  route,
  stepGate,
  stepWalker,
  STORE_LOTS,
  type Vec,
  type Walker,
} from './errands';

const items = [
  { id: 'a1', storeId: 'a' },
  { id: 'a2', storeId: 'a' },
  { id: 'b1', storeId: 'b' },
  { id: 'b2', storeId: 'b' },
  { id: 'c1', storeId: 'c' },
  { id: 'c2', storeId: 'c' },
];

/** Does any leg of the path pass through the barricade? */
function crossesBarricade(from: Vec, path: Vec[]): boolean {
  let p = from;
  for (const q of path) {
    const horizontal = Math.abs(p.y - BARRICADE.at.y) < 1 && Math.abs(q.y - BARRICADE.at.y) < 1;
    if (horizontal && Math.min(p.x, q.x) < BARRICADE.at.x && Math.max(p.x, q.x) > BARRICADE.at.x)
      return true;
    p = q;
  }
  return false;
}

/** Drive a path to the end on autopilot, checking the car never goes through a building. */
function runPath(from: Vec, path: Vec[]) {
  const car = { ...parkedCar(), x: from.x, y: from.y };
  for (let f = 0; f < 5000; f++) {
    expect(collides(car, CAR_R - 2, BLOCKS)).toBe(false);
    if (follow(car, path, 1)) return car;
  }
  throw new Error('never arrived');
}

describe('errands map', () => {
  it('puts every parking spot on a road, outside every building', () => {
    for (const lot of [HOME_LOT, ...STORE_LOTS]) {
      expect(project(lot.spot).point).toEqual(lot.spot);
      expect(collides(lot.spot, CAR_R, BLOCKS)).toBe(false);
    }
  });

  it('routes home to the far store straight along the middle road', () => {
    const store = STORE_LOTS[1]!;
    const path = route(HOME_LOT.spot, store.spot)!;
    expect(path.at(-1)).toEqual(store.spot);
    expect(crossesBarricade(HOME_LOT.spot, path)).toBe(true);
    expect(runPath(HOME_LOT.spot, path)).toMatchObject(store.spot);
  });

  it('detours around the barricade when it is closed', () => {
    const store = STORE_LOTS[1]!;
    const path = route(HOME_LOT.spot, store.spot, true)!;
    expect(path.at(-1)).toEqual(store.spot);
    expect(crossesBarricade(HOME_LOT.spot, path)).toBe(false);
    expect(runPath(HOME_LOT.spot, path)).toMatchObject(store.spot);
  });

  it('turns back the way it came from a car stuck on the barricaded road', () => {
    const car = { x: BARRICADE.at.x - 30, y: BARRICADE.at.y };
    const path = route(car, { x: BARRICADE.at.x + 30, y: BARRICADE.at.y }, true)!;
    expect(path[0]!.x).toBeLessThan(car.x);
    expect(crossesBarricade(car, path)).toBe(false);
  });

  it('reaches every lot from every lot, either way the gate is', () => {
    const lots = [HOME_LOT, ...STORE_LOTS];
    for (const closed of [false, true])
      for (const a of lots)
        for (const b of lots) {
          const path = route(a.spot, b.spot, closed);
          expect(path).not.toBeNull();
          if (closed) expect(crossesBarricade(a.spot, path!)).toBe(false);
          expect(runPath(a.spot, path!)).toMatchObject(b.spot);
        }
  });
});

describe('errands car', () => {
  it('accelerates, steers and stops at a wall', () => {
    const car = parkedCar();
    for (let f = 0; f < 30; f++) drive(car, { throttle: 1, steer: 0 }, 1, BLOCKS);
    expect(car.x).toBeGreaterThan(HOME_LOT.spot.x + 20);
    expect(car.speed).toBeGreaterThan(2);
    // Turn into the home block and floor it: the building stops the car.
    for (let f = 0; f < 200; f++) drive(car, { throttle: 1, steer: 1 }, 1, BLOCKS);
    expect(collides(car, CAR_R, BLOCKS)).toBe(false);
  });

  it('cannot steer standing still', () => {
    const car = parkedCar();
    drive(car, { throttle: 0, steer: 1 }, 1, BLOCKS);
    expect(car.heading).toBe(0);
  });

  it('crawls while stalled by a snake', () => {
    const car = { ...parkedCar(), stall: 60 };
    for (let f = 0; f < 30; f++) drive(car, { throttle: 1, steer: 0 }, 1, BLOCKS);
    expect(car.speed).toBeLessThanOrEqual(0.8);
    expect(car.stall).toBe(30);
  });

  it('counts as parked only when slow and close', () => {
    const car = parkedCar();
    expect(parkedAt(car, HOME_LOT.spot)).toBe(true);
    expect(parkedAt({ ...car, speed: 3 }, HOME_LOT.spot)).toBe(false);
    expect(parkedAt({ ...car, x: car.x + 40 }, HOME_LOT.spot)).toBe(false);
  });
});

describe('errands obstacles', () => {
  it('closes the gate on a timer, but not on top of a car', () => {
    const g = { closed: false, t: 0 };
    let change = null;
    for (let f = 0; f < 900 && !change; f++) change = stepGate(g, 1, true);
    expect(change).toBeNull();
    expect(stepGate(g, 1, false)).toBe('closed');
    let opened = null;
    for (let f = 0; f < 600 && !opened; f++) opened = stepGate(g, 1, false);
    expect(opened).toBe('opened');
  });

  it('walks the Pizza Guy across and waits at the curb', () => {
    const w: Walker = { x: CROSSWALK.x0, dir: 1, wait: 0 };
    for (let f = 0; f < 1000 && w.dir === 1; f++) stepWalker(w, 1);
    expect(w.x).toBe(CROSSWALK.x1);
    expect(w.wait).toBeGreaterThan(0);
  });

  it('yields only to a Pizza Guy on the road, close, and ahead', () => {
    const w: Walker = { x: 470, dir: 1, wait: 0 };
    const car = { ...parkedCar(), x: 470, y: CROSSWALK.y - 30, heading: Math.PI / 2 };
    expect(mustYield(car, w)).toBe(true);
    expect(mustYield({ ...car, heading: -Math.PI / 2 }, w)).toBe(false);
    expect(mustYield({ ...car, y: CROSSWALK.y - 80 }, w)).toBe(false);
    expect(mustYield(car, { ...w, x: CROSSWALK.x0 })).toBe(false);
  });
});

describe('errands list', () => {
  it('draws three to five distinct items', () => {
    for (const r of [0, 0.5, 0.99]) {
      const list = newList(items, () => r);
      const n = Object.keys(list).length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
      expect(Object.values(list).every((s) => s === 'list')).toBe(true);
    }
  });

  it('picks up at the store, drops off at home, and completes', () => {
    let list = { a1: 'list', b1: 'list', b2: 'list' } as const satisfies Record<string, string>;
    const atA = arrive(list, items, 'a');
    expect(atA.picked).toEqual(['a1']);
    expect(atA.list).toMatchObject({ a1: 'car', b1: 'list' });
    const atC = arrive(atA.list, items, 'c');
    expect(atC.picked).toEqual([]);
    const home = arrive(atC.list, items, 'home');
    expect(home.delivered).toEqual(['a1']);
    expect(home.complete).toBe(false);
    const atB = arrive(home.list, items, 'b');
    expect(atB.picked).toEqual(['b1', 'b2']);
    const done = arrive(atB.list, items, 'home');
    expect(done.delivered).toEqual(['b1', 'b2']);
    expect(done.complete).toBe(true);
    list = { a1: 'list', b1: 'list', b2: 'list' };
    expect(arrive(list, items, 'home').delivered).toEqual([]);
  });

  it('formats the run clock', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(67_400)).toBe('1:07');
  });
});
