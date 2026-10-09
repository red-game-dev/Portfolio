const compile = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);

    return null;
  }

  return shader;
};

// A linked program from two shader sources, or null when the device cannot build it: callers fall back to
// drawing without it rather than failing.
export const createProgram = (gl: WebGLRenderingContext, vertex: string, fragment: string): WebGLProgram | null => {
  const vertexShader = compile(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = vertexShader && fragmentShader ? gl.createProgram() : null;

  if (!program || !vertexShader || !fragmentShader) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
};
