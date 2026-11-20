// Additive round point sprites (sparks, dust, steam, moths).
attribute vec3 aPosition;

#include <frame>

uniform mat4 uModel;
uniform float uSize;

void main() {
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
  gl_PointSize = uSize;
}
