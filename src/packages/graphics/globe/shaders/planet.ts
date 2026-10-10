import { COMMON, MAX_CRATERS } from "./common";

// The surface recipes, in the order of their ids in `SURFACE_IDS`.
const SURFACES = `
vec3 paletteAt(float t) {
  t = clamp(t, 0.0, 1.0) * 3.0;
  if (t < 1.0) { return mix(u_palette[0], u_palette[1], t); }
  if (t < 2.0) { return mix(u_palette[1], u_palette[2], t - 1.0); }
  return mix(u_palette[2], u_palette[3], t - 2.0);
}

// Round pits with raised rims, from a field of cells, for airless worlds.
float craterField(vec3 dir, float scale) {
  vec3 p = dir * scale + u_seed;
  vec3 cell = floor(p);
  float shade = 0.0;
  for (int i = 0; i < 2; i++) {
    vec3 c = cell + vec3(float(i), 0.0, 0.0);
    vec3 centre = c + vec3(hash(c), hash(c + 7.1), hash(c + 3.3));
    float size = 0.18 + 0.3 * hash(c + 1.9);
    float d = length(p - centre) / size;
    shade += (d < 1.0 ? -0.35 * (1.0 - d * d) : 0.0) + 0.25 * exp(-sq((d - 1.0) * 7.0));
  }
  return shade;
}

// How squarely the light falls here (1 under it, 0 at the terminator, below 0 on the night side), set before the
// recipes run, for worlds whose look follows their star: one locked with a face to it, one boiled by it.
float g_facing;

vec3 surfaceColour(vec3 dir, float latitude, out float glow) {
  glow = 0.0;
  float h = fbm(dir * 2.6 + u_seed);
  float detail = fbm(dir * 9.0 + u_seed * 1.7);
  if (u_kind < 0.5) {
    return paletteAt(h * 0.8 + detail * 0.3);
  }
  if (u_kind < 1.5) {
    float pits = craterField(dir, 7.0) + craterField(dir, 17.0) * 0.6;
    return paletteAt(h * 0.7 + detail * 0.2 + pits * 0.5 + 0.1);
  }
  if (u_kind < 2.5) {
    float lines = 1.0 - smoothstep(0.0, 0.035, abs(fbm(dir * 3.5 + u_seed) - 0.5));
    return mix(paletteAt(0.75 + detail * 0.3), u_palette[0], lines * 0.75);
  }
  if (u_kind < 3.5) {
    float spots = smoothstep(0.62, 0.7, fbm(dir * 6.0 + u_seed));
    glow = spots * 0.35;
    return mix(paletteAt(h + detail * 0.2), u_palette[0], spots);
  }
  if (u_kind < 4.5) {
    float land = h + detail * 0.18;
    float sea = u_shape.x;
    vec3 colour = land < sea ? mix(u_palette[0], u_palette[1], land / max(sea, 0.01)) : paletteAt(0.4 + (land - sea) / max(1.0 - sea, 0.01) * 0.6);
    float ice = smoothstep(1.0 - u_shape.w, 1.05 - u_shape.w, abs(latitude) / 1.5707963 + detail * 0.08);
    return mix(colour, vec3(0.93, 0.95, 1.0), ice);
  }
  if (u_kind < 5.5) {
    float dunes = sin(dir.z * 40.0 + fbm(dir * 5.0 + u_seed) * 9.0) * 0.5 + 0.5;
    return paletteAt(h * 0.7 + dunes * 0.25);
  }
  if (u_kind < 6.5) {
    float cracks = 1.0 - smoothstep(0.0, 0.05, abs(fbm(dir * 4.0 + u_seed) - 0.5));
    glow = cracks * 1.2;
    return mix(u_palette[0], u_palette[1], h);
  }
  if (u_kind < 8.5) {
    // Bands of cloud round the pole, their edges torn by turbulence, with the odd great storm.
    float bands = 3.0 + u_shape.y * 18.0;
    float wobble = fbm(dir * vec3(2.0, 2.0, 7.0) + u_seed) * u_shape.z * 2.5;
    float band = sin(latitude * bands + wobble * 3.0) * 0.5 + 0.5;
    float swirl = fbm(dir * 6.0 + vec3(band * 2.0) + u_seed);
    vec3 colour = paletteAt(band * 0.75 + swirl * 0.35 - 0.1);
    if (u_kind > 7.5) {
      colour = mix(u_palette[1], u_palette[2], smoothstep(-0.6, 0.6, sin(latitude * bands * 0.5 + wobble)) * 0.45 + swirl * 0.25);
    }
    return colour;
  }
  if (u_kind < 9.5) {
    float veil = fbm(dir * vec3(3.0, 3.0, 1.2) + vec3(u_time * 0.01) + u_seed);
    return paletteAt(veil * 0.9 + 0.1);
  }
  if (u_kind < 10.5) {
    float swirl = fbm(dir * 4.0 + vec3(fbm(dir * 2.0 + u_seed) * 3.0));
    return paletteAt(swirl);
  }
  if (u_kind < 11.5) {
    return paletteAt(h * 0.5 + detail * 0.2);
  }
  if (u_kind < 12.5) {
    // An eyeball world, one face always to its red dwarf: open sea under the star, its shore ragged, ice beyond.
    float shore = (fbm(dir * 5.0 + u_seed) - 0.5) * 0.3;
    float open = smoothstep(0.42, 0.58, g_facing + shore);
    vec3 sea = mix(u_palette[1], u_palette[0], smoothstep(0.58, 0.95, g_facing + shore * 0.5));
    vec3 ice = mix(u_palette[2], u_palette[3], clamp(detail * 1.2, 0.0, 1.0));
    return mix(ice, sea, open);
  }
  // A hot Jupiter: dark bands, hottest under its star, its night side glowing with its own heat.
  float hotBands = 4.0 + u_shape.y * 10.0;
  float hotWobble = fbm(dir * vec3(2.0, 2.0, 6.0) + u_seed) * (0.5 + u_shape.z);
  float hotBand = sin(latitude * hotBands + hotWobble * 3.0) * 0.5 + 0.5;
  glow = 0.35 + 0.5 * smoothstep(0.2, 1.0, g_facing) + 0.2 * hotBand;
  return paletteAt(hotBand * 0.6 + fbm(dir * 6.0 + u_seed) * 0.3);
}
`;

const RINGS = `
// The ring system's brightness at a distance in radii: a faint inner ring, a bright broad one, a dark division,
// an outer ring with a narrow gap, all over fine ringlets.
float ringProfile(float rho) {
  float t = (rho - u_rings.x) / max(u_rings.y - u_rings.x, 0.001);
  if (t < 0.0 || t > 1.0) { return 0.0; }
  float inner = (0.16 + t * 0.9) * (1.0 - smoothstep(0.25, 0.3, t));
  float broad = 0.95 * smoothstep(0.25, 0.3, t) * (1.0 - smoothstep(0.66, 0.7, t));
  float outer = 0.62 * smoothstep(0.74, 0.78, t);
  float base = inner + broad + outer;
  float ringlets = 0.72 + 0.28 * noise(vec3(rho * 140.0, u_rings.w, 1.0));
  float gap = smoothstep(0.004, 0.012, abs(t - 0.95));
  float edges = smoothstep(0.0, 0.03, t) * smoothstep(1.0, 0.97, t);
  return base * ringlets * gap * edges;
}

// Whether a point in view space sees the light past the body (1) or sits in its shadow (0).
float lightPast(vec3 p) {
  float b = dot(p, u_light);
  float c = dot(p, p) - 1.0;
  float disc = b * b - c;
  return (disc > 0.0 && -b - sqrt(disc) > 0.0) ? 0.0 : 1.0;
}
`;

export const PLANET_FRAGMENT = (hasDerivatives: boolean) => `${hasDerivatives ? "#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES 1\n" : ""}
${COMMON}
uniform vec3 u_pole;
uniform vec3 u_front;
uniform vec3 u_east;
uniform vec3 u_light;
uniform float u_spin;
uniform float u_brightness;
uniform float u_time;
uniform sampler2D u_map;
uniform sampler2D u_night;
uniform sampler2D u_clouds;
uniform float u_hasMap;
uniform float u_hasNight;
uniform float u_hasClouds;
uniform float u_mapLeft;
uniform float u_cloudCover;
uniform float u_cloudShift;
uniform float u_kind;
uniform vec3 u_palette[4];
uniform vec3 u_seed;
uniform vec4 u_shape;
uniform float u_glint;
uniform vec4 u_air;
uniform float u_airDensity;
uniform vec3 u_sunset;
uniform vec4 u_rings;
uniform vec3 u_ringColour;
uniform float u_aurora;
uniform vec4 u_craters[${MAX_CRATERS}];
uniform int u_craterCount;

${SURFACES}
${RINGS}

// A map's texel at a longitude and latitude. With derivatives, the coordinate that does not jump across the
// map's seam picks the mip level, so no line shows where the map's edges meet.
vec4 sampleMap(sampler2D map, float lon, float lat) {
  float u = (lon - u_mapLeft) / 6.2831853;
  float v = clamp(0.5 - lat / 3.1415927, 0.001, 0.999);
#ifdef HAS_DERIVATIVES
  float u1 = fract(u);
  float u2 = fract(u + 0.5) - 0.5;
  return texture2D(map, vec2(fwidth(u1) <= fwidth(u2) + 0.0001 ? u1 : u2, v));
#else
  return texture2D(map, vec2(u, v));
#endif
}

vec4 over(vec4 top, vec4 under) {
  return top + under * (1.0 - top.a);
}

void main() {
  vec2 q = viewPoint();
  float r2 = dot(q, q);
  float r = sqrt(r2);
  // Past the air and the rings there is nothing to draw: the corners of the square are left clear.
  float reach = max(1.0 + u_air.w, u_rings.z > 0.0 ? u_rings.y : 1.0) + 0.02;
  if (r > reach) {
    gl_FragColor = vec4(0.0);
    return;
  }
  // Only the disc and its antialiased rim show the surface; beyond it the costly recipes are skipped.
  bool onDisc = r < 1.0 + 1.5 / max(u_radius * u_pixelRatio, 1.0);
  // Every pixel reads the surface (clamped to the rim outside the disc), so texture lookups and derivatives
  // run in uniform flow.
  vec2 qs = r > 1.0 ? q / r : q;
  vec3 n = vec3(qs, sqrt(max(0.0, 1.0 - dot(qs, qs))));
  float lat = asin(clamp(dot(n, u_pole), -1.0, 1.0));
  float lon = u_spin + atan(dot(n, u_east), dot(n, u_front));
  vec3 dir = vec3(cos(lat) * cos(lon), cos(lat) * sin(lon), sin(lat));
  vec4 mapTexel = sampleMap(u_map, lon, lat);
  float nightTexel = sampleMap(u_night, lon, lat).r;
  float cloudTexel = sampleMap(u_clouds, lon + u_cloudShift, lat).r;

  // A real map wins; the noise recipe runs only where there is none, and only on the disc.
  float glow2 = 0.0;
  vec3 albedo = mapTexel.rgb;
  if (u_hasMap < 0.5 && onDisc) {
    g_facing = dot(n, u_light);
    albedo = surfaceColour(dir, lat, glow2);
  }

  float diffuse = dot(n, u_light);
  float soft = 0.03 + 0.16 * u_airDensity;
  float lit = smoothstep(-soft, soft, diffuse) * (0.1 + 0.9 * max(diffuse, 0.0));
  float day = smoothstep(-soft, soft, diffuse);

  // Clouds: the cloud map where there is one, drifting noise where there is air but no map.
  float cloud = cloudTexel * u_cloudCover;
  if (u_hasClouds < 0.5) {
    cloud = 0.0;
    if (u_cloudCover > 0.0 && onDisc) {
      cloud = u_cloudCover * smoothstep(0.55, 0.8, fbm(dir * 4.0 + vec3(u_cloudShift, 0.0, -u_cloudShift) + u_seed * 2.0));
    }
  }
  albedo = mix(albedo, vec3(0.96, 0.97, 1.0), cloud);

  // Scars of impacts: dark floors, bright rims, still glowing while hot.
  float scarGlow = 0.0;
  for (int i = 0; i < ${MAX_CRATERS}; i++) {
    if (i >= u_craterCount || !onDisc) { break; }
    vec4 crater = u_craters[i];
    vec3 centre = vec3(cos(crater.y) * cos(crater.x), cos(crater.y) * sin(crater.x), sin(crater.y));
    float d = acos(clamp(dot(dir, centre), -1.0, 1.0)) / max(crater.z, 0.001);
    albedo *= d < 1.0 ? mix(0.45, 0.85, d * d) : 1.0 + 0.3 * exp(-sq((d - 1.0) * 6.0)) - 0.12 * exp(-(d - 1.0) * 2.0) * step(1.0, d);
    scarGlow += crater.w * max(0.0, 1.0 - d) * (0.7 + 0.3 * noise(dir * 40.0 + vec3(u_time)));
  }

  // Rings cast their shadow on the body.
  float ringShadow = 1.0;
  float lightOverRings = dot(u_light, u_pole);
  if (u_rings.z > 0.0 && abs(lightOverRings) > 0.001) {
    float t = -dot(n, u_pole) / lightOverRings;
    if (t > 0.0) {
      ringShadow = 1.0 - ringProfile(length(n + u_light * t)) * u_rings.z * 0.85;
    }
  }

  vec3 colour = albedo * lit * u_brightness * ringShadow;

  // The Sun's glint on open water.
  if (u_glint > 0.0 && onDisc) {
    float water = smoothstep(0.04, 0.18, mapTexel.b - max(mapTexel.r, mapTexel.g) * 0.9);
    if (u_hasMap < 0.5) {
      water = step(fbm(dir * 2.6 + u_seed) + fbm(dir * 9.0 + u_seed * 1.7) * 0.18, u_shape.x);
    }
    vec3 halfway = normalize(u_light + vec3(0.0, 0.0, 1.0));
    colour += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, halfway), 0.0), 70.0) * water * (1.0 - cloud) * day * u_glint * u_brightness;
  }

  // City lights on the night side, dimmed by cloud.
  colour += vec3(1.0, 0.76, 0.42) * nightTexel * u_hasNight * (1.0 - day) * (1.0 - cloud * 0.75) * 1.3;
  // What glows by itself: lava, molten scars, aurora.
  colour += u_palette[3] * glow2 * (0.35 + 0.65 * (1.0 - day));
  colour += vec3(1.0, 0.45, 0.12) * scarGlow;
  if (u_aurora > 0.0 && onDisc) {
    float oval = exp(-sq((abs(lat) - 1.16) / 0.06));
    colour += vec3(0.25, 1.0, 0.55) * oval * (1.0 - day) * u_aurora * (0.55 + 0.45 * noise(dir * 9.0 + vec3(u_time * 0.7)));
  }

  // Air seen edge on at the rim, lit where the light reaches, reddened along the terminator.
  float fresnel = pow(1.0 - n.z, 2.4);
  float airLit = clamp(diffuse * 0.9 + 0.3, 0.0, 1.0);
  colour += u_air.rgb * fresnel * u_airDensity * airLit * u_brightness;
  colour += u_sunset * exp(-sq((diffuse - 0.02) / 0.06)) * u_airDensity * 0.16 * (0.3 + fresnel) * u_brightness;

  float coverage = clamp((1.0 - r) * u_radius * u_pixelRatio + 0.5, 0.0, 1.0);
  vec4 result = vec4(colour * coverage, coverage);

  // The halo of air beyond the limb.
  if (r > 1.0 && u_air.w > 0.0) {
    float h = (r - 1.0) / u_air.w;
    float density = pow(max(0.0, 1.0 - h), 2.2) * u_airDensity;
    float haloLit = clamp(dot(normalize(vec3(q, 0.0)), u_light) * 0.9 + 0.35, 0.0, 1.0) * u_brightness;
    float a = clamp(density * haloLit, 0.0, 1.0);
    result = over(result, vec4(u_air.rgb * a, a));
  }

  // The rings: the far side behind the body, the near side in front of it.
  if (u_rings.z > 0.0 && abs(u_pole.z) > 0.01) {
    float z = -q.y * u_pole.y / u_pole.z;
    vec3 p = vec3(q, z);
    float profile = ringProfile(length(p));
    if (profile > 0.0) {
      float sunSide = lightOverRings * u_pole.z > 0.0 ? 1.0 : 0.45;
      float shade = (0.4 + 0.6 * min(1.0, abs(lightOverRings) * 3.0)) * sunSide * lightPast(p) * u_brightness;
      float a = profile * u_rings.z;
      vec4 ring = vec4(u_ringColour * shade * a, a);
      if (z >= 0.0) {
        result = over(ring, result);
      } else if (r2 >= 1.0) {
        result = over(result, ring);
      }
    }
  }

  gl_FragColor = result;
}
`;

// Surface kinds, as the shader numbers them.
export const SURFACE_IDS = {
  rocky: 0,
  cratered: 1,
  icy: 2,
  volcanic: 3,
  terran: 4,
  desert: 5,
  lava: 6,
  gas: 7,
  iceGiant: 8,
  haze: 9,
  toxic: 10,
  rogue: 11,
  eyeball: 12,
  hotJupiter: 13,
} as const;
