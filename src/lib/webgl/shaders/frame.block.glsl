// Camera and environment for the whole frame, as one std140 uniform block (WebGL2 only).
// SequenceEngine packs it into a 240-byte buffer and uploads it once per change, not per draw.
// Member order and vec4 packing must match FRAME_LAYOUT in engine.ts.
layout(std140) uniform FrameBlock {
  highp mat4 uProj;
  highp mat4 uView;
  highp vec4 uEyeFog;        // xyz eye, w fog density (0 = no fog)
  highp vec4 uLightDir;      // xyz
  highp vec4 uLightColor;    // xyz
  highp vec4 uAmbient;       // xyz
  highp vec4 uFogColor;      // xyz
  highp vec4 uPointPosRange; // xyz point light, w range (0 = off)
  highp vec4 uPointColor;    // xyz
};
