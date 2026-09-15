export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;

export function vec3(x: number, y: number, z: number): Vec3 {
  return [x, y, z];
}

export function vec3Copy(a: Vec3): Vec3 {
  return [a[0], a[1], a[2]];
}

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vec3Scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function vec3Length(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function vec3Normalize(a: Vec3): Vec3 {
  const len = vec3Length(a);
  if (len < 1e-8) return [0, 1, 0];
  return vec3Scale(a, 1 / len);
}

export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function createMat4(): Mat4 {
  const m = new Float32Array(16);
  m[0] = 1;
  m[5] = 1;
  m[10] = 1;
  m[15] = 1;
  return m;
}

export function identity(out: Mat4): Mat4 {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

export function copyMat4(out: Mat4, a: Mat4): Mat4 {
  out.set(a);
  return out;
}

/** Column-major multiply: out = a * b */
export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const a00 = a[0] ?? 0;
  const a01 = a[1] ?? 0;
  const a02 = a[2] ?? 0;
  const a03 = a[3] ?? 0;
  const a10 = a[4] ?? 0;
  const a11 = a[5] ?? 0;
  const a12 = a[6] ?? 0;
  const a13 = a[7] ?? 0;
  const a20 = a[8] ?? 0;
  const a21 = a[9] ?? 0;
  const a22 = a[10] ?? 0;
  const a23 = a[11] ?? 0;
  const a30 = a[12] ?? 0;
  const a31 = a[13] ?? 0;
  const a32 = a[14] ?? 0;
  const a33 = a[15] ?? 0;

  const result = out === a || out === b ? new Float32Array(16) : out;

  for (let col = 0; col < 4; col++) {
    const b0 = b[col * 4] ?? 0;
    const b1 = b[col * 4 + 1] ?? 0;
    const b2 = b[col * 4 + 2] ?? 0;
    const b3 = b[col * 4 + 3] ?? 0;
    result[col * 4] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
    result[col * 4 + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
    result[col * 4 + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
    result[col * 4 + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
  }

  if (result !== out) out.set(result);
  return out;
}

export function translate(out: Mat4, a: Mat4, v: Vec3): Mat4 {
  const t = createMat4();
  t[12] = v[0];
  t[13] = v[1];
  t[14] = v[2];
  return multiply(out, a, t);
}

export function scaleMat(out: Mat4, a: Mat4, v: Vec3): Mat4 {
  const s = createMat4();
  s[0] = v[0];
  s[5] = v[1];
  s[10] = v[2];
  return multiply(out, a, s);
}

export function rotateX(out: Mat4, a: Mat4, rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const r = createMat4();
  r[5] = c;
  r[6] = s;
  r[9] = -s;
  r[10] = c;
  return multiply(out, a, r);
}

export function rotateY(out: Mat4, a: Mat4, rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const r = createMat4();
  r[0] = c;
  r[2] = -s;
  r[8] = s;
  r[10] = c;
  return multiply(out, a, r);
}

export function rotateZ(out: Mat4, a: Mat4, rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const r = createMat4();
  r[0] = c;
  r[1] = s;
  r[4] = -s;
  r[5] = c;
  return multiply(out, a, r);
}

export function perspective(
  out: Mat4,
  fovy: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

export function lookAt(out: Mat4, eye: Vec3, center: Vec3, up: Vec3): Mat4 {
  const z = vec3Normalize(vec3Sub(eye, center));
  const x = vec3Normalize(vec3Cross(up, z));
  const y = vec3Cross(z, x);

  out.fill(0);
  out[0] = x[0];
  out[1] = y[0];
  out[2] = z[0];
  out[4] = x[1];
  out[5] = y[1];
  out[6] = z[1];
  out[8] = x[2];
  out[9] = y[2];
  out[10] = z[2];
  out[12] = -vec3Dot(x, eye);
  out[13] = -vec3Dot(y, eye);
  out[14] = -vec3Dot(z, eye);
  out[15] = 1;
  return out;
}

/** Inverse-transpose of the upper 3x3, written as a 3x3 column-major array. */
export function normalFromMat4(out: Float32Array, m: Mat4): Float32Array {
  const a00 = m[0] ?? 1;
  const a01 = m[1] ?? 0;
  const a02 = m[2] ?? 0;
  const a10 = m[4] ?? 0;
  const a11 = m[5] ?? 1;
  const a12 = m[6] ?? 0;
  const a20 = m[8] ?? 0;
  const a21 = m[9] ?? 0;
  const a22 = m[10] ?? 1;

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;
  const det = a00 * b01 + a01 * b11 + a02 * b21;
  const inv = Math.abs(det) < 1e-8 ? 1 : 1 / det;

  out[0] = b01 * inv;
  out[1] = (-a22 * a01 + a02 * a21) * inv;
  out[2] = (a12 * a01 - a02 * a11) * inv;
  out[3] = b11 * inv;
  out[4] = (a22 * a00 - a02 * a20) * inv;
  out[5] = (-a12 * a00 + a02 * a10) * inv;
  out[6] = b21 * inv;
  out[7] = (-a21 * a00 + a01 * a20) * inv;
  out[8] = (a11 * a00 - a01 * a10) * inv;
  return out;
}

export function transformPoint(m: Mat4, p: Vec3): Vec3 {
  const x = p[0];
  const y = p[1];
  const z = p[2];
  const w = (m[3] ?? 0) * x + (m[7] ?? 0) * y + (m[11] ?? 0) * z + (m[15] ?? 1);
  const invW = Math.abs(w) < 1e-8 ? 1 : 1 / w;
  return [
    ((m[0] ?? 1) * x + (m[4] ?? 0) * y + (m[8] ?? 0) * z + (m[12] ?? 0)) * invW,
    ((m[1] ?? 0) * x + (m[5] ?? 1) * y + (m[9] ?? 0) * z + (m[13] ?? 0)) * invW,
    ((m[2] ?? 0) * x + (m[6] ?? 0) * y + (m[10] ?? 1) * z + (m[14] ?? 0)) * invW,
  ];
}

export const DEG = Math.PI / 180;
