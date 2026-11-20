import { describe, expect, it } from 'vitest';

import { composeShader, shaderSources } from '.';

describe('composeShader', () => {
  it('leaves a WebGL1 body as GLSL ES 1.00 with plain frame uniforms', () => {
    const vertex = composeShader('vertex', shaderSources.lit.vertex, { webgl2: false });
    expect(vertex).not.toContain('#version');
    expect(vertex).toContain('uniform mat4 uProj;');
    expect(vertex).not.toContain('uniform FrameBlock');
    const fragment = composeShader('fragment', shaderSources.lit.fragment, { webgl2: false });
    expect(fragment).toContain('uniform vec4 uEyeFog;');
    expect(fragment).not.toContain('uniform mat4 uProj;');
  });

  it('compiles the same body as GLSL ES 3.00 with the FrameBlock on WebGL2', () => {
    for (const stage of ['vertex', 'fragment'] as const) {
      const source = composeShader(stage, shaderSources.lit[stage], { webgl2: true });
      expect(source.startsWith('#version 300 es\n')).toBe(true);
      expect(source).toContain('layout(std140) uniform FrameBlock');
    }
    expect(composeShader('fragment', shaderSources.line.fragment, { webgl2: true })).toContain(
      '#define gl_FragColor wofFragColor',
    );
  });

  it('declares the same FrameBlock in both stages (WebGL2 links them as one block)', () => {
    const block = (stage: 'vertex' | 'fragment') => {
      const source = composeShader(stage, shaderSources.lit[stage], { webgl2: true });
      return /layout\(std140\) uniform FrameBlock \{[^}]*\};/.exec(source)?.[0];
    };
    expect(block('vertex')).toBeDefined();
    expect(block('vertex')).toBe(block('fragment'));
  });

  it('puts defines after #version, which must stay the first line', () => {
    const source = composeShader('vertex', shaderSources.lit.vertex, {
      webgl2: true,
      defines: ['INSTANCED'],
    });
    const lines = source.split('\n');
    expect(lines[0]).toBe('#version 300 es');
    expect(lines).toContain('#define INSTANCED');
  });

  it('expands only #include <frame>', () => {
    expect(() =>
      composeShader('vertex', '#include <lighting>\nvoid main() {}', { webgl2: false }),
    ).toThrow(/only "#include <frame>"/);
    expect(composeShader('vertex', 'void main() {}', { webgl2: false })).toBe('void main() {}');
  });

  it('gives every stage a main and no stray include', () => {
    for (const program of Object.values(shaderSources)) {
      for (const stage of ['vertex', 'fragment'] as const) {
        for (const webgl2 of [false, true]) {
          const source = composeShader(stage, program[stage], { webgl2 });
          expect(source).toMatch(/void main\(\)/);
          expect(source).not.toContain('#include');
        }
      }
    }
  });
});
