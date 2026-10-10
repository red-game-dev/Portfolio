import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { createProgram } from "@/packages/graphics/webgl";
import { DEG } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { GlobeDraw, GlobeLook, GlobeRenderer, StarDraw } from "../domain/types";
import { MAX_CRATERS, VERTEX } from "../shaders/common";
import { PLANET_FRAGMENT, SURFACE_IDS } from "../shaders/planet";
import { STAR_FRAGMENT } from "../shaders/star";
import { blackbody, rgb01 } from "../utils/colour";
import { globeFrame } from "../utils/frame";
import { visibleRegion } from "../utils/region";

type GlCanvas = HTMLCanvasElement | OffscreenCanvas;

// The most device pixels a globe is drawn with: a full screen at a pixel ratio of two is about this.
const MAX_PIXELS = 3840 * 2160;

// How far past its disc each kind of globe can draw, in radii: air and rings, and a star's corona.
const PLANET_REACH = 1.08;
const STAR_REACH = 2.4;

interface Program {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

const NONE: [number, number, number] = [0, 0, 0];

const seedVector = (seed: number): [number, number, number] => [((seed * 12.9898) % 97) + 3.1, ((seed * 78.233) % 89) + 5.7, ((seed * 37.719) % 83) + 1.3];

// What a look's colours and seed come to as the shader takes them, worked out once per look rather than every
// frame.
interface LookUniforms {
  palette: Float32Array;
  seed: [number, number, number];
  air: [number, number, number];
  sunset: [number, number, number];
  ringColour: [number, number, number];
}

const lookUniforms = new WeakMap<GlobeLook, LookUniforms>();

const uniformsOf = (look: GlobeLook): LookUniforms => {
  const known = lookUniforms.get(look);

  if (known) {
    return known;
  }

  const palette = new Float32Array(12);

  look.surface.palette.slice(0, 4).forEach((hex, index) => palette.set(rgb01(hex), index * 3));

  const made: LookUniforms = {
    palette,
    seed: seedVector(look.surface.seed),
    air: look.atmosphere ? rgb01(look.atmosphere.colour) : NONE,
    sunset: look.atmosphere?.sunset ? rgb01(look.atmosphere.sunset) : NONE,
    ringColour: look.rings ? rgb01(look.rings.colour) : NONE,
  };

  lookUniforms.set(look, made);

  return made;
};

// Draws planets, moons and stars on the GPU, each fresh every frame so it turns, its clouds drift and its star
// boils, into a canvas of its own that is then copied into the 2D target where the globe sits. Only the part of
// a globe that is on screen is drawn, at the target's resolution, so a planet filling the view is as sharp and
// no dearer than one far off. `create` returns null where WebGL is missing.
export class WebGLGlobeRenderer implements GlobeRenderer {
  public readonly isGpu = true;
  private readonly canvas: GlCanvas;
  private readonly gl: WebGLRenderingContext;
  private readonly planet: Program;
  private readonly star: Program;
  private readonly textures = new Map<string, WebGLTexture>();
  private readonly blank: WebGLTexture;
  private readonly buffer: WebGLBuffer | null;
  private readonly craterData = new Float32Array(MAX_CRATERS * 4);
  private size = { width: 0, height: 0, pixelRatio: 1 };
  private octaves = 5;
  private isLost = false;

  private constructor(canvas: GlCanvas, gl: WebGLRenderingContext, planet: Program, star: Program, blank: WebGLTexture) {
    this.canvas = canvas;
    this.gl = gl;
    this.planet = planet;
    this.star = star;
    this.blank = blank;

    const buffer = gl.createBuffer();

    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    [planet, star].forEach(({ program }) => {
      const position = gl.getAttribLocation(program, "a_position");

      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    });
    gl.disable(gl.BLEND);

    if ("addEventListener" in canvas) {
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        this.isLost = true;
      });
    }
  }

  public get available(): boolean {
    return !this.isLost;
  }

  public static create(canvas: GlCanvas): WebGLGlobeRenderer | null {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, premultipliedAlpha: true, preserveDrawingBuffer: false });

    if (!gl || !("createShader" in gl)) {
      return null;
    }

    const hasDerivatives = gl.getExtension("OES_standard_derivatives") !== null;
    const planet = WebGLGlobeRenderer.program(gl, PLANET_FRAGMENT(hasDerivatives));
    const star = WebGLGlobeRenderer.program(gl, STAR_FRAGMENT);
    const blank = gl.createTexture();

    if (!planet || !star || !blank) {
      return null;
    }

    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return new WebGLGlobeRenderer(canvas, gl, planet, star, blank);
  }

  private static program(gl: WebGLRenderingContext, fragment: string): Program | null {
    const program = createProgram(gl, VERTEX, fragment);

    return program ? { program, uniforms: new Map() } : null;
  }

  public resize(width: number, height: number, pixelRatio: number): void {
    const ratio = Math.min(pixelRatio, Math.sqrt(MAX_PIXELS / Math.max(1, width * height)));
    const pixelWidth = Math.max(1, Math.ceil(width * ratio));
    const pixelHeight = Math.max(1, Math.ceil(height * ratio));

    this.size = { width, height, pixelRatio: ratio };

    // Setting a canvas's size reallocates it even when nothing changes.
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
  }

  public setDetail(octaves: number): void {
    this.octaves = clamp(Math.round(octaves), 1, 5);
  }

  // A map uploaded once, with mipmaps so it stays clean when the globe is small. Maps wrap round in longitude.
  public setTexture(id: string, image: TexImageSource): void {
    const { gl } = this;
    const texture = this.textures.get(id) ?? gl.createTexture();

    if (!texture || this.isLost) {
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.textures.set(id, texture);
  }

  public hasTexture(id: string): boolean {
    return this.textures.has(id);
  }

  public drawGlobe(target: Canvas2DContext, draw: GlobeDraw): void {
    const { look, pose } = draw;
    const reach = Math.max(PLANET_REACH, 1 + (look.atmosphere?.thickness ?? 0), look.rings?.outer ?? 0);
    const region = this.begin(draw.x, draw.y, draw.radius, reach);

    if (!region) {
      return;
    }

    const { gl } = this;
    const program = this.planet;
    const frame = globeFrame(pose);
    const surface = look.surface;
    const map = surface.map ? this.textures.get(surface.map) : undefined;
    const night = surface.night ? this.textures.get(surface.night) : undefined;
    const clouds = surface.clouds ? this.textures.get(surface.clouds) : undefined;
    const air = look.atmosphere;
    const rings = look.rings;
    const uniforms = uniformsOf(look);

    this.use(program, draw.x, draw.y, draw.radius, frame.angle, region);
    this.vec3(program, "u_pole", frame.pole);
    this.vec3(program, "u_front", frame.front);
    this.vec3(program, "u_east", frame.east);
    this.vec3(program, "u_light", frame.light);
    this.float(program, "u_spin", frame.spin);
    this.float(program, "u_brightness", draw.light);
    this.float(program, "u_time", draw.time);
    this.bind(program, "u_map", 0, map);
    this.bind(program, "u_night", 1, night);
    this.bind(program, "u_clouds", 2, clouds);
    this.float(program, "u_hasMap", map ? 1 : 0);
    this.float(program, "u_hasNight", night ? 1 : 0);
    this.float(program, "u_hasClouds", clouds ? 1 : 0);
    this.float(program, "u_mapLeft", ((surface.centreLongitude ?? 0) - 180) * DEG);
    this.float(program, "u_cloudCover", look.clouds ?? 0);
    this.float(program, "u_cloudShift", (look.cloudDrift ?? 0) * draw.time);
    this.float(program, "u_kind", SURFACE_IDS[surface.kind]);
    gl.uniform3fv(this.location(program, "u_palette"), uniforms.palette);
    this.vec3(program, "u_seed", uniforms.seed);
    gl.uniform4f(this.location(program, "u_shape"), surface.sea ?? 0.6, surface.bands ?? 0.5, surface.turbulence ?? 0.5, surface.caps ?? 0);
    this.float(program, "u_glint", surface.glint ? 0.8 : 0);
    gl.uniform4f(this.location(program, "u_air"), uniforms.air[0], uniforms.air[1], uniforms.air[2], air ? air.thickness : 0);
    this.float(program, "u_airDensity", air?.density ?? 0);
    this.vec3(program, "u_sunset", uniforms.sunset);
    gl.uniform4f(this.location(program, "u_rings"), rings?.inner ?? 0, rings?.outer ?? 0, rings?.opacity ?? 0, rings?.seed ?? 0);
    this.vec3(program, "u_ringColour", uniforms.ringColour);
    this.float(program, "u_aurora", draw.aurora);

    const count = Math.min(MAX_CRATERS, draw.craters.length);

    this.craterData.fill(0);
    for (let index = 0; index < count; index += 1) {
      const crater = draw.craters[index];
      const at = index * 4;

      this.craterData[at] = crater.longitude * DEG;
      this.craterData[at + 1] = crater.latitude * DEG;
      this.craterData[at + 2] = crater.size * DEG;
      this.craterData[at + 3] = crater.heat;
    }

    gl.uniform4fv(this.location(program, "u_craters"), this.craterData);
    gl.uniform1i(this.location(program, "u_craterCount"), count);
    this.finish(target, region);
  }

  public drawStar(target: Canvas2DContext, draw: StarDraw): void {
    const region = this.begin(draw.x, draw.y, draw.radius, draw.look.corona > 0 ? STAR_REACH : 1.02);

    if (!region) {
      return;
    }

    const program = this.star;

    this.use(program, draw.x, draw.y, draw.radius, 0, region);
    this.vec3(program, "u_colour", blackbody(draw.look.temperatureK));
    this.float(program, "u_time", draw.time);
    this.float(program, "u_granulation", draw.look.granulation);
    this.float(program, "u_spots", draw.look.spots);
    this.float(program, "u_corona", draw.look.corona);
    this.vec3(program, "u_seed", seedVector(draw.look.seed));
    this.vec3(program, "u_flare", draw.flare ? [draw.flare.angle, 0, draw.flare.strength] : NONE);
    this.finish(target, region);
  }

  // Gives the GPU back everything: the maps, the programs, the buffer, and the context itself, which browsers
  // allow only a few of at once.
  public dispose(): void {
    const { gl } = this;

    this.textures.forEach((texture) => gl.deleteTexture(texture));
    this.textures.clear();

    if (!this.isLost) {
      gl.deleteTexture(this.blank);
      gl.deleteBuffer(this.buffer);
      gl.deleteProgram(this.planet.program);
      gl.deleteProgram(this.star.program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }

    this.isLost = true;
  }

  // The part of a globe on the target, and the device pixels to draw it with; null when none of it is on screen.
  private begin(x: number, y: number, radius: number, reach: number) {
    if (this.isLost) {
      return null;
    }

    return visibleRegion(x, y, radius * reach, this.size.width, this.size.height, this.size.pixelRatio, this.canvas.width, this.canvas.height);
  }

  private use(program: Program, x: number, y: number, radius: number, angle: number, region: NonNullable<ReturnType<WebGLGlobeRenderer["begin"]>>): void {
    const { gl } = this;

    gl.useProgram(program.program);
    // The region drawn at the canvas's top left, which is where the copy reads it from, cleared a little wider
    // first: a scaled copy samples a pixel past its edge, which must not show the globe drawn before.
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, Math.max(0, this.canvas.height - region.pixelHeight - 2), region.pixelWidth + 2, region.pixelHeight + 2);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, this.canvas.height - region.pixelHeight, region.pixelWidth, region.pixelHeight);
    gl.uniform2f(this.location(program, "u_origin"), region.x, region.y);
    this.float(program, "u_pixelRatio", region.pixelRatio);
    this.float(program, "u_canvasHeight", this.canvas.height);
    gl.uniform2f(this.location(program, "u_centre"), x, y);
    this.float(program, "u_radius", radius);
    this.float(program, "u_angle", angle);
    this.float(program, "u_octaves", this.octaves);
  }

  private finish(target: Canvas2DContext, region: NonNullable<ReturnType<WebGLGlobeRenderer["begin"]>>): void {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    target.drawImage(this.canvas, 0, 0, region.pixelWidth, region.pixelHeight, region.x, region.y, region.width, region.height);
  }

  private location(program: Program, name: string): WebGLUniformLocation | null {
    if (!program.uniforms.has(name)) {
      program.uniforms.set(name, this.gl.getUniformLocation(program.program, name));
    }

    return program.uniforms.get(name) ?? null;
  }

  private float(program: Program, name: string, value: number): void {
    this.gl.uniform1f(this.location(program, name), value);
  }

  private vec3(program: Program, name: string, [x, y, z]: readonly [number, number, number]): void {
    this.gl.uniform3f(this.location(program, name), x, y, z);
  }

  private bind(program: Program, name: string, unit: number, texture: WebGLTexture | undefined): void {
    const { gl } = this;

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture ?? this.blank);
    gl.uniform1i(this.location(program, name), unit);
  }
}
