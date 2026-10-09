import { LensSource } from "../domain/types";
import { createProgram } from "../utils/program";

// How many black holes one pass can bend light round.
export const MAX_LENSES = 4;

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// For each pixel: where its light came from after passing every lens (the point lens equation), the scene
// sampled there, the shadow inside each hole, and a soft photon ring at its edge. Light from off screen is
// left dark rather than smeared from the edge.
const FRAGMENT = `
precision mediump float;
uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform vec4 u_lenses[${MAX_LENSES}];
uniform int u_count;
void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 source = p;
  float shadow = 0.0;
  float glow = 0.0;
  for (int i = 0; i < ${MAX_LENSES}; i++) {
    if (i >= u_count) { break; }
    vec4 lens = u_lenses[i];
    vec2 d = p - lens.xy;
    float r2 = max(dot(d, d), 1.0);
    float r = sqrt(r2);
    source -= d * ((lens.w * lens.w) / r2);
    shadow = max(shadow, 1.0 - smoothstep(lens.z * 0.94, lens.z, r));
    float ring = (r - lens.z * 1.06) / (lens.z * 0.1);
    glow += exp(-ring * ring) * 0.6;
  }
  vec2 uv = source / u_resolution;
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec3 color = texture2D(u_scene, clamp(uv, 0.0, 1.0)).rgb * inside;
  color += glow * vec3(1.0, 0.84, 0.58);
  gl_FragColor = vec4(color * (1.0 - shadow), 1.0);
}
`;

type GlCanvas = HTMLCanvasElement | OffscreenCanvas;

// Bends the rendered scene round black holes on the GPU. It owns a WebGL canvas laid over the 2D one: when a
// hole is on screen the scene is uploaded as a texture and drawn back through the lens shader; otherwise the
// canvas is hidden and costs nothing. `create` returns null where WebGL is missing, so callers keep a 2D lens.
export class LensingPresenter {
  private readonly canvas: GlCanvas;
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly texture: WebGLTexture;
  private readonly lensData = new Float32Array(MAX_LENSES * 4);
  private readonly locations: { resolution: WebGLUniformLocation | null; lenses: WebGLUniformLocation | null; count: WebGLUniformLocation | null };
  private isLost = false;
  private isActive = false;
  private size = { width: 0, height: 0, pixelRatio: 1 };

  private constructor(canvas: GlCanvas, gl: WebGLRenderingContext, program: WebGLProgram, texture: WebGLTexture) {
    this.canvas = canvas;
    this.gl = gl;
    this.program = program;
    this.texture = texture;
    this.locations = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      lenses: gl.getUniformLocation(program, "u_lenses"),
      count: gl.getUniformLocation(program, "u_count"),
    };

    const buffer = gl.createBuffer();
    const position = gl.getAttribLocation(program, "a_position");

    // One triangle that covers the screen, cheaper than a quad of two.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    if ("addEventListener" in canvas) {
      canvas.addEventListener("webglcontextlost", () => {
        this.isLost = true;
        this.setActive(false);
      });
    }

    this.setActive(false);
  }

  public get available(): boolean {
    return !this.isLost;
  }

  public static create(canvas: GlCanvas): LensingPresenter | null {
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, premultipliedAlpha: false, preserveDrawingBuffer: false });

    if (!gl || !("createShader" in gl)) {
      return null;
    }

    const program = createProgram(gl, VERTEX, FRAGMENT);
    const texture = gl.createTexture();

    return program && texture ? new LensingPresenter(canvas, gl, program, texture) : null;
  }

  // The lens runs at a lower resolution than a sharp 2D scene would need: light bent this hard is soft anyway,
  // and it keeps the fragment work and the upload small.
  public resize(width: number, height: number, pixelRatio: number): void {
    const ratio = Math.min(pixelRatio, 1.5);

    this.size = { width, height, pixelRatio: ratio };
    this.canvas.width = Math.max(1, Math.floor(width * ratio));
    this.canvas.height = Math.max(1, Math.floor(height * ratio));
  }

  // Draws `scene` bent round `lenses`, or hides itself when there are none.
  public present(scene: TexImageSource, lenses: readonly LensSource[]): void {
    if (this.isLost || lenses.length === 0) {
      this.setActive(false);

      return;
    }

    const { gl } = this;
    const { height, pixelRatio } = this.size;
    const count = Math.min(lenses.length, MAX_LENSES);

    // Uniforms in device pixels from the bottom left, which is where gl_FragCoord starts.
    for (let index = 0; index < count; index += 1) {
      const lens = lenses[index];

      this.lensData[index * 4] = lens.x * pixelRatio;
      this.lensData[index * 4 + 1] = (height - lens.y) * pixelRatio;
      this.lensData[index * 4 + 2] = lens.shadow * pixelRatio;
      this.lensData[index * 4 + 3] = lens.einstein * pixelRatio;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
    gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform4fv(this.locations.lenses, this.lensData);
    gl.uniform1i(this.locations.count, count);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.setActive(true);
  }

  private setActive(isActive: boolean): void {
    if (this.isActive === isActive) {
      return;
    }

    this.isActive = isActive;

    if ("style" in this.canvas) {
      this.canvas.style.visibility = isActive ? "visible" : "hidden";
    }
  }
}
