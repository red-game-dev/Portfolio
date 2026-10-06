// A square grid of pull requests. The count sets how many squares are drawn; it is never printed.
export interface CodeReviewGrid {
  label: string;
  count: number;
}

export interface CodeReviewHighlight {
  name: string;
  detail: string;
  quote?: string;
  points: string[];
  // Where to see it, for work in a repository that is not mine.
  link?: { label: string; url: string };
}

export interface GithubActivityYear {
  year: number;
  // One digit per day from 1 January, 0 for none up to 4 for the busiest days.
  levels: string;
}

export interface GithubActivity {
  account: string;
  asOf: string;
  years: GithubActivityYear[];
}

export interface CodeReviewContent {
  scope: string;
  // For screen readers, in place of the squares.
  squaresLabel: string;
  grids: CodeReviewGrid[];
  activityTitle: string;
  activityDescription: string;
  // "{year}" is replaced, for the screen reader text of each row.
  activityYearLabel: string;
  activity: GithubActivity;
  // Unlocked like game achievements once the chart has drawn. "{n}", "{month}" and "{year}" are replaced.
  achievements: {
    title: string;
    dayStreak: string;
    weekStreak: string;
    activeDays: string;
    perfectWeeks: string;
    busiestMonth: string;
    streakLegend: string;
    months: string[];
  };
  highlights: CodeReviewHighlight[];
}
