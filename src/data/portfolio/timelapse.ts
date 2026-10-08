import { PortfolioData } from "@/types/portfolio";

// The time-lapse of this site being built, commit by commit, from the history `npm run timelapse` writes. It sits
// with the code review for readers who like the numbers, closed until they open it.
export const timelapseContent: Pick<PortfolioData, "timelapse"> = {
  timelapse: {
    title: "Watch this site being built",
    description: [
      "Every commit since the first, replayed. Each building is a part of the codebase, as tall as its lines of code.",
      "The site started in 2022 and sat mostly still until 2026. The rebuild came after, with agents working under the rules, " +
        "checks and reviews described in How I use AI.",
    ],
    show: "Show the time-lapse",
    hide: "Hide the time-lapse",
    stats: {
      commits: "Commits",
      first: "First commit",
      lines: "Lines at the last commit",
      growth: "Growth since the rebuild began",
    },
    // The date growth is measured from, and how it reads: "{times}" is replaced with the multiple.
    growthSince: "2026-10-05",
    growth: "{times} times",
    districts: {
      components: "Components",
      packages: "Packages",
      content: "Content",
      tests: "Tests",
      services: "Services",
      types: "Types",
      config: "Config",
      hooks: "Hooks",
      pages: "Pages",
      styles: "Styles",
      agents: "Agent setup",
    },
    milestones: [
      { date: "2022-11-01", label: "First commit, on Next.js" },
      { date: "2022-11-18", label: "The original site takes shape" },
      { date: "2026-08-01", label: "Back for the Conrad role" },
      { date: "2026-10-05", label: "The rebuild with agents begins" },
      { date: "2026-10-06", label: "Blueprints in every zone, and three ways to read the site" },
      { date: "2026-10-07", label: "The live table, the GitHub run, the carousels" },
      { date: "2026-10-08", label: "The CV for AI roles, Ask Red and Beyond" },
    ],
    play: "Play",
    pause: "Pause",
    replay: "Replay",
    scrubLabel: "Move through the history",
    commit: "Commit {index} of {count}",
    lines: "{lines} lines",
    cityLabel: "The codebase on {date}: {lines} lines of code",
    loading: "Loading the history",
  },
};
