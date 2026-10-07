import { branchToCheckout, byStartDescending, industryMatches, matchesPerBranch, splitBranches } from "@/components/History/branches";
import { Resume } from "@/types/resume";

const entry = (title: string, from: string, extra: Partial<Resume> = {}) => ({ title, from, ...extra }) as Resume;

const EXPERIENCE = [
  entry("Old job", "Jan 2015", { industries: ["fintech"] }),
  entry("Startup", "Mar 2018", { isVenture: true, industries: ["igaming"] }),
  entry("New job", "Jun 2021", { industries: ["fintech", "web3"] }),
  entry("Other startup", "Feb 2016", { isVenture: true }),
];

describe("history branches", () => {
  const [work, founded] = splitBranches(EXPERIENCE, 5);

  it("sorts newest first", () => {
    expect(byStartDescending(EXPERIENCE).map((item) => item.title)).toEqual(["New job", "Startup", "Other startup", "Old job"]);
  });

  it("splits hired work from ventures and counts the ventures not listed", () => {
    expect(work.entries.map((item) => item.title)).toEqual(["New job", "Old job"]);
    expect(founded.entries.map((item) => item.title)).toEqual(["Startup", "Other startup"]);
    expect([work.count, founded.count, founded.unlisted]).toEqual([2, 5, 3]);
  });

  it("never counts fewer ventures than are listed", () => {
    const [, listed] = splitBranches(EXPERIENCE, 1);

    expect([listed.count, listed.unlisted]).toEqual([2, 0]);
  });

  it("counts each branch's entries in an industry, or everything without one", () => {
    expect(matchesPerBranch([work, founded], null)).toEqual([2, 5]);
    expect(matchesPerBranch([work, founded], "fintech")).toEqual([2, 0]);
    expect(industryMatches([work, founded], "igaming")).toBe(1);
    expect(industryMatches([work, founded], null)).toBe(0);
  });

  it("checks out the branch that has the industry only when the open one has none", () => {
    expect(branchToCheckout([0, 1], 0)).toBe(1);
    expect(branchToCheckout([2, 0], 0)).toBeNull();
    expect(branchToCheckout([0, 0], 1)).toBeNull();
  });
});
