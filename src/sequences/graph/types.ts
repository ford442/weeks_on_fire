import type { Vec3 } from '../../lib/webgl/math';

/**
 * Scene graph for JSON-authored 3D sequences. Authored as `content/sequences/<id>.graph.json`
 * (or a `graph` key on the sequence record), validated by `scripts/content-index/graph-schema.ts`
 * and played by `createGraphScene`. Angles are degrees; times are seconds of film time.
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

export type GraphCamera =
  | { type: 'locked'; eye: Vec3; target: Vec3; fov?: number }
  | {
      type: 'perspective';
      eye: Animated<Vec3>;
      target: Animated<Vec3>;
      fov?: Animated<number>;
    }
  | {
      type: 'orbit';
      /** Point the camera circles and looks at. Defaults to the origin. */
      target?: Animated<Vec3>;
      radius: Animated<number>;
      /** Eye height above the world origin's y (not above `target`). */
      height: Animated<number>;
      /** Degrees around Y; 0 puts the eye on +Z, 90 on +X. */
      angle: Animated<number>;
      fov?: Animated<number>;
    };

export interface GraphEnvironment {
  background?: Vec3;
  lightDir?: Vec3;
  lightColor?: Vec3;
  ambient?: Vec3;
  fogDensity?: number;
  fogColor?: Vec3;
}

export type GraphGeometry =
  | { type: 'box'; size: Vec3 }
  | { type: 'sphere'; radius: number; lat?: number; long?: number }
  | { type: 'cylinder'; radius: number; height: number; radial?: number; caps?: boolean }
  | { type: 'torus'; major: number; minor: number; majorSeg?: number; minorSeg?: number }
  | { type: 'plane'; width: number; depth: number; nx?: number; nz?: number }
  | { type: 'icosahedron'; radius: number }
  /** Surface of revolution around Y. `profile` is `[radius, y]` pairs, bottom to top. */
  | { type: 'lathe'; profile: [number, number][]; segments?: number }
  | { type: 'lineCube'; size: number }
  | { type: 'icosahedronLines'; radius: number }
  /** Polyline through `points`. */
  | { type: 'line'; points: Vec3[]; closed?: boolean }
  /** Seeded random cloud: radius in [min, max], y scaled by `flatten`. */
  | { type: 'points'; count: number; radius: [number, number]; flatten?: number; seed?: number };

export type GraphMaterial =
  | { kind: 'lit' | 'cel'; color: Vec3; emissive?: Vec3; shininess?: number; outline?: boolean }
  /** Flat colour (still fogged). On `points` geometry, `size` (px) and `alpha` apply. */
  | { kind: 'unlit'; color: Vec3; size?: number; alpha?: number }
  | { kind: 'line'; color: Vec3 };

export interface GraphNode {
  id: string;
  geometry: GraphGeometry;
  material: GraphMaterial;
  translation?: Vec3;
  /** Euler XYZ, degrees. */
  rotation?: Vec3;
  scale?: Vec3;
  /** Continuous rotation in degrees per second, added on top of `rotation`. */
  spin?: Vec3;
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

export interface SequenceGraph {
  camera: GraphCamera;
  environment?: GraphEnvironment;
  nodes: GraphNode[];
  clips?: GraphClip[];
  /** After `outSec`, scene time wraps back to `inSec`. */
  loop?: { inSec: number; outSec: number };
}
