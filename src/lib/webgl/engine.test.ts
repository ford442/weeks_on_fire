import { afterEach, describe, expect, it, vi } from 'vitest';

import { GpuMesh, SequenceEngine, modelTRSX } from './engine';
import { InstanceBatch } from './instances';
import { createBox } from './mesh';

import type { SequenceGl } from './context';

/** Stands in for `WebGL2RenderingContext` so `instanceof` checks can be steered per test. */
class FakeWebGL2 {}

const GL = {
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  UNIFORM_BUFFER: 0x8a11,
  ACTIVE_UNIFORMS: 0x8b86,
  MAX_VERTEX_ATTRIBS: 0x8869,
  INVALID_INDEX: 0xffffffff,
  TRIANGLES: 4,
  LINES: 1,
  POINTS: 0,
  UNSIGNED_SHORT: 0x1403,
  FLOAT: 0x1406,
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,
  DYNAMIC_DRAW: 0x88e8,
  STATIC_DRAW: 0x88e4,
} as const;

interface FakeOptions {
  webgl2?: boolean;
  /** WebGL1 extensions the context offers. */
  extensions?: string[];
  maxAttributes?: number;
}

interface Call {
  name: string;
  args: unknown[];
}

/**
 * A recording WebGL context: every call is logged, uniforms are read out of the shader source
 * the engine compiles, and anything not modelled is a no-op.
 */
function fakeGl({ webgl2 = false, extensions = [], maxAttributes = 16 }: FakeOptions = {}) {
  const calls: Call[] = [];
  const sources = new Map<object, string>();
  const record =
    (name: string, result?: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return result?.(...args);
    };
  const ext = (prefix: string) =>
    new Proxy(
      {},
      {
        get: (_target, prop: string) => record(`${prefix}.${prop}`, () => ({})),
      },
    );
  const impl: Record<string, unknown> = {
    ...GL,
    createShader: record('createShader', () => ({})),
    shaderSource: record('shaderSource', (shader, source) => {
      sources.set(shader as object, source as string);
    }),
    getShaderParameter: () => true,
    createProgram: record('createProgram', () => ({ shaders: [] as object[], uniforms: [] })),
    attachShader: (program: { shaders: object[] }, shader: object) => program.shaders.push(shader),
    linkProgram: (program: { shaders: object[]; uniforms: string[] }) => {
      const text = program.shaders.map((shader) => sources.get(shader) ?? '').join('\n');
      // Plain `uniform <type> <name>;` lines only: FrameBlock members are not locations.
      program.uniforms = [...text.matchAll(/^uniform \w+ (\w+);/gm)].map((m) => m[1] ?? '');
    },
    getProgramParameter: (program: { uniforms: string[] }, pname: number) =>
      pname === GL.ACTIVE_UNIFORMS ? program.uniforms.length : true,
    getActiveUniform: (program: { uniforms: string[] }, i: number) => ({
      name: program.uniforms[i],
    }),
    getUniformLocation: (_program: unknown, name: string) => ({ name }),
    getUniformBlockIndex: () => 0,
    getParameter: (pname: number) => (pname === GL.MAX_VERTEX_ATTRIBS ? maxAttributes : null),
    getExtension: (name: string) => (extensions.includes(name) ? ext(name) : null),
    createBuffer: record('createBuffer', () => ({})),
    createVertexArray: record('createVertexArray', () => ({})),
  };
  const prototype: object = webgl2 ? FakeWebGL2.prototype : Object.prototype;
  const target: object = Object.assign(Object.create(prototype) as object, impl);
  const gl = new Proxy(target, {
    get(object, prop: string) {
      if (prop in object) return (object as Record<string, unknown>)[prop];
      return record(prop);
    },
  }) as SequenceGl;
  const named = (name: string) => calls.filter((call) => call.name === name);
  const uniformUploads = (uniform: string) =>
    calls.filter(
      (call) =>
        call.name.startsWith('uniform') && (call.args[0] as { name?: string })?.name === uniform,
    );
  return { gl, calls, named, uniformUploads, sources };
}

const box = createBox(1, 1, 1);

function camera(engine: SequenceEngine, z = 5) {
  engine.setCamera(new Float32Array(16).fill(1), new Float32Array(16).fill(2), [0, 0, z]);
}

describe('SequenceEngine frame uniforms', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('WebGL1: uploads the camera once per program per change, not once per draw', () => {
    const fake = fakeGl();
    const engine = new SequenceEngine(fake.gl);
    const mesh = new GpuMesh(fake.gl, box);
    camera(engine);
    for (let i = 0; i < 5; i++) engine.drawLit(mesh, modelTRSX(i, 0, 0), { color: [1, 0, 0] });
    expect(fake.uniformUploads('uProj')).toHaveLength(1);
    expect(fake.uniformUploads('uLightDir')).toHaveLength(1);
    // Per-draw state still goes every draw.
    expect(fake.uniformUploads('uModel')).toHaveLength(5);

    engine.lightDir = [0, 1, 0];
    engine.drawLit(mesh, modelTRSX(0, 0, 0), { color: [1, 0, 0] });
    expect(fake.uniformUploads('uLightDir')).toHaveLength(2);
    // The line program has its own uniforms, so it gets its own upload.
    engine.drawLines(mesh, modelTRSX(0, 0, 0), [1, 1, 1]);
    expect(fake.uniformUploads('uProj')).toHaveLength(3);
    expect(fake.uniformUploads('uLightDir')).toHaveLength(2);
  });

  it('WebGL2: one FrameBlock upload per change, shared by every program', () => {
    vi.stubGlobal('WebGL2RenderingContext', FakeWebGL2);
    const fake = fakeGl({ webgl2: true });
    const engine = new SequenceEngine(fake.gl);
    const mesh = new GpuMesh(fake.gl, box);
    expect(fake.named('uniformBlockBinding').length).toBeGreaterThanOrEqual(3);
    for (const source of fake.sources.values()) expect(source).toMatch(/^#version 300 es/);

    camera(engine);
    engine.beginFrame();
    engine.drawLit(mesh, modelTRSX(0, 0, 0), { color: [1, 0, 0] });
    engine.drawLines(mesh, modelTRSX(0, 0, 0), [1, 1, 1]);
    engine.drawPoints(mesh, modelTRSX(0, 0, 0), [1, 1, 1], 4, 1);
    const blockUploads = () =>
      fake.named('bufferSubData').filter((call) => call.args[0] === GL.UNIFORM_BUFFER);
    expect(blockUploads()).toHaveLength(1);
    expect(fake.uniformUploads('uProj')).toHaveLength(0);

    camera(engine, 9);
    engine.drawLit(mesh, modelTRSX(0, 0, 0), { color: [1, 0, 0] });
    expect(blockUploads()).toHaveLength(2);
    expect(engine.stats.drawCalls).toBe(4);
  });
});

describe('SequenceEngine instancing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function batchOf(count: number) {
    const batch = new InstanceBatch();
    for (let i = 0; i < count; i++) batch.push(modelTRSX(i, 0, 0), [i / count, 0, 0]);
    return batch;
  }

  it('draws a whole batch with one instanced call on WebGL2', () => {
    vi.stubGlobal('WebGL2RenderingContext', FakeWebGL2);
    const fake = fakeGl({ webgl2: true });
    const engine = new SequenceEngine(fake.gl);
    const mesh = new GpuMesh(fake.gl, box);
    engine.beginFrame();
    engine.drawLitInstanced(mesh, batchOf(6), { cel: true });
    const draws = fake.named('drawElementsInstanced');
    expect(draws).toHaveLength(1);
    expect(draws[0]?.args[4]).toBe(6);
    expect(fake.named('drawElements')).toHaveLength(0);
    // The six per-instance attribute slots (mat4 = 3..6, colour 7, emissive 8) step per instance.
    expect(fake.named('vertexAttribDivisor').map((call) => call.args)).toEqual(
      [3, 4, 5, 6, 7, 8].map((location) => [location, 1]),
    );
    expect(engine.instanced).toBe(true);
    expect(engine.stats).toMatchObject({ drawCalls: 1, instances: 6 });
  });

  it('uses ANGLE_instanced_arrays on WebGL1', () => {
    const fake = fakeGl({ extensions: ['ANGLE_instanced_arrays', 'OES_vertex_array_object'] });
    const engine = new SequenceEngine(fake.gl);
    const mesh = new GpuMesh(fake.gl, box);
    engine.drawLinesInstanced(mesh, batchOf(4));
    expect(fake.named('ANGLE_instanced_arrays.drawElementsInstancedANGLE')).toHaveLength(1);
  });

  it('puts the instance slots back after an instanced draw when there are no VAOs', () => {
    const fake = fakeGl({ extensions: ['ANGLE_instanced_arrays'] });
    const engine = new SequenceEngine(fake.gl);
    const mesh = new GpuMesh(fake.gl, box);
    engine.drawLitInstanced(mesh, batchOf(2));
    const divisors = fake
      .named('ANGLE_instanced_arrays.vertexAttribDivisorANGLE')
      .map((call) => call.args);
    expect(divisors.slice(-6)).toEqual([3, 4, 5, 6, 7, 8].map((location) => [location, 0]));
    const disabled = fake.named('disableVertexAttribArray').map((call) => call.args[0]);
    expect(disabled).toEqual(expect.arrayContaining([3, 4, 5, 6, 7, 8]));
  });

  it('falls back to one plain draw per instance without instancing', () => {
    for (const fake of [fakeGl(), fakeGl({ webgl2: false, maxAttributes: 8 })]) {
      const engine = new SequenceEngine(fake.gl);
      const mesh = new GpuMesh(fake.gl, box);
      engine.beginFrame();
      engine.drawLitInstanced(mesh, batchOf(5));
      expect(engine.instanced).toBe(false);
      expect(fake.named('drawElements')).toHaveLength(5);
      expect(fake.uniformUploads('uModel')).toHaveLength(5);
      expect(engine.stats).toMatchObject({ drawCalls: 5, instances: 5 });
    }
  });

  it('draws nothing for an empty batch', () => {
    const fake = fakeGl({ extensions: ['ANGLE_instanced_arrays'] });
    const engine = new SequenceEngine(fake.gl);
    engine.drawLitInstanced(new GpuMesh(fake.gl, box), new InstanceBatch());
    expect(fake.named('ANGLE_instanced_arrays.drawElementsInstancedANGLE')).toHaveLength(0);
  });
});

describe('SequenceEngine stats', () => {
  it('counts uploads and draws per frame, and beginFrame starts over', () => {
    const fake = fakeGl();
    const engine = new SequenceEngine(fake.gl);
    const mesh = new GpuMesh(fake.gl, box);
    engine.beginFrame();
    mesh.updatePositions(box.positions);
    engine.drawLit(mesh, modelTRSX(0, 0, 0), { color: [1, 1, 1] });
    expect(engine.stats.bufferUploads).toBe(1);
    expect(engine.stats.drawCalls).toBe(1);
    expect(engine.stats.uniformCalls).toBeGreaterThan(0);
    engine.beginFrame();
    expect(engine.stats).toEqual({ drawCalls: 0, instances: 0, uniformCalls: 0, bufferUploads: 0 });
  });

  it('skips useProgram when the program is already bound', () => {
    const fake = fakeGl();
    const engine = new SequenceEngine(fake.gl);
    const mesh = new GpuMesh(fake.gl, box);
    engine.drawLit(mesh, modelTRSX(0, 0, 0), { color: [1, 1, 1] });
    engine.drawLit(mesh, modelTRSX(1, 0, 0), { color: [1, 1, 1] });
    engine.drawLines(mesh, modelTRSX(0, 0, 0), [1, 1, 1]);
    expect(fake.named('useProgram')).toHaveLength(2);
  });
});
