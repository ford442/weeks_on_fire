import { createInstancingSupport, type InstancingSupport } from './instancing';
import { tsKernel, type GeometryKernel } from './kernel';
import {
  DEFAULT_SHININESS,
  INSTANCE_FLOATS,
  INSTANCE_LAYOUT,
  type InstanceBatch,
} from './instances';
import {
  createMat4,
  identity,
  multiply,
  normalFromMat4,
  scaleMat,
  type Mat4,
  type Vec3,
} from './math';
import { PostPass } from './post';
import { compileProgram, type ShaderProgram } from './program';
import { composeShader, shaderSources } from './shaders';
import { createVaoSupport, getVaoSupport, type VaoSupport } from './vao';

import type { MeshData } from './mesh';
import type { SequenceGl } from './context';

export interface LitOptions {
  color: Vec3;
  emissive?: Vec3;
  shininess?: number;
  cel?: boolean;
  useVertexColor?: boolean;
}

/** Shading switches shared by every instance of an instanced lit draw. */
export interface InstancedLitOptions {
  cel?: boolean;
  /** Use the mesh's vertex colours instead of each instance's colour (checker floors). */
  useVertexColor?: boolean;
}

/** Per-frame GL work counters; reset by `beginFrame()`. */
export interface EngineFrameStats {
  drawCalls: number;
  instances: number;
  uniformCalls: number;
  bufferUploads: number;
}

/** The engine's instance buffer and how to draw from it; shared by every mesh's instanced VAO. */
interface EngineInstancing {
  support: InstancingSupport;
  buffer: WebGLBuffer;
}

const ATTRIBUTES = {
  aPosition: 0,
  aNormal: 1,
  aColor: 2,
  aModel: 3,
  aInstanceColor: 7,
  aInstanceEmissive: 8,
};
const INSTANCE_STRIDE_BYTES = INSTANCE_FLOATS * 4;
const NO_EMISSIVE: Vec3 = [0, 0, 0];

/**
 * `FrameBlock` (shaders/frame.block.glsl) in floats. std140 with only mat4 / vec4 members, so
 * the offsets are plain sums; WebGL1 uploads the same slices as separate uniforms.
 */
const FRAME_LAYOUT = {
  proj: 0,
  view: 16,
  eyeFog: 32,
  lightDir: 36,
  lightColor: 40,
  ambient: 44,
  fogColor: 48,
  pointPosRange: 52,
  pointColor: 56,
  floats: 60,
} as const;
const FRAME_BINDING = 0;

/** Counters per context, so meshes can count their own uploads and draws. */
const statsByGl = new WeakMap<object, EngineFrameStats>();

function isWebGL2(gl: SequenceGl): gl is WebGL2RenderingContext {
  return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
}

export class GpuMesh {
  readonly mode: number;
  readonly vertexCount: number;
  readonly indexCount: number;
  private readonly pos: WebGLBuffer;
  private readonly nrm: WebGLBuffer | null;
  private readonly col: WebGLBuffer | null;
  private readonly idx: WebGLBuffer | null;
  private readonly hasIndex: boolean;
  private readonly vaos: VaoSupport | null;
  private vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null = null;
  private instancedVao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null = null;

  constructor(
    private readonly gl: SequenceGl,
    mesh: MeshData,
  ) {
    this.vaos = getVaoSupport(gl);
    const posBuf = gl.createBuffer();
    if (!posBuf) throw new Error('Unable to create buffer');
    this.pos = posBuf;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pos);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.DYNAMIC_DRAW);
    this.countUpload();
    this.vertexCount = mesh.positions.length / 3;

    if (mesh.normals) {
      const n = gl.createBuffer();
      if (!n) throw new Error('Unable to create buffer');
      this.nrm = n;
      gl.bindBuffer(gl.ARRAY_BUFFER, n);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.DYNAMIC_DRAW);
      this.countUpload();
    } else {
      this.nrm = null;
    }

    if (mesh.colors) {
      const c = gl.createBuffer();
      if (!c) throw new Error('Unable to create buffer');
      this.col = c;
      gl.bindBuffer(gl.ARRAY_BUFFER, c);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);
      this.countUpload();
    } else {
      this.col = null;
    }

    if (mesh.indices) {
      const i = gl.createBuffer();
      if (!i) throw new Error('Unable to create buffer');
      this.idx = i;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
      this.countUpload();
      this.hasIndex = true;
      this.indexCount = mesh.indices.length;
    } else {
      this.idx = null;
      this.hasIndex = false;
      this.indexCount = this.vertexCount;
    }

    this.mode =
      mesh.mode === 'lines' ? gl.LINES : mesh.mode === 'points' ? gl.POINTS : gl.TRIANGLES;
  }

  updatePositions(positions: Float32Array): void {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);
    this.countUpload();
  }

  updateNormals(normals: Float32Array): void {
    if (!this.nrm) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nrm);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.DYNAMIC_DRAW);
    this.countUpload();
  }

  /**
   * Binds position (0), normal (1) and color (2) attributes. Attributes the mesh lacks are
   * disabled and fed a constant. Unused attributes are ignored by the line / point programs.
   */
  bind(fallbackColor: Vec3): void {
    const gl = this.gl;
    const vaos = this.vaos;
    if (vaos) {
      this.vao ??= this.buildVao(vaos, null);
    }
    if (vaos && this.vao) {
      vaos.bind(this.vao);
    } else {
      this.bindAttributes();
      if (this.hasIndex) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idx);
    }
    this.bindConstants(fallbackColor);
  }

  unbind(): void {
    if (this.vao) this.vaos?.bind(null);
  }

  /** `bind`, plus the per-instance attributes (3-8) read from the engine's instance buffer. */
  bindInstanced(fallbackColor: Vec3, instancing: EngineInstancing): void {
    const gl = this.gl;
    const vaos = this.vaos;
    if (vaos) {
      this.instancedVao ??= this.buildVao(vaos, instancing);
    }
    if (vaos && this.instancedVao) {
      vaos.bind(this.instancedVao);
    } else {
      this.bindAttributes();
      this.bindInstanceAttributes(instancing);
      if (this.hasIndex) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idx);
    }
    this.bindConstants(fallbackColor);
  }

  unbindInstanced(instancing: EngineInstancing): void {
    if (this.instancedVao) {
      this.vaos?.bind(null);
      return;
    }
    // No VAOs: put the instance slots back so the next plain draw sees plain attributes.
    for (const [location] of INSTANCE_LAYOUT) {
      instancing.support.divisor(location, 0);
      this.gl.disableVertexAttribArray(location);
    }
  }

  private bindConstants(fallbackColor: Vec3): void {
    // Current attribute values are context state, not VAO state, so they are set every bind.
    if (!this.nrm) this.gl.vertexAttrib3f(1, 0, 1, 0);
    if (!this.col) this.gl.vertexAttrib3f(2, fallbackColor[0], fallbackColor[1], fallbackColor[2]);
  }

  private buildVao(
    vaos: VaoSupport,
    instancing: EngineInstancing | null,
  ): WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null {
    const vao = vaos.create();
    if (!vao) return null;
    vaos.bind(vao);
    this.bindAttributes();
    if (instancing) this.bindInstanceAttributes(instancing);
    if (this.idx) this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.idx);
    vaos.bind(null);
    return vao;
  }

  private bindAttributes(): void {
    const gl = this.gl;
    const layout: [number, WebGLBuffer | null][] = [
      [0, this.pos],
      [1, this.nrm],
      [2, this.col],
    ];
    for (const [location, buffer] of layout) {
      if (buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
      } else {
        gl.disableVertexAttribArray(location);
      }
    }
  }

  private bindInstanceAttributes(instancing: EngineInstancing): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, instancing.buffer);
    for (const [location, size, offset] of INSTANCE_LAYOUT) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, INSTANCE_STRIDE_BYTES, offset * 4);
      instancing.support.divisor(location, 1);
    }
  }

  /** `count` draws only the first vertices of an unindexed mesh (live particles). */
  draw(count?: number): void {
    const gl = this.gl;
    if (this.hasIndex) {
      gl.drawElements(this.mode, this.indexCount, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(this.mode, 0, Math.min(count ?? this.vertexCount, this.vertexCount));
    }
    this.countDraw(1);
  }

  /** One call drawing `count` copies; per-instance data must already be in the instance buffer. */
  drawInstanced(count: number, support: InstancingSupport): void {
    if (this.hasIndex) {
      support.drawElements(this.mode, this.indexCount, this.gl.UNSIGNED_SHORT, 0, count);
    } else {
      support.drawArrays(this.mode, 0, this.vertexCount, count);
    }
    this.countDraw(count);
  }

  dispose(): void {
    const gl = this.gl;
    if (this.vao) this.vaos?.delete(this.vao);
    if (this.instancedVao) this.vaos?.delete(this.instancedVao);
    gl.deleteBuffer(this.pos);
    if (this.nrm) gl.deleteBuffer(this.nrm);
    if (this.col) gl.deleteBuffer(this.col);
    if (this.idx) gl.deleteBuffer(this.idx);
  }

  private countUpload(): void {
    const stats = statsByGl.get(this.gl);
    if (stats) stats.bufferUploads += 1;
  }

  private countDraw(instances: number): void {
    const stats = statsByGl.get(this.gl);
    if (!stats) return;
    stats.drawCalls += 1;
    stats.instances += instances;
  }
}

export class SequenceEngine {
  readonly gl: SequenceGl;
  /** CPU geometry (mesh builders, particles, hoses); chosen by the renderer at init. */
  readonly kernel: GeometryKernel;
  readonly stats: EngineFrameStats = {
    drawCalls: 0,
    instances: 0,
    uniformCalls: 0,
    bufferUploads: 0,
  };
  private readonly lit: ShaderProgram;
  private readonly line: ShaderProgram;
  private readonly point: ShaderProgram;
  private readonly litInstanced: ShaderProgram | null = null;
  private readonly lineInstanced: ShaderProgram | null = null;
  private readonly instancing: EngineInstancing | null = null;
  /** WebGL2: the `FrameBlock` buffer. WebGL1: null, and each program gets plain uniforms. */
  private readonly frameUbo: WebGLBuffer | null = null;
  private readonly proj = createMat4();
  private readonly view = createMat4();
  private readonly normalMat = new Float32Array(9);
  private readonly tmp = createMat4();
  /** The frame block last uploaded, and the scratch it is re-packed into before each draw. */
  private readonly frameData = new Float32Array(FRAME_LAYOUT.floats);
  private readonly framePacked = new Float32Array(FRAME_LAYOUT.floats);
  private frameVersion = 0;
  private uboVersion = -1;
  private readonly programFrameVersion = new Map<ShaderProgram, number>();
  private currentProgram: ShaderProgram | null = null;
  private postPass: PostPass | null = null;
  private eye: Vec3 = [0, 0, 5];
  lightDir: Vec3 = [0.35, 0.82, 0.45];
  lightColor: Vec3 = [1, 0.92, 0.82];
  ambient: Vec3 = [0.12, 0.11, 0.1];
  fogDensity = 0;
  fogColor: Vec3 = [0.04, 0.04, 0.045];
  pointPos: Vec3 = [0, 0, 0];
  pointColor: Vec3 = [1, 0.7, 0.35];
  pointRange = 0;

  /**
   * Compiles every program and probes VAO and instancing support. After
   * `webglcontextrestored`, construct a new engine (and re-init the scene): all GL objects from
   * before the loss are gone.
   */
  constructor(gl: SequenceGl, kernel: GeometryKernel = tsKernel) {
    this.gl = gl;
    this.kernel = kernel;
    statsByGl.set(gl, this.stats);
    createVaoSupport(gl);
    const webgl2 = isWebGL2(gl);
    const build = (name: keyof typeof shaderSources, defines: string[] = []) =>
      compileProgram(
        gl,
        composeShader('vertex', shaderSources[name].vertex, { webgl2, defines }),
        composeShader('fragment', shaderSources[name].fragment, { webgl2, defines }),
        ATTRIBUTES,
      );
    this.lit = build('lit');
    this.line = build('line');
    this.point = build('point');

    const support = createInstancingSupport(gl);
    const instanceBuffer = support ? gl.createBuffer() : null;
    if (support && instanceBuffer) {
      this.instancing = { support, buffer: instanceBuffer };
      this.litInstanced = build('lit', ['INSTANCED']);
      this.lineInstanced = build('line', ['INSTANCED']);
    }

    if (webgl2) {
      const ubo = gl.createBuffer();
      if (!ubo) throw new Error('Unable to create buffer');
      gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
      gl.bufferData(gl.UNIFORM_BUFFER, FRAME_LAYOUT.floats * 4, gl.DYNAMIC_DRAW);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, FRAME_BINDING, ubo);
      for (const program of this.programs()) {
        const index = gl.getUniformBlockIndex(program.handle, 'FrameBlock');
        if (index !== gl.INVALID_INDEX)
          gl.uniformBlockBinding(program.handle, index, FRAME_BINDING);
      }
      this.frameUbo = ubo;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
  }

  /** True when `drawLitInstanced` / `drawLinesInstanced` issue one call (not one per instance). */
  get instanced(): boolean {
    return this.instancing !== null;
  }

  /** Zeroes the frame counters; the render core calls it before each scene draw. */
  beginFrame(): void {
    this.stats.drawCalls = 0;
    this.stats.instances = 0;
    this.stats.uniformCalls = 0;
    this.stats.bufferUploads = 0;
  }

  setCamera(proj: Mat4, view: Mat4, eye: Vec3): void {
    this.proj.set(proj);
    this.view.set(view);
    this.eye = eye;
  }

  clear(r: number, g: number, b: number): void {
    const gl = this.gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  drawLit(mesh: GpuMesh, model: Mat4, options: LitOptions): void {
    const gl = this.gl;
    const program = this.lit;
    this.use(program);
    mesh.bind(options.color);
    this.uniformMat4(program, 'uModel', model);
    normalFromMat4(this.normalMat, model);
    this.uniformMat3(program, 'uNormalMat', this.normalMat);
    this.uniform3(program, 'uColor', options.color);
    this.uniform3(program, 'uEmissive', options.emissive ?? NO_EMISSIVE);
    this.uniform1(program, 'uShininess', options.shininess ?? DEFAULT_SHININESS);
    this.uniform1(program, 'uCel', options.cel ? 1 : 0);
    this.uniform1(program, 'uUseVertexColor', options.useVertexColor ? 1 : 0);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.draw();
    mesh.unbind();
  }

  /**
   * Draws every instance in `batch` with one call where instancing exists (WebGL2, or
   * `ANGLE_instanced_arrays`), else one `drawLit` per instance. Same pixels either way.
   */
  drawLitInstanced(mesh: GpuMesh, batch: InstanceBatch, options: InstancedLitOptions = {}): void {
    if (batch.count === 0) return;
    const program = this.litInstanced;
    const instancing = this.instancing;
    if (!program || !instancing) {
      for (let i = 0; i < batch.count; i++) {
        this.drawLit(mesh, batch.model(i), {
          color: batch.color(i),
          emissive: batch.emissive(i),
          shininess: batch.shininess(i),
          cel: options.cel,
          useVertexColor: options.useVertexColor,
        });
      }
      return;
    }
    const gl = this.gl;
    this.use(program);
    this.uploadInstances(instancing, batch);
    mesh.bindInstanced(batch.color(0), instancing);
    this.uniform1(program, 'uCel', options.cel ? 1 : 0);
    this.uniform1(program, 'uUseVertexColor', options.useVertexColor ? 1 : 0);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.drawInstanced(batch.count, instancing.support);
    mesh.unbindInstanced(instancing);
  }

  drawOutline(mesh: GpuMesh, model: Mat4, scale = 1.07): void {
    const gl = this.gl;
    scaleMat(this.tmp, model, [scale, scale, scale]);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    this.drawLit(mesh, this.tmp, {
      color: [0.04, 0.03, 0.02],
      emissive: [0.04, 0.03, 0.02],
      cel: true,
      shininess: 4,
    });
    gl.cullFace(gl.BACK);
  }

  drawLines(mesh: GpuMesh, model: Mat4, color: Vec3): void {
    const gl = this.gl;
    const program = this.line;
    this.use(program);
    mesh.bind(color);
    this.uniformMat4(program, 'uModel', model);
    this.uniform3(program, 'uColor', color);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.draw();
    mesh.unbind();
  }

  /** Line meshes, one colour per instance (emissive and shininess are ignored). */
  drawLinesInstanced(mesh: GpuMesh, batch: InstanceBatch): void {
    if (batch.count === 0) return;
    const program = this.lineInstanced;
    const instancing = this.instancing;
    if (!program || !instancing) {
      for (let i = 0; i < batch.count; i++) this.drawLines(mesh, batch.model(i), batch.color(i));
      return;
    }
    const gl = this.gl;
    this.use(program);
    this.uploadInstances(instancing, batch);
    mesh.bindInstanced(batch.color(0), instancing);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.drawInstanced(batch.count, instancing.support);
    mesh.unbindInstanced(instancing);
  }

  drawPoints(
    mesh: GpuMesh,
    model: Mat4,
    color: Vec3,
    size: number,
    alpha: number,
    /** Draw only the first `count` points (an emitter's live particles). */
    count?: number,
  ): void {
    if (count === 0) return;
    const gl = this.gl;
    const program = this.point;
    this.use(program);
    mesh.bind(color);
    this.uniformMat4(program, 'uModel', model);
    this.uniform3(program, 'uColor', color);
    this.uniform1(program, 'uSize', size);
    this.uniform1(program, 'uAlpha', alpha);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    mesh.draw(count);
    mesh.unbind();
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  /**
   * Vignette and ghost passes (`post.ts`), built on first use so films without post never
   * compile them. They switch programs and framebuffers; the engine forgets its cached program.
   */
  get post(): PostPass {
    this.postPass ??= new PostPass(this.gl, () => {
      this.currentProgram = null;
      getVaoSupport(this.gl)?.bind(null);
    });
    return this.postPass;
  }

  dispose(): void {
    const gl = this.gl;
    for (const program of this.programs()) gl.deleteProgram(program.handle);
    if (this.instancing) gl.deleteBuffer(this.instancing.buffer);
    if (this.frameUbo) gl.deleteBuffer(this.frameUbo);
    this.postPass?.dispose();
    this.postPass = null;
    if (statsByGl.get(gl) === this.stats) statsByGl.delete(gl);
  }

  private programs(): ShaderProgram[] {
    return [this.lit, this.line, this.point, this.litInstanced, this.lineInstanced].filter(
      (program): program is ShaderProgram => program !== null,
    );
  }

  /** Binds `program` and makes sure it sees this frame's camera and environment. */
  private use(program: ShaderProgram): void {
    if (this.currentProgram !== program) {
      this.gl.useProgram(program.handle);
      this.currentProgram = program;
    }
    this.syncFrame(program);
  }

  /**
   * Re-packs the camera / light / fog fields (scenes assign them freely between draws) and, only
   * if they changed, uploads them: one `bufferSubData` into the frame block on WebGL2, or the
   * frame uniforms of this program on WebGL1, once per program per change.
   */
  private syncFrame(program: ShaderProgram): void {
    const packed = this.framePacked;
    const L = FRAME_LAYOUT;
    packed.set(this.proj, L.proj);
    packed.set(this.view, L.view);
    write4(packed, L.eyeFog, this.eye, this.fogDensity);
    write4(packed, L.lightDir, this.lightDir, 0);
    write4(packed, L.lightColor, this.lightColor, 0);
    write4(packed, L.ambient, this.ambient, 0);
    write4(packed, L.fogColor, this.fogColor, 0);
    write4(packed, L.pointPosRange, this.pointPos, this.pointRange);
    write4(packed, L.pointColor, this.pointColor, 0);
    if (!sameFloats(packed, this.frameData)) {
      this.frameData.set(packed);
      this.frameVersion += 1;
    }

    const gl = this.gl;
    if (this.frameUbo && isWebGL2(gl)) {
      if (this.uboVersion === this.frameVersion) return;
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.frameUbo);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.frameData);
      this.stats.bufferUploads += 1;
      this.uboVersion = this.frameVersion;
      return;
    }

    if (this.programFrameVersion.get(program) === this.frameVersion) return;
    this.programFrameVersion.set(program, this.frameVersion);
    const data = this.frameData;
    this.uniformMat4(program, 'uProj', data.subarray(L.proj, L.proj + 16));
    this.uniformMat4(program, 'uView', data.subarray(L.view, L.view + 16));
    for (const [name, offset] of [
      ['uEyeFog', L.eyeFog],
      ['uLightDir', L.lightDir],
      ['uLightColor', L.lightColor],
      ['uAmbient', L.ambient],
      ['uFogColor', L.fogColor],
      ['uPointPosRange', L.pointPosRange],
      ['uPointColor', L.pointColor],
    ] as const) {
      const location = program.uniforms.get(name);
      if (!location) continue;
      gl.uniform4fv(location, data.subarray(offset, offset + 4));
      this.stats.uniformCalls += 1;
    }
  }

  private uploadInstances(instancing: EngineInstancing, batch: InstanceBatch): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, instancing.buffer);
    // Orphan and refill: several instanced draws a frame never wait on one another.
    gl.bufferData(gl.ARRAY_BUFFER, batch.data(), gl.DYNAMIC_DRAW);
    this.stats.bufferUploads += 1;
  }

  private uniformMat4(program: ShaderProgram, name: string, value: Float32Array): void {
    const location = program.uniforms.get(name);
    if (!location) return;
    this.gl.uniformMatrix4fv(location, false, value);
    this.stats.uniformCalls += 1;
  }

  private uniformMat3(program: ShaderProgram, name: string, value: Float32Array): void {
    const location = program.uniforms.get(name);
    if (!location) return;
    this.gl.uniformMatrix3fv(location, false, value);
    this.stats.uniformCalls += 1;
  }

  private uniform3(program: ShaderProgram, name: string, value: Vec3): void {
    const location = program.uniforms.get(name);
    if (!location) return;
    this.gl.uniform3fv(location, value);
    this.stats.uniformCalls += 1;
  }

  private uniform1(program: ShaderProgram, name: string, value: number): void {
    const location = program.uniforms.get(name);
    if (!location) return;
    this.gl.uniform1f(location, value);
    this.stats.uniformCalls += 1;
  }
}

function write4(out: Float32Array, offset: number, xyz: Vec3, w: number): void {
  out[offset] = xyz[0];
  out[offset + 1] = xyz[1];
  out[offset + 2] = xyz[2];
  out[offset + 3] = w;
}

function sameFloats(a: Float32Array, b: Float32Array): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Disposes every mesh in a scene's mesh bag (`Object.values` is `any[]` on plain interfaces). */
export function disposeMeshes(meshes: object): void {
  for (const mesh of Object.values(meshes) as GpuMesh[]) mesh.dispose();
}

export function modelTRSX(
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
): Mat4 {
  const m = createMat4();
  identity(m);
  m[12] = x;
  m[13] = y;
  m[14] = z;
  if (rx) {
    const c = Math.cos(rx);
    const s = Math.sin(rx);
    const r = createMat4();
    r[5] = c;
    r[6] = s;
    r[9] = -s;
    r[10] = c;
    multiply(m, m, r);
  }
  if (ry) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    const r = createMat4();
    r[0] = c;
    r[2] = -s;
    r[8] = s;
    r[10] = c;
    multiply(m, m, r);
  }
  if (rz) {
    const c = Math.cos(rz);
    const s = Math.sin(rz);
    const r = createMat4();
    r[0] = c;
    r[1] = s;
    r[4] = -s;
    r[5] = c;
    multiply(m, m, r);
  }
  if (sx !== 1 || sy !== 1 || sz !== 1) {
    scaleMat(m, m, [sx, sy, sz]);
  }
  return m;
}
