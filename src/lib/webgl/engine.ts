import {
  createMat4,
  identity,
  multiply,
  normalFromMat4,
  scaleMat,
  type Mat4,
  type Vec3,
} from './math';
import type { MeshData } from './mesh';
import type { SequenceGl } from './context';
import { compileProgram, type ShaderProgram } from './program';
import { createVaoSupport, getVaoSupport, type VaoSupport } from './vao';

const LIT_VS = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormalMat;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vColor;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(uNormalMat * aNormal);
  vColor = aColor;
  gl_Position = uProj * uView * world;
}
`;

const LIT_FS = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vColor;
uniform vec3 uColor;
uniform vec3 uEmissive;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform float uShininess;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uCel;
uniform float uUseVertexColor;
uniform vec3 uPointPos;
uniform vec3 uPointColor;
uniform float uPointRange;
void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(uEye - vWorld);
  vec3 H = normalize(L + V);
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), uShininess);
  if (uCel > 0.5) {
    diff = max(floor(diff * 3.0 + 0.35) / 3.0, 0.34);
    spec = spec > 0.55 ? 1.0 : 0.0;
  }
  vec3 albedo = mix(uColor, vColor, uUseVertexColor);
  vec3 color = albedo * (uAmbient + uLightColor * diff) + uLightColor * spec * 0.28 + uEmissive;
  if (uPointRange > 0.0) {
    vec3 toP = uPointPos - vWorld;
    float distP = length(toP);
    float att = clamp(1.0 - distP / uPointRange, 0.0, 1.0);
    color += albedo * uPointColor * att * att * max(dot(N, normalize(toP)), 0.0);
  }
  float dist = length(uEye - vWorld);
  float fog = uFogDensity > 0.0 ? exp(-uFogDensity * dist) : 1.0;
  gl_FragColor = vec4(mix(uFogColor, color, fog), 1.0);
}
`;

const LINE_VS = `
attribute vec3 aPosition;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
void main() {
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}
`;

const LINE_FS = `
precision mediump float;
uniform vec3 uColor;
void main() {
  gl_FragColor = vec4(uColor, 1.0);
}
`;

const POINT_VS = `
attribute vec3 aPosition;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform float uSize;
void main() {
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
  gl_PointSize = uSize;
}
`;

const POINT_FS = `
precision mediump float;
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float a = uAlpha * (1.0 - d);
  gl_FragColor = vec4(uColor, a);
}
`;

export interface LitOptions {
  color: Vec3;
  emissive?: Vec3;
  shininess?: number;
  cel?: boolean;
  useVertexColor?: boolean;
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
    this.vertexCount = mesh.positions.length / 3;

    if (mesh.normals) {
      const n = gl.createBuffer();
      if (!n) throw new Error('Unable to create buffer');
      this.nrm = n;
      gl.bindBuffer(gl.ARRAY_BUFFER, n);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    } else {
      this.nrm = null;
    }

    if (mesh.colors) {
      const c = gl.createBuffer();
      if (!c) throw new Error('Unable to create buffer');
      this.col = c;
      gl.bindBuffer(gl.ARRAY_BUFFER, c);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);
    } else {
      this.col = null;
    }

    if (mesh.indices) {
      const i = gl.createBuffer();
      if (!i) throw new Error('Unable to create buffer');
      this.idx = i;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
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
  }

  updateNormals(normals: Float32Array): void {
    if (!this.nrm) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nrm);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, normals, this.gl.DYNAMIC_DRAW);
  }

  /**
   * Binds position (0), normal (1) and color (2) attributes. Attributes the mesh lacks are
   * disabled and fed a constant. Unused attributes are ignored by the line / point programs.
   */
  bind(fallbackColor: Vec3): void {
    const gl = this.gl;
    const vaos = this.vaos;
    if (vaos) {
      this.vao ??= this.buildVao(vaos);
    }
    if (vaos && this.vao) {
      vaos.bind(this.vao);
    } else {
      this.bindAttributes();
      if (this.hasIndex) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idx);
    }
    if (!this.nrm) gl.vertexAttrib3f(1, 0, 1, 0);
    if (!this.col) gl.vertexAttrib3f(2, fallbackColor[0], fallbackColor[1], fallbackColor[2]);
  }

  unbind(): void {
    if (this.vao) this.vaos?.bind(null);
  }

  private buildVao(vaos: VaoSupport): WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null {
    const vao = vaos.create();
    if (!vao) return null;
    vaos.bind(vao);
    this.bindAttributes();
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

  draw(): void {
    const gl = this.gl;
    if (this.hasIndex) {
      gl.drawElements(this.mode, this.indexCount, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(this.mode, 0, this.vertexCount);
    }
  }

  dispose(): void {
    const gl = this.gl;
    if (this.vao) this.vaos?.delete(this.vao);
    gl.deleteBuffer(this.pos);
    if (this.nrm) gl.deleteBuffer(this.nrm);
    if (this.col) gl.deleteBuffer(this.col);
    if (this.idx) gl.deleteBuffer(this.idx);
  }
}

export class SequenceEngine {
  readonly gl: SequenceGl;
  private readonly lit: ShaderProgram;
  private readonly line: ShaderProgram;
  private readonly point: ShaderProgram;
  private readonly proj = createMat4();
  private readonly view = createMat4();
  private readonly normalMat = new Float32Array(9);
  private readonly tmp = createMat4();
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
   * Compiles every program and probes VAO support. After `webglcontextrestored`, construct a
   * new engine (and re-init the scene): all GL objects from before the loss are gone.
   */
  constructor(gl: SequenceGl) {
    this.gl = gl;
    createVaoSupport(gl);
    this.lit = compileProgram(gl, LIT_VS, LIT_FS, {
      aPosition: 0,
      aNormal: 1,
      aColor: 2,
    });
    this.line = compileProgram(gl, LINE_VS, LINE_FS, { aPosition: 0 });
    this.point = compileProgram(gl, POINT_VS, POINT_FS, { aPosition: 0 });
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
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
    gl.useProgram(program.handle);
    mesh.bind(options.color);
    this.bindCommonMatrices(program, model);
    gl.uniform3fv(this.loc(program, 'uColor'), options.color);
    gl.uniform3fv(this.loc(program, 'uEmissive'), options.emissive ?? [0, 0, 0]);
    gl.uniform3fv(this.loc(program, 'uLightDir'), this.lightDir);
    gl.uniform3fv(this.loc(program, 'uLightColor'), this.lightColor);
    gl.uniform3fv(this.loc(program, 'uAmbient'), this.ambient);
    gl.uniform3fv(this.loc(program, 'uEye'), this.eye);
    gl.uniform1f(this.loc(program, 'uShininess'), options.shininess ?? 32);
    gl.uniform1f(this.loc(program, 'uFogDensity'), this.fogDensity);
    gl.uniform3fv(this.loc(program, 'uFogColor'), this.fogColor);
    gl.uniform1f(this.loc(program, 'uCel'), options.cel ? 1 : 0);
    gl.uniform1f(this.loc(program, 'uUseVertexColor'), options.useVertexColor ? 1 : 0);
    gl.uniform3fv(this.loc(program, 'uPointPos'), this.pointPos);
    gl.uniform3fv(this.loc(program, 'uPointColor'), this.pointColor);
    gl.uniform1f(this.loc(program, 'uPointRange'), this.pointRange);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.draw();
    mesh.unbind();
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
    gl.useProgram(this.line.handle);
    mesh.bind(color);
    this.bindCommonMatrices(this.line, model);
    gl.uniform3fv(this.loc(this.line, 'uColor'), color);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.draw();
    mesh.unbind();
  }

  drawPoints(mesh: GpuMesh, model: Mat4, color: Vec3, size: number, alpha: number): void {
    const gl = this.gl;
    gl.useProgram(this.point.handle);
    mesh.bind(color);
    this.bindCommonMatrices(this.point, model);
    gl.uniform3fv(this.loc(this.point, 'uColor'), color);
    gl.uniform1f(this.loc(this.point, 'uSize'), size);
    gl.uniform1f(this.loc(this.point, 'uAlpha'), alpha);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    mesh.draw();
    mesh.unbind();
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  dispose(): void {
    this.gl.deleteProgram(this.lit.handle);
    this.gl.deleteProgram(this.line.handle);
    this.gl.deleteProgram(this.point.handle);
  }

  private loc(program: ShaderProgram, name: string): WebGLUniformLocation | null {
    return program.uniforms.get(name) ?? null;
  }

  private bindCommonMatrices(program: ShaderProgram, model: Mat4): void {
    const gl = this.gl;
    gl.uniformMatrix4fv(this.loc(program, 'uProj'), false, this.proj);
    gl.uniformMatrix4fv(this.loc(program, 'uView'), false, this.view);
    gl.uniformMatrix4fv(this.loc(program, 'uModel'), false, model);
    if (program === this.lit) {
      normalFromMat4(this.normalMat, model);
      gl.uniformMatrix3fv(this.loc(program, 'uNormalMat'), false, this.normalMat);
    }
  }
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
