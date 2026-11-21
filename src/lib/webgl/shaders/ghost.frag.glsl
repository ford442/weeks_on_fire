// Added onto the frame (blend ONE, ONE): the part of an earlier frame that is brighter than now,
// weighted. Static pixels add nothing, so only things that moved leave an afterimage.
precision mediump float;

varying vec2 vUv;
uniform sampler2D uCurrent;
uniform sampler2D uGhost;
uniform float uWeight;

void main() {
  vec3 current = texture2D(uCurrent, vUv).rgb;
  vec3 ghost = texture2D(uGhost, vUv).rgb;
  gl_FragColor = vec4(uWeight * max(ghost - current, 0.0), 0.0);
}
