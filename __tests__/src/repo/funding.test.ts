import { readFileSync } from "fs";
import { join } from "path";

import { portfolioData } from "@/data/resume";

// Where each platform GitHub's Sponsor button knows keeps a supporter's page, from the name FUNDING.yml gives.
const PAGES: Record<string, (name: string) => string> = {
  patreon: (name) => `https://www.patreon.com/${name}`,
  ko_fi: (name) => `https://ko-fi.com/${name}`,
  buy_me_a_coffee: (name) => `https://buymeacoffee.com/${name}`,
  github: (name) => `https://github.com/sponsors/${name}`,
};

describe("support for the site", () => {
  test("the time-lapse's support link, once set, is one of the pages the repo's Sponsor button offers", () => {
    const pages = readFileSync(join(__dirname, "../../../.github/FUNDING.yml"), "utf8").split("\n")
      .map((line) => line.replace(/#.*/, "").trim())
      .filter(Boolean)
      .flatMap((line) => {
        const [platform, value] = line.split(":").map((part) => part.trim());

        return value && PAGES[platform] ? [PAGES[platform](value.replace(/[[\]"']/g, ""))] : [];
      });

    const { url } = portfolioData.timelapse.support;

    expect(pages).toContain("https://github.com/sponsors/red-game-dev");

    if (url) {
      expect(pages).toContain(url);
    }
  });
});
