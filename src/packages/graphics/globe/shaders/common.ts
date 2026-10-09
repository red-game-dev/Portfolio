// The most crater scars one globe draws.
export const MAX_CRATERS = 8;

// One triangle that covers the viewport.
export const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Precision, the pixel to view space mapping every globe shares, and value noise over 3D space: sampled on the
// unit sphere it has no seams and no pinching at the poles, so every surface is continuous all the way round.
export const COMMON = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_origin;
uniform float u_pixelRatio;
uniform float u_canvasHeight;
uniform vec2 u_centre;
uniform float u_radius;
uniform float u_angle;

// This pixel in the globe's view space, in radii: x along the screen at angle u_angle (towards the light, or
// away from it when the globe is turned to keep north up), y a quarter turn anticlockwise from it.
vec2 viewPoint() {
  vec2 css = vec2(u_origin.x + gl_FragCoord.x / u_pixelRatio, u_origin.y + (u_canvasHeight - gl_FragCoord.y) / u_pixelRatio);
  vec2 d = (css - u_centre) / u_radius;
  float c = cos(u_angle);
  float s = sin(u_angle);
  return vec2(d.x * c + d.y * s, d.x * s - d.y * c);
}

// x squared: pow() is undefined for a negative base, which some GPUs turn into NaN.
float sq(float x) {
  return x * x;
}

float hash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.11369, 0.13787));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), u.x), mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x), mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
    u.z);
}

float fbm(vec3 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amplitude * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    amplitude *= 0.5;
  }
  return sum;
}
`;
