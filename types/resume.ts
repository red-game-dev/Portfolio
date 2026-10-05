export interface Resume {
  title: string;
  description: string[];
  // One measured result, shown first. Only figures that can be backed.
  outcome?: string;
  // A company I founded, drawn on its own branch next to employment.
  isVenture?: boolean;
  bullets?: string[];
  techStack?: string[];
  // false keeps an entry out of the skill forge's years, for open ended or self paced study.
  countsForSkills?: boolean;
  from: string;
  to?: string;
}
