// The groups the skills are listed in; each is a list of names. Years come from the forge, which reads
// them off the work itself, never from a self score.
export type SkillGroup = "design" | "language" | "programming" | "frontend" | "backend" | "mobile" | "blockchain" | "cloud" | "cms"
  | "tools" | "testing" | "integrations" | "observability" | "ai" | "expertise" | "teamplayer";

export type SkillLists = Record<SkillGroup, string[]>;

// Listed, not scored: a named area with the tools and practices inside it.
// The universe on the site's journey an area belongs to, which its skills switch in the way of: the payments counter,
// the chain, the casino, the game world, AI, the engineering terminal, or beyond.
export type SkillAreaUniverse = "payments" | "chain" | "casino" | "mmo" | "ai" | "matrix" | "beyond";

export interface SkillArea {
  label: string;
  universe: SkillAreaUniverse;
  items: string[];
}

// The drawings under the areas: several of them at work together in one platform.
export interface SkillAreaExamples {
  title: string;
  description: string;
}
