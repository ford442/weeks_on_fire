// Blended onto the frame: the part of an earlier frame that is brighter than now (uDarken 0,
// added) or darker than now (uDarken 1, reverse-subtracted), weighted. Static pixels change
// nothing, so only things that moved leave an afterimage.
precision mediump float;

varying vec2 vUv;
uniform sampler2D uCurrent;
uniform sampler2D uGhost;
uniform float uWeight;
uniform float uDarken;

void main() {
  vec3 current = texture2D(uCurrent, vUv).rgb;
  vec3 ghost = texture2D(uGhost, vUv).rgb;
  vec3 change = mix(ghost - current, current - ghost, uDarken);
  gl_FragColor = vec4(uWeight * max(change, 0.0), 0.0);
}
