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
import { compileProgram, uniform } from './program';

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
    diff = floor(diff * 3.0 + 0.04) / 3.0;
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

  constructor(
    private readonly gl: WebGLRenderingContext,
    mesh: MeshData,
  ) {
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

  bindPosition(location: number): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pos);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
  }

  bindNormal(location: number): void {
    const gl = this.gl;
    if (this.nrm) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nrm);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(location);
      gl.vertexAttrib3f(location, 0, 1, 0);
    }
  }

  bindColor(location: number, fallback: Vec3): void {
    const gl = this.gl;
    if (this.col) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.col);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(location);
      gl.vertexAttrib3f(location, fallback[0], fallback[1], fallback[2]);
    }
  }

  draw(): void {
    const gl = this.gl;
    if (this.hasIndex && this.idx) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idx);
      gl.drawElements(this.mode, this.indexCount, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(this.mode, 0, this.vertexCount);
    }
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.pos);
    if (this.nrm) gl.deleteBuffer(this.nrm);
    if (this.col) gl.deleteBuffer(this.col);
    if (this.idx) gl.deleteBuffer(this.idx);
  }
}

export class SequenceEngine {
  readonly gl: WebGLRenderingContext;
  private readonly lit: WebGLProgram;
  private readonly line: WebGLProgram;
  private readonly point: WebGLProgram;
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

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
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
    gl.useProgram(program);
    mesh.bindPosition(0);
    mesh.bindNormal(1);
    mesh.bindColor(2, options.color);
    this.bindCommonMatrices(program, model);
    gl.uniform3fv(uniform(gl, program, 'uColor'), options.color);
    gl.uniform3fv(uniform(gl, program, 'uEmissive'), options.emissive ?? [0, 0, 0]);
    gl.uniform3fv(uniform(gl, program, 'uLightDir'), this.lightDir);
    gl.uniform3fv(uniform(gl, program, 'uLightColor'), this.lightColor);
    gl.uniform3fv(uniform(gl, program, 'uAmbient'), this.ambient);
    gl.uniform3fv(uniform(gl, program, 'uEye'), this.eye);
    gl.uniform1f(uniform(gl, program, 'uShininess'), options.shininess ?? 32);
    gl.uniform1f(uniform(gl, program, 'uFogDensity'), this.fogDensity);
    gl.uniform3fv(uniform(gl, program, 'uFogColor'), this.fogColor);
    gl.uniform1f(uniform(gl, program, 'uCel'), options.cel ? 1 : 0);
    gl.uniform1f(uniform(gl, program, 'uUseVertexColor'), options.useVertexColor ? 1 : 0);
    gl.uniform3fv(uniform(gl, program, 'uPointPos'), this.pointPos);
    gl.uniform3fv(uniform(gl, program, 'uPointColor'), this.pointColor);
    gl.uniform1f(uniform(gl, program, 'uPointRange'), this.pointRange);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.draw();
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
    gl.useProgram(this.line);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    mesh.bindPosition(0);
    this.bindCommonMatrices(this.line, model);
    gl.uniform3fv(uniform(gl, this.line, 'uColor'), color);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    mesh.draw();
  }

  drawPoints(mesh: GpuMesh, model: Mat4, color: Vec3, size: number, alpha: number): void {
    const gl = this.gl;
    gl.useProgram(this.point);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    mesh.bindPosition(0);
    this.bindCommonMatrices(this.point, model);
    gl.uniform3fv(uniform(gl, this.point, 'uColor'), color);
    gl.uniform1f(uniform(gl, this.point, 'uSize'), size);
    gl.uniform1f(uniform(gl, this.point, 'uAlpha'), alpha);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    mesh.draw();
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  dispose(): void {
    this.gl.deleteProgram(this.lit);
    this.gl.deleteProgram(this.line);
    this.gl.deleteProgram(this.point);
  }

  private bindCommonMatrices(program: WebGLProgram, model: Mat4): void {
    const gl = this.gl;
    gl.uniformMatrix4fv(uniform(gl, program, 'uProj'), false, this.proj);
    gl.uniformMatrix4fv(uniform(gl, program, 'uView'), false, this.view);
    gl.uniformMatrix4fv(uniform(gl, program, 'uModel'), false, model);
    if (program === this.lit) {
      normalFromMat4(this.normalMat, model);
      gl.uniformMatrix3fv(uniform(gl, program, 'uNormalMat'), false, this.normalMat);
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
