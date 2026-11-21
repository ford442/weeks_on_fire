precision mediump float;

#include <frame>

varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vColor;

#ifdef INSTANCED
varying vec3 vInstanceColor;
varying vec4 vInstanceEmissive;
#else
uniform vec3 uColor;
uniform vec3 uEmissive;
uniform float uShininess;
#endif

uniform float uCel;
uniform float uUseVertexColor;

void main() {
#ifdef INSTANCED
  vec3 baseColor = vInstanceColor;
  vec3 emissive = vInstanceEmissive.rgb;
  float shininess = vInstanceEmissive.a;
#else
  vec3 baseColor = uColor;
  vec3 emissive = uEmissive;
  float shininess = uShininess;
#endif
  vec3 eye = uEyeFog.xyz;
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir.xyz);
  vec3 V = normalize(eye - vWorld);
  vec3 H = normalize(L + V);
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), shininess);
  if (uCel > 0.5) {
    diff = max(floor(diff * 3.0 + 0.35) / 3.0, 0.34);
    spec = spec > 0.55 ? 1.0 : 0.0;
  }
  vec3 albedo = mix(baseColor, vColor, uUseVertexColor);
  vec3 color =
    albedo * (uAmbient.xyz + uLightColor.xyz * diff) + uLightColor.xyz * spec * 0.28 + emissive;
  float pointRange = uPointPosRange.w;
  if (pointRange > 0.0) {
    vec3 toP = uPointPosRange.xyz - vWorld;
    float distP = length(toP);
    float att = clamp(1.0 - distP / pointRange, 0.0, 1.0);
    color += albedo * uPointColor.xyz * att * att * max(dot(N, normalize(toP)), 0.0);
  }
  float fogDensity = uEyeFog.w;
  float dist = length(eye - vWorld);
  float fog = fogDensity > 0.0 ? exp(-fogDensity * dist) : 1.0;
  gl_FragColor = vec4(mix(uFogColor.xyz, color, fog), 1.0);
}
