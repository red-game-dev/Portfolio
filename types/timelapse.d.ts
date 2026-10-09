// A moment in the repository's history worth naming, placed on the first commit on or after its date.
export interface TimelapseMilestone {
  date: string;
  label: string;
}

// The time-lapse of this site's codebase growing, its own section after the finale; its intro is in the sections.
export interface TimelapseContent {
  show: string;
  hide: string;
  // The facts shown above the city, for readers who want the numbers.
  stats: {
    commits: string;
    first: string;
    lines: string;
    growth: string;
  };
  growthSince: string;
  // "{times}" is replaced.
  growth: string;
  // One label per district in the generated history, by its id; a test checks none is missing.
  districts: Record<string, string>;
  milestones: TimelapseMilestone[];
  play: string;
  pause: string;
  replay: string;
  scrubLabel: string;
  // "{index}" and "{count}" are replaced.
  commit: string;
  // "{lines}" is replaced.
  lines: string;
  // "{date}" and "{lines}" are replaced; what a screen reader hears for the city.
  cityLabel: string;
  loading: string;
}
