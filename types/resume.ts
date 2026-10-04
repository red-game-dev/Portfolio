export interface Resume {
  title: string;
  description: string[];
  // One measured result, shown first. Only figures that can be backed.
  outcome?: string;
  bullets?: string[];
  techStack?: string[];
  from: string;
  to?: string;
}
