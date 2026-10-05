export interface Resume {
  title: string;
  description: string[];
  // One measured result, shown first. Only figures that can be backed.
  outcome?: string;
  // A company I founded, drawn on its own branch next to employment.
  isVenture?: boolean;
  bullets?: string[];
  techStack?: string[];
  from: string;
  to?: string;
}
