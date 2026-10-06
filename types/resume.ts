import { Industry } from "@/types/industry";

export interface Resume {
  title: string;
  description: string[];
  // One measured result, shown first. Only figures that can be backed.
  outcome?: string;
  // What the role meant as a product, for product readers. Backed facts only, like the outcome.
  productOutcome?: string;
  // A company I founded, drawn on its own branch next to employment.
  isVenture?: boolean;
  // For a venture, the seats I held, which the job title alone may not say.
  ventureRole?: string;
  bullets?: string[];
  techStack?: string[];
  // Sectors this role worked in, for the industry filter.
  industries?: Industry[];
  // false keeps an entry out of the skill forge's years, for open ended or self paced study.
  countsForSkills?: boolean;
  from: string;
  to?: string;
}
