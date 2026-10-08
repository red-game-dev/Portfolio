import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { ALL_VENTURE_BLUEPRINTS, SECTION_BLUEPRINTS } from "@/data/blueprints/all";
import { portfolioData } from "@/data/resume";
import { PortfolioKnowledgeMapper } from "@/services/ask/knowledge";

import { findViolations, isContentFile, readDenylist } from "../../../scripts/agent/rules.mjs";

const root = process.cwd();
const denylist = readDenylist(root);

const filesUnder = (dir: string): string[] => readdirSync(join(root, dir)).flatMap((name) => {
  const path = join(dir, name);

  return statSync(join(root, path)).isDirectory() ? filesUnder(path) : [path];
});

// The copy rules the hooks warn about, enforced: what the site says, what the agent reads, and the docs agents
// work from. The em dash check on the data itself lives in portfolioData.test.ts.
describe("content rules", () => {
  test("no emoji and no private name anywhere the site or its agent says something", () => {
    const sources = {
      portfolio: JSON.stringify(portfolioData),
      blueprints: JSON.stringify([SECTION_BLUEPRINTS, ALL_VENTURE_BLUEPRINTS]),
      knowledge: new PortfolioKnowledgeMapper().map(portfolioData),
    };
    const broken = Object.entries(sources).flatMap(([name, text]) => findViolations(text, denylist)
      .filter((issue) => !issue.includes("em dash"))
      .map((issue) => `${name}: ${issue}`));

    expect(broken).toEqual([]);
  });

  test("the docs and agent instructions follow the same copy rules", () => {
    const docs = ["CLAUDE.md", "src/packages/README.md", ...filesUnder(".claude/skills"), ...filesUnder(".claude/commands")]
      .filter((path) => isContentFile(path, root));
    const broken = docs.flatMap((path) => findViolations(readFileSync(join(root, path), "utf8"), denylist).map((issue) => `${path}: ${issue}`));

    expect(broken).toEqual([]);
  });

  test("the platform Red works on now is counted in sessions, never users", () => {
    const current = portfolioData.experience.find((entry) => !entry.to && !entry.isVenture);
    const words = JSON.stringify([current?.outcome, current?.productOutcome, current?.description]);

    expect(current).toBeDefined();
    expect(words).not.toMatch(/\busers\b/i);
  });
});
