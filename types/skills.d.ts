export interface Skill {
  name: string;
  score: number;
}

// Listed, not scored: a named area with the tools and practices inside it.
export interface SkillArea {
  label: string;
  items: string[];
}
