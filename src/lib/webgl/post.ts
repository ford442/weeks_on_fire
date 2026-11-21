import { compileProgram, type ShaderProgram } from './program';
import { composeShader, shaderSources } from './shaders';

import type { SequenceGl } from './context';

export interface VignetteOptions {
  /** 0-1: how dark the corners get. */
  strength: number;
  /** Share of the half-diagonal (0-1.5) that stays untouched. Default 0.55. */
  radius?: number;
  /** How far past `radius` the darkening ramps in. Default 0.6. */
  softness?: number;
}

function isWebGL2(gl: SequenceGl): gl is WebGL2RenderingContext {
  return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
}

/**
 * Post passes for graph films: the first framebuffer use in the engine, kept small.
 *
 * - **Vignette** needs no framebuffer: one full-screen triangle multiplied onto the frame.
 * - **Ghosts** draw the current moment and each earlier one into two offscreen framebuffers, and
 *   blend the earlier-minus-now difference onto the (antialiased) canvas. Both sides of the
 *   difference come from identical non-antialiased targets, so static edges cancel exactly and
 *   only what moved leaves a trail. Nothing is accumulated between frames, so a seek or a capture
 *   shows exactly the frame playback would. If a framebuffer is incomplete, ghosts are skipped
 *   and the film plays without them.
 *
 * Plain RGBA8 targets and a 16-bit depth renderbuffer: core in WebGL1 and WebGL2, no float
 * textures needed.
 */
export class PostPass {
  private vignetteProgram: ShaderProgram | null = null;
  private ghostProgram: ShaderProgram | null = null;
  private readonly triangle: WebGLBuffer;
  private targets: { current: Target; ghost: Target; depth: WebGLRenderbuffer } | null = null;
  private size = { width: 0, height: 0 };
  private ghostsBroken = false;

  constructor(
    private readonly gl: SequenceGl,
    /** Called around each pass so the engine can drop its cached program / VAO binding. */
    private readonly onStateChange: () => void,
  ) {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Unable to create buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // One triangle that covers clip space.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.triangle = buffer;
  }

  /** Darkens the corners of what is in the bound framebuffer. */
  vignette(options: VignetteOptions, aspect: number): void {
    const gl = this.gl;
    const program = (this.vignetteProgram ??= this.build('vignette'));
    this.begin(program);
    set1(gl, program, 'uStrength', Math.min(1, Math.max(0, options.strength)));
    set1(gl, program, 'uRadius', options.radius ?? 0.55);
    set1(gl, program, 'uSoftness', Math.max(1e-3, options.softness ?? 0.6));
    set1(gl, program, 'uAspect', aspect);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
    this.drawTriangle();
    this.end();
  }

  /**
   * Points drawing at the "now" framebuffer: draw the current moment again, then each ghost with
   * `beginGhost` / `compositeGhost`. Returns false when ghosts cannot run here; the caller skips
   * them.
   */
  beginCurrent(width: number, height: number): boolean {
    if (this.ghostsBroken || !this.ensureTargets(width, height) || !this.targets) return false;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.targets.current.fbo);
    return true;
  }

  /** Points drawing at the ghost framebuffer; draw the earlier moment, then `compositeGhost`. */
  beginGhost(): void {
    if (this.targets) this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.targets.ghost.fbo);
  }

  /**
   * Adds `weight` times the part of the ghost brighter than now onto the canvas, or with `darken`,
   * takes away the part darker than now (so dark things trail across a bright sky).
   */
  compositeGhost(weight: number, darken = false): void {
    const gl = this.gl;
    const targets = this.targets;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!targets) return;
    const program = (this.ghostProgram ??= this.build('ghost'));
    this.begin(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets.current.color);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, targets.ghost.color);
    setInt(gl, program, 'uCurrent', 0);
    setInt(gl, program, 'uGhost', 1);
    set1(gl, program, 'uWeight', weight);
    set1(gl, program, 'uDarken', darken ? 1 : 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    // Darken: canvas minus the (positive) darker-than-now amount.
    if (darken) gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
    this.drawTriangle();
    gl.blendEquation(gl.FUNC_ADD);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.end();
  }

  dispose(): void {
    const gl = this.gl;
    if (this.vignetteProgram) gl.deleteProgram(this.vignetteProgram.handle);
    if (this.ghostProgram) gl.deleteProgram(this.ghostProgram.handle);
    gl.deleteBuffer(this.triangle);
    this.releaseTargets();
  }

  private build(name: 'vignette' | 'ghost'): ShaderProgram {
    const webgl2 = isWebGL2(this.gl);
    return compileProgram(
      this.gl,
      composeShader('vertex', shaderSources[name].vertex, { webgl2 }),
      composeShader('fragment', shaderSources[name].fragment, { webgl2 }),
      { aPosition: 0 },
    );
  }

  private begin(program: ShaderProgram): void {
    const gl = this.gl;
    this.onStateChange();
    gl.useProgram(program.handle);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangle);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  private drawTriangle(): void {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  private end(): void {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    this.onStateChange();
  }

  private ensureTargets(width: number, height: number): boolean {
    if (this.targets && this.size.width === width && this.size.height === height) return true;
    this.releaseTargets();
    const gl = this.gl;
    // One depth buffer serves both targets: they are drawn one after the other.
    const depth = gl.createRenderbuffer();
    if (!depth) {
      this.ghostsBroken = true;
      return false;
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    const current = createTarget(gl, width, height, depth);
    const ghost = createTarget(gl, width, height, depth);
    this.size = { width, height };
    if (!current || !ghost) {
      for (const target of [current, ghost]) if (target) deleteTarget(gl, target);
      gl.deleteRenderbuffer(depth);
      this.ghostsBroken = true;
      return false;
    }
    this.targets = { current, ghost, depth };
    return true;
  }

  private releaseTargets(): void {
    const targets = this.targets;
    if (targets) {
      deleteTarget(this.gl, targets.current);
      deleteTarget(this.gl, targets.ghost);
      this.gl.deleteRenderbuffer(targets.depth);
    }
    this.targets = null;
    this.size = { width: 0, height: 0 };
  }
}

interface Target {
  fbo: WebGLFramebuffer;
  color: WebGLTexture;
}

/** An RGBA8 colour texture plus the shared depth buffer; null if incomplete here. */
function createTarget(
  gl: SequenceGl,
  width: number,
  height: number,
  depth: WebGLRenderbuffer,
): Target | null {
  const color = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!color || !fbo) {
    if (color) gl.deleteTexture(color);
    if (fbo) gl.deleteFramebuffer(fbo);
    return null;
  }
  gl.bindTexture(gl.TEXTURE_2D, color);
  // Non-power-of-two safe on WebGL1: clamp, no mipmaps.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (complete) return { fbo, color };
  deleteTarget(gl, { fbo, color });
  return null;
}

function deleteTarget(gl: SequenceGl, target: Target): void {
  gl.deleteFramebuffer(target.fbo);
  gl.deleteTexture(target.color);
}

function set1(gl: SequenceGl, program: ShaderProgram, name: string, value: number): void {
  const location = program.uniforms.get(name);
  if (location) gl.uniform1f(location, value);
}

function setInt(gl: SequenceGl, program: ShaderProgram, name: string, value: number): void {
  const location = program.uniforms.get(name);
  if (location) gl.uniform1i(location, value);
}
