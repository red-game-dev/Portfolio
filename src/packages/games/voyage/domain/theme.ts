// How a universe looks and what drifts through it; the renderer draws each its own way. The first five are the
// site's zones; the rest are what lies past them.
export type VoyageStyle = "matrix" | "neural" | "blocks" | "chips" | "pixels" | "nebula" | "void" | "crystal" | "ember" | "abyss";

export const DEEP_STYLES: readonly VoyageStyle[] = ["nebula", "void", "crystal", "ember", "abyss"];
