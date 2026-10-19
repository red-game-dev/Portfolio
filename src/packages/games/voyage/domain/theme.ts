// How a universe looks and what drifts through it; the renderer draws each its own way. The first six are the
// site's zones (racks the DevOps data centre); the rest are what lies past them.
export type VoyageStyle = "matrix" | "neural" | "blocks" | "racks" | "chips" | "pixels" | "nebula" | "void" | "crystal" | "ember" | "abyss";

export const DEEP_STYLES: readonly VoyageStyle[] = ["nebula", "void", "crystal", "ember", "abyss"];
