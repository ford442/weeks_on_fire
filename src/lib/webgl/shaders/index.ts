import frameBlock from './frame.block.glsl?raw';
import frameFragment from './frame.fragment.glsl?raw';
import frameVertex from './frame.vertex.glsl?raw';
import ghostFrag from './ghost.frag.glsl?raw';
import lineFrag from './line.frag.glsl?raw';
import lineVert from './line.vert.glsl?raw';
import litFrag from './lit.frag.glsl?raw';
import litVert from './lit.vert.glsl?raw';
import pointFrag from './point.frag.glsl?raw';
import pointVert from './point.vert.glsl?raw';
import postVert from './post.vert.glsl?raw';
import vignetteFrag from './vignette.frag.glsl?raw';

/**
 * Shader sources for `SequenceEngine`. Each body is written once, in GLSL ES 1.00, and compiled
 * as 1.00 on WebGL1 or as 3.00 on WebGL2 (where the camera/environment uniforms become one
 * uniform block). The one include, `#include <frame>`, is expanded here; there is no GLSL plugin.
 */
export const shaderSources = {
  lit: { vertex: litVert, fragment: litFrag },
  line: { vertex: lineVert, fragment: lineFrag },
  point: { vertex: pointVert, fragment: pointFrag },
  /** Post passes (graph `post`): compiled on first use, not with the engine. */
  vignette: { vertex: postVert, fragment: vignetteFrag },
  ghost: { vertex: postVert, fragment: ghostFrag },
} as const;

export type ShaderStage = 'vertex' | 'fragment';

export interface ShaderVariant {
  /** Compile as GLSL ES 3.00 with the `FrameBlock` uniform block. */
  webgl2: boolean;
  /** Names to `#define` (e.g. `INSTANCED`). */
  defines?: readonly string[];
}

/** Lets a 1.00 body compile as 3.00 (the substitutions three.js also makes). */
const GLSL3_PREAMBLE: Record<ShaderStage, string> = {
  vertex: '#version 300 es\n#define attribute in\n#define varying out\n',
  fragment:
    '#version 300 es\n#define varying in\n#define texture2D texture\nout mediump vec4 wofFragColor;\n#define gl_FragColor wofFragColor\n',
};

const FRAME_INCLUDE = /^#include <frame>$/m;

/** Builds the source one stage compiles: version preamble, defines, then the body. */
export function composeShader(stage: ShaderStage, body: string, variant: ShaderVariant): string {
  const frame = variant.webgl2 ? frameBlock : stage === 'vertex' ? frameVertex : frameFragment;
  const expanded = body.replace(FRAME_INCLUDE, frame);
  if (/^\s*#include\b/m.test(expanded)) {
    throw new Error('composeShader: only "#include <frame>" is supported, once per stage');
  }
  const preamble = variant.webgl2 ? GLSL3_PREAMBLE[stage] : '';
  const defines = (variant.defines ?? []).map((name) => `#define ${name}\n`).join('');
  return `${preamble}${defines}${expanded}`;
}
