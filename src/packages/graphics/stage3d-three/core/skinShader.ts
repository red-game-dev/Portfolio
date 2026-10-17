import type { MeshPhysicalMaterial, Texture, WebGLProgramParametersWithUniforms } from "three";

// What makes the physical material read as skin rather than plastic, added to three's own shader:
// - its relief, as a bump on the surface, all in the model's own space (so it stays on the skin as it moves): pores
//   and the fine furrows that cross the skin in a net, drawn only as near as the screen can show them; the lines at
//   each joint from the mesh's `crease` (wrinkles in rings over it, sharper the nearer the camera, and a fold or two
//   under it); and, from the model's detail map, the veins standing up on the back of the hand;
// - its colour: the veins' blue showing through;
// - light passing through it: the key light wrapped round past the shadow's edge in the skin's red, a warm glow at the
//   rim where the skin is thin to the eye, and the fine hair catching the light where the skin turns away.

export interface SkinUniforms {
  // The key light's direction and colour in view space, set each frame.
  keyDirection: { value: { x: number; y: number; z: number } };
  keyColour: { value: { r: number; g: number; b: number } };
  // 0 to 1: how much fine detail (pores, furrows, hair) is drawn, less on a weaker device.
  detail: { value: number };
  detailMap: { value: Texture | null };
}

const NOISE = /* glsl */ `
  float skinHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float skinNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(skinHash(i + vec3(0, 0, 0)), skinHash(i + vec3(1, 0, 0)), f.x),
                   mix(skinHash(i + vec3(0, 1, 0)), skinHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(skinHash(i + vec3(0, 0, 1)), skinHash(i + vec3(1, 0, 1)), f.x),
                   mix(skinHash(i + vec3(0, 1, 1)), skinHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
`;

const VERTEX_DECLARATIONS = /* glsl */ `
  attribute vec4 crease;
  attribute float mapped;
  varying vec4 vCrease;
  varying float vMapped;
  varying vec3 vSkinPosition;
  varying vec2 vSkinUv;
`;

const VERTEX_BODY = /* glsl */ `
  vCrease = crease;
  vMapped = mapped;
  vSkinPosition = position;
  vSkinUv = uv;
`;

const FRAGMENT_DECLARATIONS = /* glsl */ `
  varying vec4 vCrease;
  varying float vMapped;
  varying vec3 vSkinPosition;
  varying vec2 vSkinUv;
  uniform vec3 uKeyDirection;
  uniform vec3 uKeyColour;
  uniform float uDetail;
  #ifdef SKIN_DETAIL
    uniform sampler2D uSkinDetail;
  #endif
  // The detail map where this fragment lies: red a vein's raise, green its blue, blue the fine hair.
  vec4 skinMapValue;
  ${NOISE}

  // The furrows that cross the skin in a net of small rhombs: three sets of fine lines, each wandering a little.
  float skinFurrows(vec3 p) {
    vec3 q = p + (vec3(skinNoise(p * 0.7), skinNoise(p * 0.7 + 3.1), skinNoise(p * 0.7 + 6.2)) - 0.5) * 0.9;
    float a = clamp(1.0 - abs(sin(dot(q, vec3(1.9, 1.1, 0.6)))), 0.0, 1.0);
    float b = clamp(1.0 - abs(sin(dot(q, vec3(-1.2, 1.8, 0.5)))), 0.0, 1.0);
    float c = clamp(1.0 - abs(sin(dot(q, vec3(0.4, -0.6, 2.1)))), 0.0, 1.0);
    return pow(a, 6.0) + pow(b, 6.0) + pow(c, 6.0) * 0.6;
  }

  // The skin's height at this point, in millimetres.
  float skinHeight() {
    // How many millimetres a pixel spans: detail finer than a pixel or two is left out, or it would shimmer.
    float footprint = length(fwidth(vSkinPosition));
    float fine = uDetail * (1.0 - smoothstep(0.18, 0.5, footprint));
    float height = (skinNoise(vSkinPosition * 3.4) - 0.5) * 0.012 * uDetail;
    height += (skinNoise(vSkinPosition * 9.1) - 0.5) * 0.006 * fine;
    height -= skinFurrows(vSkinPosition) * 0.018 * fine;
    height += skinMapValue.r * 0.15;

    float depth = vCrease.x;
    float along = vCrease.y;
    // Taken outside the branches, where every pixel of a block works it out.
    float alongWidth = max(fwidth(along), 1e-3);

    if (vCrease.w > 0.0) {
      // Over the joint: wrinkles in rings round its middle, so each line bows away from it, wandering and broken. The
      // further apart the screen puts them, the sharper they are drawn.
      float ring = sqrt(along * along + vCrease.z * vCrease.z * 1.44);
      float phase = ring + (skinNoise(vSkinPosition * 0.9) - 0.5) * 0.6;
      float sharpness = clamp(1.0 / (12.0 * alongWidth * alongWidth), 1.5, 8.0);
      // Clamped: rounding can take the base a hair below 0, where pow is undefined and draws a black pixel.
      float valley = pow(clamp(0.5 + 0.5 * cos(phase * 6.2831853), 0.0, 1.0), sharpness);
      float broken = 0.4 + 0.8 * skinNoise(vSkinPosition * 0.7 + 7.0);
      height -= depth * valley * broken * 0.09;
    } else {
      // Under it: a fold, deepest at the joint's line, or two either side of it at a finger's middle joint.
      float gap = max(-vCrease.w - 1.0, 0.0);
      // Squared by hand: pow is undefined for a negative base.
      float nearFirst = (along - gap * 0.5) / 0.7;
      float nearSecond = (along + gap * 0.5) / 0.7;
      float first = exp(-nearFirst * nearFirst);
      float second = gap > 0.1 ? exp(-nearSecond * nearSecond) : 0.0;
      height -= depth * (first + second) * 0.22;
    }

    return height;
  }

  // The normal bent by the height's slope across the screen, the way a bump map bends it.
  vec3 skinBump(vec3 position, vec3 normal) {
    float height = skinHeight();
    vec2 slope = vec2(dFdx(height), dFdy(height));
    vec3 sigmaX = dFdx(position);
    vec3 sigmaY = dFdy(position);
    vec3 r1 = cross(sigmaY, normal);
    vec3 r2 = cross(normal, sigmaX);
    float determinant = dot(sigmaX, r1);
    vec3 gradient = sign(determinant) * (slope.x * r1 + slope.y * r2);
    vec3 bent = abs(determinant) * normal - gradient;
    // Where the surface is seen edge on there is nothing to bend.
    return dot(bent, bent) > 1e-12 ? normalize(bent) : normal;
  }
`;

const FRAGMENT_COLOUR = /* glsl */ `
  #include <color_fragment>
  #ifdef SKIN_DETAIL
    skinMapValue = texture2D(uSkinDetail, vSkinUv) * vMapped;
    // A vein's blue, through light skin.
    diffuseColor.rgb *= mix(vec3(1.0), vec3(0.78, 0.86, 1.0), skinMapValue.g * 0.7);
  #else
    skinMapValue = vec4(0.0);
  #endif
`;

const FRAGMENT_NORMAL = /* glsl */ `
  #include <normal_fragment_maps>
  normal = skinBump(-vViewPosition, normal);
`;

const FRAGMENT_LIGHT = /* glsl */ `
  #include <lights_fragment_end>
  {
    vec3 skinScatter = vec3(1.0, 0.32, 0.22);
    vec3 towardsKey = normalize(uKeyDirection);
    float facing = dot(normal, towardsKey);
    // The key light wrapped past the shadow's edge, as light carried under the skin.
    float wrapped = max(0.0, (facing + 0.5) / 1.5) - max(0.0, facing);
    reflectedLight.directDiffuse += skinScatter * wrapped * uKeyColour * diffuseColor.rgb * 0.75;
    // A warm glow where the skin turns away from the eye.
    float turned = clamp(1.0 - dot(normal, normalize(vViewPosition)), 0.0, 1.0);
    reflectedLight.indirectDiffuse += skinScatter * pow(turned, 3.0) * diffuseColor.rgb * 0.18;
    // The fine hair, too fine to see one by one, catching the light where the skin turns away.
    vec3 fuzz = vec3(1.0, 0.92, 0.84) * skinMapValue.b * turned * turned * uDetail;
    reflectedLight.directSpecular += fuzz * uKeyColour * max(facing + 0.35, 0.0) * 0.1;
    reflectedLight.indirectDiffuse += fuzz * 0.04;
  }
`;

export const makeSkin = (material: MeshPhysicalMaterial, detailMap: Texture | null = null): SkinUniforms => {
  const uniforms: SkinUniforms = {
    keyDirection: { value: { x: 0.4, y: 0.6, z: 0.7 } },
    keyColour: { value: { r: 1, g: 0.95, b: 0.9 } },
    detail: { value: 1 },
    detailMap: { value: detailMap },
  };

  if (detailMap) {
    material.defines = { ...material.defines, SKIN_DETAIL: "" };
  }

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uKeyDirection = uniforms.keyDirection;
    shader.uniforms.uKeyColour = uniforms.keyColour;
    shader.uniforms.uDetail = uniforms.detail;
    shader.uniforms.uSkinDetail = uniforms.detailMap;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_DECLARATIONS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_DECLARATIONS}`)
      .replace("#include <color_fragment>", FRAGMENT_COLOUR)
      .replace("#include <normal_fragment_maps>", FRAGMENT_NORMAL)
      .replace("#include <lights_fragment_end>", FRAGMENT_LIGHT);
  };
  material.customProgramCacheKey = () => (detailMap ? "skin-detail" : "skin");

  return uniforms;
};
