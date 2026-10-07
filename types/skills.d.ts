// The groups the skills are listed in; each is a list of names. Years come from the forge, which reads
// them off the work itself, never from a self score.
export type SkillGroup = "design" | "language" | "programming" | "frontend" | "backend" | "mobile" | "blockchain" | "cloud" | "cms"
  | "tools" | "testing" | "integrations" | "observability" | "ai" | "expertise" | "teamplayer";

export type SkillLists = Record<SkillGroup, string[]>;

// Listed, not scored: a named area with the tools and practices inside it.
export interface SkillArea {
  label: string;
  items: string[];
}
