// Lit and cel surfaces. Per vertex: position (0), normal (1), colour (2).
// INSTANCED adds, per instance: model matrix (3-6), colour (7), emissive rgb + shininess (8).
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;

#include <frame>

#ifdef INSTANCED
attribute mat4 aModel;
attribute vec3 aInstanceColor;
attribute vec4 aInstanceEmissive;
varying vec3 vInstanceColor;
varying vec4 vInstanceEmissive;
#else
uniform mat4 uModel;
uniform mat3 uNormalMat;
#endif

varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vColor;

void main() {
#ifdef INSTANCED
  mat4 model = aModel;
  // The same matrix normalFromMat4() uploads for plain draws (the inverse of the upper 3x3:
  // rows are the cofactor columns), up to the positive scale normalize() removes.
  vec3 m0 = model[0].xyz;
  vec3 m1 = model[1].xyz;
  vec3 m2 = model[2].xyz;
  vec3 c0 = cross(m1, m2);
  vec3 c1 = cross(m2, m0);
  vec3 c2 = cross(m0, m1);
  float detSign = dot(m0, c0) < 0.0 ? -1.0 : 1.0;
  mat3 normalMat = mat3(c0.x, c1.x, c2.x, c0.y, c1.y, c2.y, c0.z, c1.z, c2.z) * detSign;
  vInstanceColor = aInstanceColor;
  vInstanceEmissive = aInstanceEmissive;
#else
  mat4 model = uModel;
  mat3 normalMat = uNormalMat;
#endif
  vec4 world = model * vec4(aPosition, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(normalMat * aNormal);
  vColor = aColor;
  gl_Position = uProj * uView * world;
}
