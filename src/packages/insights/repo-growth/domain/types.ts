// A repository's size after each commit, as lines per district: one district per part of the codebase.
export interface GrowthFrame {
  date: string;
  lines: number[];
}

export interface RepoGrowth {
  districts: string[];
  frames: GrowthFrame[];
}

// Ready to draw: each frame's districts as a share of the tallest district ever, so heights compare across
// time, plus the total lines at that commit.
export interface GrowthViewFrame {
  date: string;
  heights: number[];
  total: number;
}

export interface RepoGrowthView {
  districts: string[];
  frames: GrowthViewFrame[];
  // The tallest any district grew, in lines.
  peak: number;
}
