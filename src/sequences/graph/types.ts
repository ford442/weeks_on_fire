import type { Vec3 } from '../../lib/webgl/math';

/**
 * Scene graph for JSON-authored 3D sequences (graph v2). Authored as
 * `content/sequences/<id>.graph.json` (or a `graph` key on the sequence record), validated by
 * `schema.ts` and played by `createGraphScene`. Angles are degrees; times are seconds of film
 * time. The authoring guide is `content/README.md` → "Authoring a 3D sequence".
 */

/** Easing applied to the segment that starts at a keyframe. `hold` keeps the value until the next key. */
export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'hold';

export interface Keyframe<T> {
  t: number;
  v: T;
  ease?: Ease;
}

/** A constant, or keyframes (ascending `t`, held flat before the first and after the last). */
export type Animated<T> = T | Keyframe<T>[];

/**
 * An expression string (see `expr.ts`), e.g. `"0.55 + abs(sin(t * 8)) * 0.28"`. It may read the
 * built-ins (`t`, `p`, `dur`, `i`, `n`, `k`), the graph's `vars`, and the `vars` of the node and
 * its ancestors.
 */
export type Expr = string;

/** A number: constant, expression, or keyframes. */
export type Scalar = number | Expr | Keyframe<number>[];

/** A vector: `[x, y, z]` where each part is a number or an expression, or vector keyframes. */
export type Vector = [number | Expr, number | Expr, number | Expr] | Keyframe<Vec3>[];

interface Lens {
  /** Near clip plane. Default 0.1. */
  near?: number;
  /** Far clip plane. Default 60. */
  far?: number;
}

export type GraphCamera =
  | ({ type: 'locked'; eye: Vec3; target: Vec3; fov?: number } & Lens)
  | ({
      type: 'perspective';
      eye: Vector;
      target: Vector;
      fov?: Scalar;
    } & Lens)
  | ({
      type: 'orbit';
      /** Point the camera circles and looks at. Defaults to the origin. */
      target?: Vector;
      radius: Scalar;
      /** Eye height above the world origin's y (not above `target`). */
      height: Scalar;
      /** Degrees around Y; 0 puts the eye on +Z, 90 on +X. */
      angle: Scalar;
      fov?: Scalar;
    } & Lens);

export interface GraphPointLight {
  position: Vector;
  color: Vector;
  /** Distance at which it fades out; 0 turns it off. */
  range: Scalar;
}

export interface GraphEnvironment {
  background?: Vector;
  lightDir?: Vector;
  lightColor?: Vector;
  ambient?: Vector;
  fogDensity?: Scalar;
  fogColor?: Vector;
  pointLight?: GraphPointLight;
}

/** Particles: emitted over time, moved by the geometry kernel at a fixed 60 Hz step. Seekable. */
export interface GraphEmitter {
  type: 'emitter';
  /** Particles per second (constant or keyframed). */
  rate?: Animated<number>;
  /** `{ t, v }`: emit `v` particles at once at time `t`. */
  burst?: Keyframe<number>[];
  /** Seconds each particle lives. */
  life: number;
  /** Launch speed, or `[min, max]`. */
  speed: number | [number, number];
  /** Launch direction (node space). Default up, `[0, 1, 0]`. */
  direction?: Vec3;
  /** Cone half-angle around `direction`, degrees. 0 = a jet, 180 = every way. Default 30. */
  spread?: number;
  /** Units / s². Default none. */
  gravity?: Vec3;
  /** Per second: speed falls by `exp(-drag * dt)`. Default 0. */
  drag?: number;
  /** Spawn point (node space). Default the node origin. */
  origin?: Vec3;
  /** Spawn anywhere within this distance of `origin`. Default 0. */
  radius?: number;
  /** Particles bounce off this height (node space). */
  floorY?: number;
  /** Share of vertical speed kept by a bounce. Default 0.5. */
  bounce?: number;
  seed?: number;
  /** Most particles alive at once; derived from rate, life and bursts when omitted. */
  capacity?: number;
}

export type GraphGeometry =
  | { type: 'box'; size: Vec3 }
  | { type: 'sphere'; radius: number; lat?: number; long?: number }
  | { type: 'cylinder'; radius: number; height: number; radial?: number; caps?: boolean }
  | { type: 'torus'; major: number; minor: number; majorSeg?: number; minorSeg?: number }
  /** XZ plane, checker vertex colours (use `vertexColor` on a lit material to show them). */
  | { type: 'plane'; width: number; depth: number; nx?: number; nz?: number }
  | { type: 'icosahedron'; radius: number }
  /** Surface of revolution around Y. `profile` is `[radius, y]` pairs, bottom to top. */
  | { type: 'lathe'; profile: [number, number][]; segments?: number }
  | { type: 'lineCube'; size: number }
  | { type: 'icosahedronLines'; radius: number }
  /** Polyline through `points`. */
  | { type: 'line'; points: Vec3[]; closed?: boolean }
  /** Seeded random cloud: radius in [min, max], y scaled by `flatten`. */
  | { type: 'points'; count: number; radius: [number, number]; flatten?: number; seed?: number }
  /**
   * `count` points placed every frame by `position`. Inside a field, `i` is the point index and
   * `n` the count; the field's own `vars` are evaluated per point, before `position`.
   */
  | { type: 'field'; count: number; vars?: Record<string, Scalar>; position: Vector }
  | GraphEmitter
  /** Möbius band (`mix` 0) morphing into a (2,3) torus-knot ribbon (`mix` 1). */
  | { type: 'ribbon'; mix: Scalar; uSegments?: number; vSegments?: number }
  /**
   * Rubber-hose tube from `from` to `to` (node space). Closer together than `length`, it bows
   * into an arc of that length toward `bend` (default up); farther apart, it stretches straight.
   */
  | {
      type: 'hose';
      from: Vector;
      to: Vector;
      length: number;
      radius: number;
      bend?: Vec3;
      /** Points along the hose. Default 12. */
      samples?: number;
      /** Sides around it. Default 8. */
      radial?: number;
    };

/** Geometry rebuilt or rewritten every frame. These nodes cannot have copies. */
export const DYNAMIC_GEOMETRY = ['field', 'emitter', 'ribbon', 'hose'] as const;
/** Geometry drawn as point sprites. */
export const POINT_GEOMETRY = ['points', 'field', 'emitter'] as const;

export type GraphMaterial =
  | {
      kind: 'lit' | 'cel';
      color: Vector;
      emissive?: Vector;
      /** Emissive as a share of `color` (cel parts use 0.22). Not with `emissive`. */
      glow?: number;
      shininess?: number;
      outline?: boolean;
      /** Shade with the mesh's vertex colours (the plane's checker) instead of `color`. */
      vertexColor?: boolean;
    }
  /** Flat colour (still fogged). On point geometry, `size` (px) and `alpha` apply. */
  | { kind: 'unlit'; color: Vector; size?: Scalar; alpha?: Scalar }
  | { kind: 'line'; color: Vector };

/** Copies of a node (and its children), placed by `layout`; expressions read `i` and `n`. */
export interface GraphInstances {
  count: number;
  /**
   * `line`: copy `i` at `i * spacing`. `grid`: `columns` wide on XZ, centred, cell `spacing`.
   * `ring`: on a circle of `radius` around Y. `explicit`: at `points[i]`. Omitted: all at the
   * node's origin (place them with `i` in expressions).
   */
  layout?: 'line' | 'grid' | 'ring' | 'explicit';
  spacing?: Vec3;
  columns?: number;
  radius?: number;
  points?: Vec3[];
  /** Seeded random offset per copy, up to this far on each axis. */
  jitter?: number | Vec3;
  seed?: number;
}

/**
 * Treadmill copies along an axis: copy `k` sits at `k * period - mod(offset + speed * t, period)`,
 * so the set scrolls toward minus `axis` and wraps. Expressions read `k` (centred on 0).
 */
export interface GraphRepeat {
  axis: 'x' | 'y' | 'z';
  period: number;
  /** Default 3 (`k` = -1, 0, 1). */
  copies?: number;
  /** Units per second. */
  speed?: number;
  /** Distance scrolled; added to `speed * t`. */
  offset?: Scalar;
}

/** Jelly wobble: squash `1 + amp * sin(2π freq (t - start)) * exp(-decay (t - start))` after `start`. */
export interface GraphWobble {
  amp: Scalar;
  freq: number;
  decay?: number;
  start?: number;
}

export interface GraphNode {
  id: string;
  /** A node earlier in `nodes`; this node's transform is relative to it. */
  parent?: string;
  /** Omit geometry and material for a group: a transform (and vars) for children. */
  geometry?: GraphGeometry;
  material?: GraphMaterial;
  translation?: Vector;
  /** Euler XYZ, degrees. */
  rotation?: Vector;
  scale?: Vector;
  /** Continuous rotation in degrees per second, added on top of `rotation`. */
  spin?: Vec3;
  /** Volume-preserving squash along local Y: 0.5 = half height, wider. Children squash too. */
  squash?: Scalar;
  wobble?: GraphWobble;
  /** Drawn while > 0 (and while its parent is). */
  visible?: Scalar;
  /** Named numbers for this node's (and its children's) expressions, in order: constants, expressions or keyframes. */
  vars?: Record<string, Scalar>;
  instances?: GraphInstances;
  repeat?: GraphRepeat;
}

export type NodeProperty = 'translation' | 'rotation' | 'scale' | 'emissive' | 'alpha';
export type SceneProperty = 'fogDensity';

export interface GraphClip {
  /** A node id, or `scene` for `fogDensity`. */
  target: string;
  property: NodeProperty | SceneProperty;
  keys: Keyframe<number | Vec3>[];
  /** Default ease for keys that do not set their own. */
  ease?: Ease;
}

export interface GraphMarker {
  t: number;
  label: string;
}

export interface GraphPost {
  /** Darkens toward the corners: `strength` 0-1, from `radius` (0-1.5 of the half-diagonal) out over `softness`. */
  vignette?: { strength: number; radius?: number; softness?: number };
  /**
   * Afterimages: the film `count` times at `spacing` seconds (default 1/24) earlier, each
   * weighted `decay^k`, lightening (or darkening) only. Deterministic (re-drawn, not accumulated), so
   * seeking and capture show the same frame.
   */
  ghosts?: {
    count: number;
    decay: number;
    spacing?: number;
    /** `lighten` (default): bright things trail on dark ground. `darken`: dark things trail on bright ground. */
    mode?: 'lighten' | 'darken';
  };
}

export interface SequenceGraph {
  camera: GraphCamera;
  environment?: GraphEnvironment;
  /** Named numbers every expression can read (constants, expressions or keyframes), in order, once per frame. */
  vars?: Record<string, Scalar>;
  nodes: GraphNode[];
  clips?: GraphClip[];
  /** After `outSec`, scene time wraps back to `inSec`. */
  loop?: { inSec: number; outSec: number };
  /** Named beats (Timeline can reference them). Ascending `t`. */
  markers?: GraphMarker[];
  post?: GraphPost;
}
