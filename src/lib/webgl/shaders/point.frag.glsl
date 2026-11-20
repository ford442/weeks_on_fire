precision mediump float;

uniform vec3 uColor;
uniform float uAlpha;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float a = uAlpha * (1.0 - d);
  gl_FragColor = vec4(uColor, a);
}
