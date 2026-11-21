// Multiplied onto the frame (blend ZERO, SRC_COLOR): 1 in the middle, darker toward the corners.
precision mediump float;

varying vec2 vUv;
uniform float uStrength;
uniform float uRadius;
uniform float uSoftness;
uniform float uAspect;

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= uAspect;
  // 0 at the centre, 1 at a corner, whatever the aspect.
  float d = length(p) / length(vec2(uAspect, 1.0));
  float v = 1.0 - uStrength * smoothstep(uRadius, uRadius + uSoftness, d);
  gl_FragColor = vec4(v, v, v, 1.0);
}
