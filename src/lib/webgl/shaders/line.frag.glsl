precision mediump float;

#ifdef INSTANCED
varying vec3 vInstanceColor;
#else
uniform vec3 uColor;
#endif

void main() {
#ifdef INSTANCED
  gl_FragColor = vec4(vInstanceColor, 1.0);
#else
  gl_FragColor = vec4(uColor, 1.0);
#endif
}
