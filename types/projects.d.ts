export interface ProjectDetail {
  // False for catch all entries spanning many unrelated projects, which would inflate skill years.
  countsForSkills?: boolean;
  image: string;
  title: string;
  category: string;
  intro: string;
  responsibilities: string[];
  techStack: string[];
  link: string;
  from: string;
  to?: string;
}
