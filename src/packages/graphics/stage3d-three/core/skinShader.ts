import type { MeshPhysicalMaterial, WebGLProgramParametersWithUniforms } from "three";

// What makes the physical material read as skin rather than plastic, added to three's own shader:
// - pores, as fine noise in the model's own space (so they stay on the skin as it moves), and the creases over and under
//   each joint from the mesh's `crease` attribute, both as a bump on the surface;
// - light passing through the skin: the key light wrapped round past the shadow's edge in the skin's red, and a warm
//   glow at the rim where the skin is thin to the eye.

export interface SkinUniforms {
  // The key light's direction and colour in view space, set each frame.
  keyDirection: { value: { x: number; y: number; z: number } };
  keyColour: { value: { r: number; g: number; b: number } };
  // 0 to 1: how much fine detail (the pores) is drawn, less on a weaker device.
  detail: { value: number };
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
  attribute vec3 crease;
  varying vec3 vCrease;
  varying vec3 vSkinPosition;
`;

const VERTEX_BODY = /* glsl */ `
  vCrease = crease;
  vSkinPosition = position;
`;

const FRAGMENT_DECLARATIONS = /* glsl */ `
  varying vec3 vCrease;
  varying vec3 vSkinPosition;
  uniform vec3 uKeyDirection;
  uniform vec3 uKeyColour;
  uniform float uDetail;
  ${NOISE}

  // The skin's height at this point, in millimetres: pores and fine grain, then the creases at the joints.
  float skinHeight() {
    float height = (skinNoise(vSkinPosition * 3.4) - 0.5) * 0.012 * uDetail;
    height += (skinNoise(vSkinPosition * 9.1) - 0.5) * 0.006 * uDetail;
    float strength = vCrease.x;
    float along = vCrease.y;

    if (vCrease.z > 0.0) {
      // Over the joint: a few fine wrinkles across the digit, fading out from the middle.
      height -= strength * (0.5 + 0.5 * cos(along * 4.5)) * 0.07;
    } else {
      // Under it: a fold, deepest at the joint's line.
      height -= strength * exp(-along * along * 1.2) * 0.22;
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
    return normalize(abs(determinant) * normal - gradient);
  }
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
    float rim = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 3.0);
    reflectedLight.indirectDiffuse += skinScatter * rim * diffuseColor.rgb * 0.18;
  }
`;

export const makeSkin = (material: MeshPhysicalMaterial): SkinUniforms => {
  const uniforms: SkinUniforms = {
    keyDirection: { value: { x: 0.4, y: 0.6, z: 0.7 } },
    keyColour: { value: { r: 1, g: 0.95, b: 0.9 } },
    detail: { value: 1 },
  };

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uKeyDirection = uniforms.keyDirection;
    shader.uniforms.uKeyColour = uniforms.keyColour;
    shader.uniforms.uDetail = uniforms.detail;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_DECLARATIONS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_DECLARATIONS}`)
      .replace("#include <normal_fragment_maps>", FRAGMENT_NORMAL)
      .replace("#include <lights_fragment_end>", FRAGMENT_LIGHT);
  };
  material.customProgramCacheKey = () => "skin";

  return uniforms;
};
