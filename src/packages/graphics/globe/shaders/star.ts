import { COMMON } from "./common";

// A star: a boiling surface of granulation cells that drift with time, sunspots that come and go, darker towards
// the limb as real stars are, faculae bright near it, and beyond it a corona of streamers. A flare is a bright
// knot on the limb with a loop rising from it.
export const STAR_FRAGMENT = `
${COMMON}
uniform vec3 u_colour;
uniform float u_time;
uniform float u_granulation;
uniform float u_spots;
uniform float u_corona;
uniform vec3 u_seed;
uniform vec3 u_flare;

void main() {
  // Stars need no light angle: the frame is the screen's.
  vec2 css = vec2(u_origin.x + gl_FragCoord.x / u_pixelRatio, u_origin.y + (u_canvasHeight - gl_FragCoord.y) / u_pixelRatio);
  vec2 q = (css - u_centre) / u_radius;
  q.y = -q.y;
  float r = length(q);
  vec3 colour = vec3(0.0);
  float alpha = 0.0;

  if (r < 1.0) {
    float mu = sqrt(1.0 - r * r);
    vec3 n = vec3(q, mu);
    // The surface turns slowly; the cells boil faster than it turns.
    float turn = u_time * 0.004;
    vec3 body = vec3(n.x * cos(turn) - n.z * sin(turn), n.y, n.x * sin(turn) + n.z * cos(turn));
    float cells = fbm(body * 64.0 + u_seed + vec3(0.0, u_time * 0.06, u_time * 0.04));
    float grain = 1.0 + (cells - 0.5) * 0.32 * u_granulation;
    float active = fbm(body * 3.2 + u_seed * 1.3 + vec3(u_time * 0.002));
    float spots = smoothstep(0.71, 0.75, active) * u_spots;
    float penumbra = smoothstep(0.67, 0.71, active) * u_spots;
    // Darker and redder towards the limb, where the light comes from cooler, higher layers.
    float limb = 0.45 + 0.75 * pow(mu, 0.45);
    vec3 tint = mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.97, 0.88), pow(mu, 0.35));
    float faculae = (1.0 - mu) * smoothstep(0.55, 0.7, fbm(body * 12.0 + u_seed)) * 0.35;
    colour = u_colour * tint * limb * grain * (1.0 - penumbra * 0.3 - spots * 0.55) + u_colour * tint * faculae;
    colour = mix(colour, vec3(1.0, 0.99, 0.95), 0.35 * pow(mu, 2.0));
    alpha = clamp((1.0 - r) * u_radius * u_pixelRatio + 0.5, 0.0, 1.0);
    colour *= alpha;
  }

  // Corona: streamers that reach out unevenly round the limb, fading with distance.
  if (r > 0.98 && u_corona > 0.0) {
    float angle = atan(q.y, q.x);
    float streamers = 0.55 + 0.45 * fbm(vec3(cos(angle) * 3.0, sin(angle) * 3.0, u_time * 0.02) + u_seed);
    float fall = exp(-(r - 1.0) * (5.5 - streamers * 2.5));
    float a = clamp(fall * u_corona * 0.85, 0.0, 1.0) * (1.0 - alpha) * (1.0 - smoothstep(1.7, 2.35, r));
    colour += mix(u_colour, vec3(1.0), 0.5) * a;
    alpha += a;
  }

  // A flare: a hot knot at the limb and an arc of plasma above it.
  if (u_flare.z > 0.0) {
    vec2 spot = vec2(cos(u_flare.x), -sin(u_flare.x));
    float knot = exp(-sq(length(q - spot * 0.99) / 0.05)) * u_flare.z;
    vec2 base = spot * 1.0;
    vec2 tangent = vec2(-spot.y, spot.x);
    vec2 rel = q - base;
    float along = dot(rel, tangent);
    float up = dot(rel, spot);
    float arc = exp(-sq((up - (0.12 - along * along * 5.0)) / 0.012)) * step(abs(along), 0.15) * step(0.0, up) * u_flare.z;
    vec3 flare = vec3(1.0, 0.85, 0.6) * (knot * 2.0 + arc * 0.9);
    colour += flare;
    alpha = clamp(alpha + knot + arc * 0.8, 0.0, 1.0);
  }

  gl_FragColor = vec4(colour, alpha);
}
`;
