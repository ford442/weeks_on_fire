import { useEffect, useRef, useState } from 'react';

import {
  arrive,
  BARRICADE,
  BLOCKS,
  CAR_R,
  clock,
  CLOSED_BLOCKS,
  collides,
  CROSSWALK,
  drive,
  follow,
  H,
  HOME_LOT,
  HY,
  leftSpot,
  mustYield,
  newList,
  parkedAt,
  parkedCar,
  ROAD,
  route,
  stepGate,
  stepWalker,
  STORE_LOTS,
  VX,
  W,
  walkerOnRoad,
  walkerRect,
  type Car,
  type Gate,
  type ItemState,
  type Lot,
  type Rect,
  type ShoppingList,
  type Vec,
  type Walker,
} from './errands';
import { home, items, lines, stores } from './errandsCopy';
import { drawSnake, prefersReducedMotion, spawnSnake, stepSnake, type Snake } from './laserSnake';

/**
 * Errands: drive the Two's silver Lamborghini around the block, pick up the list, bring it home.
 * Vanilla canvas over the pure engine in `errands.ts`; arrows / WASD to drive, or click anywhere
 * (or a place in the panel) to drive there. No fail state, no persistence.
 *
 * Under `prefers-reduced-motion` (or with no canvas) nothing moves: the panel's places teleport
 * the car and the snakes are drawn once, resting.
 */

type Place = { id: string; name: string; sign: string; blurb: string; lot: Lot };

const PLACES: Place[] = [
  { id: 'home', ...home, lot: HOME_LOT },
  ...stores.slice(0, STORE_LOTS.length).map((s, i) => ({ ...s, lot: STORE_LOTS[i]! })),
];
const placeName = (id: string) => PLACES.find((p) => p.id === id)?.name ?? id;
const itemById = (id: string) => items.find((i) => i.id === id);

const STATE_LABEL: Record<ItemState, string> = {
  list: 'To get',
  car: 'In the car',
  home: 'Home',
};

const pick = <T,>(xs: readonly T[]): T | undefined => xs[Math.floor(Math.random() * xs.length)];

// ---------------------------------------------------------------------------------------------
// Sound: the elevator chime, plus one extra ding a beat late.

type AudioCtor = typeof AudioContext;
let audio: AudioContext | null = null;

function unlockAudio() {
  if (typeof window === 'undefined') return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return;
  try {
    audio ??= new Ctor();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    audio = null;
  }
}

function ding() {
  if (!audio || audio.state !== 'running') return;
  const notes: [number, number][] = [
    [1318.5, 0],
    [1046.5, 0.3],
    [1174.7, 1.05],
  ];
  for (const [freq, delay] of notes) {
    const t = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 1);
  }
}

// ---------------------------------------------------------------------------------------------
// Drawing

const inside = (p: Vec, r: Rect, pad = 0) =>
  p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;

function drawStreets(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#120c17';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1c1722';
  for (const x of VX) ctx.fillRect(x - ROAD / 2, 0, ROAD, H);
  for (const y of HY) ctx.fillRect(0, y - ROAD / 2, W, ROAD);
  ctx.save();
  ctx.strokeStyle = 'rgba(253, 186, 116, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  for (const x of VX) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (const y of HY) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.restore();
  // The Pizza Guy's crosswalk.
  ctx.fillStyle = 'rgba(244, 244, 245, 0.16)';
  const cx = VX[2] - ROAD / 2;
  for (let i = 0; i < 5; i++) ctx.fillRect(cx + 2 + i * 8, CROSSWALK.y - 9, 4, 18);
}

function drawBlock(ctx: CanvasRenderingContext2D, b: Rect, fill: string, edge: string) {
  ctx.fillStyle = '#2a2230';
  ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
  ctx.fillStyle = fill;
  ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
}

function drawClosed(ctx: CanvasRenderingContext2D, b: Rect, seed: number) {
  drawBlock(ctx, b, '#17111c', '#2e2536');
  // A few lit windows, the same ones every night.
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 6; col++) {
      const lit = (row * 7 + col * 3 + seed) % 5 === 0;
      ctx.fillStyle = lit ? 'rgba(251, 191, 36, 0.35)' : 'rgba(63, 52, 74, 0.6)';
      ctx.fillRect(b.x + 22 + col * 24, b.y + 26 + row * 32, 12, 14);
    }
}

function drawSign(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
) {
  ctx.save();
  ctx.font = '900 18px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}

function drawPlace(ctx: CanvasRenderingContext2D, p: Place, wanted: boolean, pulse: number) {
  const { block: b, spot, door } = p.lot;
  const isHome = p.id === 'home';
  drawBlock(ctx, b, isHome ? '#1f1a24' : '#24182c', isHome ? '#7c2d12' : '#701a75');
  const doorY = door === 'top' ? b.y - 4 : b.y + b.h - 8;
  // Driveway, then the door.
  ctx.fillStyle = '#2a2230';
  ctx.fillRect(spot.x - 16, door === 'top' ? b.y - 4 : b.y + b.h - 6, 32, 10);
  ctx.fillStyle = isHome ? 'rgba(251, 146, 60, 0.7)' : 'rgba(232, 121, 249, 0.6)';
  ctx.fillRect(spot.x - 12, doorY, 24, 12);
  if (isHome) {
    // The laundry room: one dryer door, glowing.
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2 + 22, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.28)';
    ctx.fill();
    ctx.strokeStyle = '#4b4356';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  drawSign(ctx, p.sign, b.x + b.w / 2, b.y + b.h / 2 - 16, isHome ? '#fdba74' : '#f0abfc');
  // The marker: bright and breathing when there is a reason to stop.
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, 14 + (wanted ? Math.sin(pulse) * 3 : 0), 0, Math.PI * 2);
  ctx.strokeStyle = wanted
    ? isHome
      ? 'rgba(232, 121, 249, 0.9)'
      : 'rgba(253, 186, 116, 0.95)'
    : 'rgba(161, 161, 170, 0.22)';
  ctx.lineWidth = wanted ? 3 : 1.5;
  ctx.stroke();
}

function drawBarricade(ctx: CanvasRenderingContext2D, closed: boolean) {
  const { rect: r, at } = BARRICADE;
  ctx.fillStyle = '#52525b';
  ctx.fillRect(at.x - 2, r.y - 6, 4, 6);
  ctx.fillRect(at.x - 2, r.y + r.h, 4, 6);
  if (closed) {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#f4f4f5' : '#f97316';
      ctx.fillRect(r.x, r.y + (i * r.h) / 5, r.w, r.h / 5);
    }
  } else {
    // Raised: folded against the curb.
    ctx.fillStyle = 'rgba(249, 115, 22, 0.55)';
    ctx.fillRect(at.x - 1.5, r.y - 22, 3, 18);
  }
  ctx.font = '700 8px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(228, 228, 231, 0.6)';
  ctx.fillText('7-09B', at.x, r.y - 26);
}

function drawPizzaGuy(ctx: CanvasRenderingContext2D, w: Walker) {
  ctx.save();
  ctx.translate(w.x, CROSSWALK.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(1, 2, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders, cap, and the bag held at chest height, out front.
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-5, -4, 10, 8);
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(w.dir * 5 - 3.5, -5, 7, 10);
  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, car: Car, frame: number) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);
  // Headlights.
  ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createRadialGradient(22, 0, 2, 34, 0, 34);
  beam.addColorStop(0, 'rgba(254, 243, 199, 0.32)');
  beam.addColorStop(1, 'rgba(254, 243, 199, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(14, -6);
  ctx.lineTo(62, -22);
  ctx.lineTo(62, 22);
  ctx.lineTo(14, 6);
  ctx.closePath();
  ctx.fill();
  if (car.stall > 0 && frame % 6 < 3) {
    ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-15, -7, 32, 16);
  // The body: a low silver wedge.
  const body = ctx.createLinearGradient(0, -8, 0, 8);
  body.addColorStop(0, '#f4f4f5');
  body.addColorStop(0.5, '#a1a1aa');
  body.addColorStop(1, '#d4d4d8');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(11, -7);
  ctx.lineTo(-13, -8);
  ctx.lineTo(-16, -6);
  ctx.lineTo(-16, 6);
  ctx.lineTo(-13, 8);
  ctx.lineTo(11, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(7, -5);
  ctx.lineTo(0, -6);
  ctx.lineTo(-6, -5.5);
  ctx.lineTo(-6, 5.5);
  ctx.lineTo(0, 6);
  ctx.lineTo(7, 5);
  ctx.closePath();
  ctx.fill();
  // Two heads of long black hair, side by side.
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-2, -2.8, 2.4, 0, Math.PI * 2);
  ctx.arc(-2, 2.8, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-16, -6, 1.5, 3);
  ctx.fillRect(-16, 3, 1.5, 3);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------

type Api = { goTo: (id: string) => void; reset: () => void };

export default function ErrandsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const soundRef = useRef(true);
  const [list, setList] = useState<ShoppingList>(() => newList(items));
  const listRef = useRef(list);
  const [toast, setToast] = useState('');
  const [still, setStill] = useState(false);
  const [sound, setSound] = useState(true);
  const [heading, setHeading] = useState<string | null>(null);
  const [started, setStarted] = useState<number | null>(null);
  const [finished, setFinished] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // The run clock ticks only while a run is on.
  useEffect(() => {
    if (started === null || finished !== null) return;
    setNow(performance.now());
    const id = window.setInterval(() => setNow(performance.now()), 500);
    return () => window.clearInterval(id);
  }, [started, finished]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (canvas && ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let reduced = !ctx || prefersReducedMotion();
    setStill(reduced);

    let car = parkedCar();
    let path: Vec[] | null = null;
    let dest: string | null = null;
    let parked: string | null = 'home';
    let startedAt: number | null = null;
    const gate: Gate = { closed: false, t: 0 };
    const walker: Walker = { x: CROSSWALK.x0, dir: 1, wait: 120 };
    let yielded = false;
    let snakeCooldown = 0;
    let frameNo = 0;
    const keys = new Set<string>();

    const makeSnake = () => {
      const s = spawnSnake(W, H);
      s.speed *= 1.2;
      return s;
    };
    let snakes: Snake[] = [makeSnake(), makeSnake()];
    snakes[1]!.age = -360;
    const freeze = () => {
      snakes = [makeSnake(), makeSnake()].map((s) => {
        s.x = 80 + Math.random() * (W - 160);
        s.y = 80 + Math.random() * (H - 160);
        for (let i = 0; i < 60; i++) stepSnake(s);
        s.age = 200;
        return s;
      });
    };
    if (reduced) freeze();

    const say = (text: string) => setToast(text);
    const markStart = () => {
      if (startedAt !== null) return;
      startedAt = performance.now();
      setStarted(startedAt);
    };

    const applyArrival = (placeId: string) => {
      const res = arrive(listRef.current, items, placeId);
      listRef.current = res.list;
      setList(res.list);
      if (res.picked.length)
        say(
          res.picked
            .map((id) => itemById(id)?.pickup ?? '')
            .filter(Boolean)
            .join(' '),
        );
      else if (placeId === 'home') {
        if (!res.delivered.length) say(lines.homeEmpty);
        else {
          if (soundRef.current) ding();
          say(res.complete ? lines.complete : (pick(lines.delivered) ?? ''));
        }
      } else say(lines.storeNothing);
      if (res.complete && res.delivered.length) {
        const end = performance.now();
        setFinished(end - (startedAt ?? end));
      }
    };

    const wanted = (p: Place) =>
      p.id === 'home'
        ? Object.values(listRef.current).includes('car')
        : Object.entries(listRef.current).some(
            ([id, s]) => s === 'list' && itemById(id)?.storeId === p.id,
          );

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      drawStreets(ctx);
      CLOSED_BLOCKS.forEach((b, i) => drawClosed(ctx, b, i * 2));
      for (const p of PLACES) drawPlace(ctx, p, wanted(p), frameNo * 0.08);
      if (path?.length) {
        ctx.save();
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.35)';
        ctx.setLineDash([2, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(car.x, car.y);
        for (const q of path) ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.restore();
      }
      drawBarricade(ctx, gate.closed);
      drawPizzaGuy(ctx, walker);
      drawCar(ctx, car, frameNo);
      ctx.globalCompositeOperation = 'lighter';
      for (const s of snakes) if (s.age >= 0) drawSnake(ctx, s, 1.4);
      ctx.globalCompositeOperation = 'source-over';
    };

    const goTo = (id: string) => {
      unlockAudio();
      const place = PLACES.find((p) => p.id === id);
      if (!place) return;
      markStart();
      if (reduced) {
        car = parkedCar(place.lot);
        path = null;
        dest = null;
        parked = id;
        setHeading(null);
        applyArrival(id);
        render();
        return;
      }
      if (parked === id) {
        applyArrival(id);
        return;
      }
      dest = id;
      path = route(car, place.lot.spot, gate.closed);
      setHeading(id);
    };

    const reset = () => {
      const fresh = newList(items);
      listRef.current = fresh;
      setList(fresh);
      car = parkedCar();
      path = null;
      dest = null;
      parked = 'home';
      startedAt = null;
      setStarted(null);
      setFinished(null);
      setHeading(null);
      setToast('');
      render();
    };
    api.current = { goTo, reset };

    const step = (dt: number) => {
      frameNo += 1;
      const throttle = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0);
      const steer = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      if (throttle || steer) {
        markStart();
        if (path) {
          path = null;
          dest = null;
          setHeading(null);
        }
      }

      const change = stepGate(gate, dt, collides(car, CAR_R + 4, [BARRICADE.rect]));
      if (change) {
        const near = Math.hypot(car.x - BARRICADE.at.x, car.y - BARRICADE.at.y) < 140;
        if (change === 'closed' && (near || path)) say(lines.checkpoint);
        if (path && dest) {
          const place = PLACES.find((p) => p.id === dest);
          if (place) path = route(car, place.lot.spot, gate.closed);
        }
      }

      stepWalker(walker, dt);
      if (!walkerOnRoad(walker)) yielded = false;

      snakeCooldown = Math.max(0, snakeCooldown - dt);
      snakes = snakes.map((s) => {
        const out = s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60;
        if (s.age < 0) {
          s.age += 1;
          return s;
        }
        if (s.age > s.life || (out && s.age > 60)) {
          const n = makeSnake();
          n.age = -Math.floor(120 + Math.random() * 300);
          return n;
        }
        stepSnake(s);
        if (
          s.age > 30 &&
          snakeCooldown === 0 &&
          car.stall === 0 &&
          Math.hypot(s.x - car.x, s.y - car.y) < 16
        ) {
          car.stall = 50;
          snakeCooldown = 180;
          say(lines.snake);
        }
        return s;
      });

      if (path) {
        const hold = mustYield(car, walker);
        if (hold && !yielded) {
          yielded = true;
          say(lines.pizzaGuy);
        }
        if (follow(car, path, dt, hold)) {
          path = null;
          setHeading(null);
        }
      } else {
        const solids: Rect[] = [...BLOCKS];
        if (gate.closed) solids.push(BARRICADE.rect);
        if (walkerOnRoad(walker)) solids.push(walkerRect(walker));
        const before = { x: car.x, y: car.y };
        drive(car, { throttle, steer }, dt, solids);
        const bumped = throttle !== 0 && Math.hypot(car.x - before.x, car.y - before.y) < 0.05;
        if (
          bumped &&
          !yielded &&
          walkerOnRoad(walker) &&
          Math.hypot(walker.x - car.x, CROSSWALK.y - car.y) < 30
        ) {
          yielded = true;
          say(lines.pizzaGuy);
        }
      }

      if (parked) {
        const lot = PLACES.find((p) => p.id === parked)?.lot;
        if (!lot || leftSpot(car, lot.spot)) parked = null;
      }
      if (!path && !parked)
        for (const p of PLACES)
          if (parkedAt(car, p.lot.spot)) {
            parked = p.id;
            dest = null;
            applyArrival(p.id);
            break;
          }
    };

    let raf = 0;
    let running = false;
    let last = 0;
    const frame = (ts: number) => {
      const dt = last ? Math.min(3, (ts - last) / (1000 / 60)) : 1;
      last = ts;
      step(dt);
      render();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || reduced || !ctx || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const KEYS: Record<string, string> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
      W: 'up',
      S: 'down',
      A: 'left',
      D: 'right',
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      const k = KEYS[ev.key];
      if (!k || reduced) return;
      ev.preventDefault();
      unlockAudio();
      keys.add(k);
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      const k = KEYS[ev.key];
      if (k) keys.delete(k);
    };
    const onBlur = () => keys.clear();
    const onPointer = (ev: PointerEvent) => {
      if (!canvas) return;
      unlockAudio();
      const r = canvas.getBoundingClientRect();
      const p = {
        x: ((ev.clientX - r.left) / r.width) * W,
        y: ((ev.clientY - r.top) / r.height) * H,
      };
      const place = PLACES.find(
        (pl) =>
          inside(p, pl.lot.block, 4) || Math.hypot(p.x - pl.lot.spot.x, p.y - pl.lot.spot.y) < 26,
      );
      if (place) return goTo(place.id);
      if (reduced) return;
      markStart();
      dest = null;
      path = route(car, p, gate.closed);
      setHeading(null);
    };

    render();
    start();

    const onVisibility = () => (document.hidden ? stop() : start());
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotion = () => {
      reduced = !ctx || !!mq?.matches;
      setStill(reduced);
      keys.clear();
      if (reduced) {
        stop();
        path = null;
        car.speed = 0;
        freeze();
        render();
      } else start();
    };
    canvas?.addEventListener('keydown', onKeyDown);
    canvas?.addEventListener('keyup', onKeyUp);
    canvas?.addEventListener('blur', onBlur);
    canvas?.addEventListener('pointerdown', onPointer);
    document.addEventListener('visibilitychange', onVisibility);
    mq?.addEventListener?.('change', onMotion);
    return () => {
      stop();
      api.current = null;
      canvas?.removeEventListener('keydown', onKeyDown);
      canvas?.removeEventListener('keyup', onKeyUp);
      canvas?.removeEventListener('blur', onBlur);
      canvas?.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      mq?.removeEventListener?.('change', onMotion);
    };
  }, []);

  const entries = Object.entries(list);
  const done = entries.filter(([, s]) => s === 'home').length;
  const elapsed = finished ?? (started === null ? 0 : Math.max(0, now - started));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <figure className="rounded-2xl border border-fuchsia-900/50 bg-zinc-950 p-3">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label="A night map of the building and three stores, with a silver Lamborghini parked outside the laundry room. Drive with the arrow keys or WASD, or click where to go."
          className="block aspect-[720/480] w-full cursor-crosshair touch-none select-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
        />
        <figcaption className="mt-3 px-1 text-sm text-zinc-400">
          {still
            ? `${lines.stillMode} Pick a place from the panel to go there.`
            : 'Arrow keys or WASD to drive (click the map first), or click anywhere — a store, home, a road — to drive there.'}
        </figcaption>
      </figure>

      <aside className="flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
        <section aria-labelledby="errands-list">
          <div className="flex items-baseline justify-between">
            <h2
              id="errands-list"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300"
            >
              The list
            </h2>
            <span className="font-mono text-xs text-zinc-400">
              {done}/{entries.length}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {entries.map(([id, state]) => {
              const item = itemById(id);
              return (
                <li key={id} className="flex items-start justify-between gap-2">
                  <span
                    className={state === 'home' ? 'text-zinc-500 line-through' : 'text-zinc-200'}
                  >
                    {item?.label ?? id}
                    <span className="block text-xs text-zinc-500 no-underline">
                      {item ? placeName(item.storeId) : ''}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      state === 'home'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : state === 'car'
                          ? 'bg-fuchsia-500/20 text-fuchsia-200'
                          : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {STATE_LABEL[state]}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="errands-places">
          <h2
            id="errands-places"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300"
          >
            {still ? 'Go to' : 'Drive to'}
          </h2>
          <ul className="mt-2 space-y-1.5">
            {PLACES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => api.current?.goTo(p.id)}
                  aria-label={`${still ? 'Go to' : 'Drive to'} ${p.name}`}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-fuchsia-300 ${
                    heading === p.id
                      ? 'border-fuchsia-400/70 bg-fuchsia-500/15 text-white'
                      : 'border-zinc-800 text-zinc-200 hover:border-fuchsia-700 hover:text-white'
                  }`}
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="block text-xs text-zinc-400">{p.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p
          aria-live="polite"
          className="min-h-[3rem] border-l-2 border-orange-400/60 pl-3 text-sm italic text-orange-100"
        >
          {toast}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-mono text-orange-300" aria-label="Run time">
            {clock(elapsed)}
            {finished !== null && ' · list complete'}
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              aria-pressed={sound}
              onClick={() => setSound((s) => !s)}
              className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
            >
              Ding {sound ? 'on' : 'off'}
            </button>
            <button
              type="button"
              onClick={() => api.current?.reset()}
              className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-500/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
            >
              New list
            </button>
          </span>
        </div>
      </aside>
    </div>
  );
}
