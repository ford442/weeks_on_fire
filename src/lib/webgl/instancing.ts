import type { SequenceGl } from './context';

/**
 * Instanced drawing through WebGL2 or `ANGLE_instanced_arrays`; null where neither exists, or
 * where the context has fewer than the 9 vertex attributes the instanced lit program needs.
 * The engine then draws each instance on its own, with the same result.
 */
export interface InstancingSupport {
  divisor(location: number, divisor: number): void;
  drawArrays(mode: number, first: number, count: number, instances: number): void;
  drawElements(mode: number, count: number, type: number, offset: number, instances: number): void;
}

/** Highest attribute location the instanced programs bind (see INSTANCE_LAYOUT in engine.ts). */
export const INSTANCED_ATTRIBUTE_COUNT = 9;

function isWebGL2(gl: SequenceGl): gl is WebGL2RenderingContext {
  return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
}

export function createInstancingSupport(gl: SequenceGl): InstancingSupport | null {
  const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number;
  if (!(maxAttributes >= INSTANCED_ATTRIBUTE_COUNT)) return null;
  if (isWebGL2(gl)) {
    return {
      divisor: (location, divisor) => gl.vertexAttribDivisor(location, divisor),
      drawArrays: (mode, first, count, instances) =>
        gl.drawArraysInstanced(mode, first, count, instances),
      drawElements: (mode, count, type, offset, instances) =>
        gl.drawElementsInstanced(mode, count, type, offset, instances),
    };
  }
  const ext = gl.getExtension('ANGLE_instanced_arrays');
  if (!ext) return null;
  return {
    divisor: (location, divisor) => ext.vertexAttribDivisorANGLE(location, divisor),
    drawArrays: (mode, first, count, instances) =>
      ext.drawArraysInstancedANGLE(mode, first, count, instances),
    drawElements: (mode, count, type, offset, instances) =>
      ext.drawElementsInstancedANGLE(mode, count, type, offset, instances),
  };
}
