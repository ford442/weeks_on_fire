// Unlit lines. INSTANCED adds a per-instance model matrix (3-6) and colour (7).
attribute vec3 aPosition;

#include <frame>

#ifdef INSTANCED
attribute mat4 aModel;
attribute vec3 aInstanceColor;
varying vec3 vInstanceColor;
#else
uniform mat4 uModel;
#endif

void main() {
#ifdef INSTANCED
  vInstanceColor = aInstanceColor;
  gl_Position = uProj * uView * aModel * vec4(aPosition, 1.0);
#else
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
#endif
}
