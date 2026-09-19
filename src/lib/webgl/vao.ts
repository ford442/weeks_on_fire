import type { SequenceGl } from './context';

/** Vertex array objects via WebGL2 or OES_vertex_array_object; absent on plain WebGL1. */
export interface VaoSupport {
  create(): WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null;
  bind(vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null): void;
  delete(vao: WebGLVertexArrayObject | WebGLVertexArrayObjectOES): void;
}

const supportByGl = new WeakMap<object, VaoSupport | null>();

function isWebGL2(gl: SequenceGl): gl is WebGL2RenderingContext {
  return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
}

/**
 * Probes and caches VAO support for `gl`. Call again after `webglcontextrestored`: extension
 * objects from before the loss are invalid.
 */
export function createVaoSupport(gl: SequenceGl): VaoSupport | null {
  let support: VaoSupport | null = null;
  if (isWebGL2(gl)) {
    support = {
      create: () => gl.createVertexArray(),
      bind: (vao) => gl.bindVertexArray(vao as WebGLVertexArrayObject | null),
      delete: (vao) => gl.deleteVertexArray(vao as WebGLVertexArrayObject),
    };
  } else {
    const ext = gl.getExtension('OES_vertex_array_object');
    if (ext) {
      support = {
        create: () => ext.createVertexArrayOES(),
        bind: (vao) => ext.bindVertexArrayOES(vao as WebGLVertexArrayObjectOES | null),
        delete: (vao) => ext.deleteVertexArrayOES(vao as WebGLVertexArrayObjectOES),
      };
    }
  }
  supportByGl.set(gl, support);
  return support;
}

export function getVaoSupport(gl: SequenceGl): VaoSupport | null {
  return supportByGl.has(gl) ? (supportByGl.get(gl) ?? null) : createVaoSupport(gl);
}
