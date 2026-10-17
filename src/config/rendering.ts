// How the site draws what it can draw in 3D (the hands at the payments counter, and models to come): "auto" uses the
// GPU where the browser has one and falls back to the flat 2D drawing where it has not, "3d" uses only the GPU, and
// "2d" never loads the 3D code at all.
export type RenderingMode = "auto" | "3d" | "2d";

export const RENDERING: { mode: RenderingMode } = { mode: "auto" };
