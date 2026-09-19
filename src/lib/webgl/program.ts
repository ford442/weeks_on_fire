export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'unknown shader error';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

export interface ShaderProgram {
  readonly handle: WebGLProgram;
  /** Uniform locations resolved once at link time; array uniforms are keyed without `[0]`. */
  readonly uniforms: ReadonlyMap<string, WebGLUniformLocation>;
}

export function collectUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): Map<string, WebGLUniformLocation> {
  const uniforms = new Map<string, WebGLUniformLocation>();
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    const location = gl.getUniformLocation(program, info.name);
    if (location) uniforms.set(name, location);
  }
  return uniforms;
}

export function compileProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attribs?: Record<string, number>,
): ShaderProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  if (attribs) {
    for (const [name, index] of Object.entries(attribs)) {
      gl.bindAttribLocation(program, index, name);
    }
  }
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'unknown link error';
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return { handle: program, uniforms: collectUniforms(gl, program) };
}
