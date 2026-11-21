/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

/** Shader sources for the 3D Sequences engine (`src/lib/webgl/shaders/`). */
declare module '*.glsl?raw' {
  const source: string;
  export default source;
}

/** Responsive still imports emitted by codegen (`scripts/content-index/image-variants.ts`). */
declare module '*&as=picture' {
  const picture: import('../scripts/content-index/catalog-types').Picture;
  export default picture;
}
