import { toMonthIndex } from "@/packages/insights/career";
import { sumBy } from "@/packages/math/stats";
import { Industry } from "@/types/industry";
import { Resume } from "@/types/resume";

export type Lane = "main" | "venture";

// One branch of the history: the work I was hired for, or the companies I founded.
export interface Branch {
  lane: Lane;
  // Newest first.
  entries: Resume[];
  // How many the tab counts, which for ventures includes the ones not listed one by one.
  count: number;
  // Ventures counted but not listed, shown as the branch's last commit.
  unlisted: number;
}

export const byStartDescending = (entries: Resume[]) => [...entries].sort((first, second) => toMonthIndex(second.from) - toMonthIndex(first.from));

// The work branch and the founded branch, each newest first. `foundedTotal` is every venture, listed or not.
export const splitBranches = (experience: Resume[], foundedTotal: number): Branch[] => {
  const sorted = byStartDescending(experience);
  const work = sorted.filter((entry) => !entry.isVenture);
  const founded = sorted.filter((entry) => entry.isVenture);

  return [
    { lane: "main", entries: work, count: work.length, unlisted: 0 },
    { lane: "venture", entries: founded, count: Math.max(foundedTotal, founded.length), unlisted: Math.max(0, foundedTotal - founded.length) },
  ];
};

const isIn = (industry: Industry) => (entry: Resume) => entry.industries?.includes(industry) ?? false;

// What each branch's tab counts: its entries in the industry, or all of them with no industry picked.
export const matchesPerBranch = (branches: Branch[], industry: Industry | null) => branches
  .map((branch) => (industry ? branch.entries.filter(isIn(industry)).length : branch.count));

// Entries in the industry across every branch.
export const industryMatches = (branches: Branch[], industry: Industry | null) => (industry
  ? sumBy(branches, (branch) => branch.entries.filter(isIn(industry)).length)
  : 0);

// An industry with nothing on the open branch checks out the first branch that has it; otherwise stay.
export const branchToCheckout = (matches: number[], active: number): number | null => {
  if (matches[active] > 0) {
    return null;
  }

  const target = matches.findIndex((count) => count > 0);

  return target >= 0 ? target : null;
};
