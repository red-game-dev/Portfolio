/**
 * @jest-environment node
 */
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";

import { BACKDROP_THEME } from "@/config/theme";
import { portfolioData } from "@/data/resume";
import { SHARE_CARD_DESIGN, shareCardOf, shareCardVersion } from "@/services/seo/shareCard";
import { renderShareImage, SHARE_IMAGE } from "@/services/seo/shareImage";

describe("the share picture drawn from the content", () => {
  const card = shareCardOf(portfolioData);

  test("it says the name, the role, three figures and every zone of the journey", () => {
    expect(card.name).toBe(portfolioData.details.name);
    expect(card.figures.map(({ id }) => id)).toEqual(["industry", "reach", "startups"]);
    expect(card.zones.map(({ id }) => id)).toEqual(["matrix", "ai", "chain", "devops", "casino", "mmo", "beyond"]);
    expect(card.domain).toBe("redgame.dev");
  });

  // What draws the picture. Change any of it and the picture changes under the same address, which platforms keep for
  // days: so bump SHARE_CARD_DESIGN in services/seo/shareCard.ts and record the new hash here beside it.
  const DESIGNS: Readonly<Record<number, string>> = {
    1: "900c7f730eb04c7a",
  };

  test("its drawing is versioned: a change to what draws it bumps the design number", () => {
    const hash = createHash("sha256");

    ["src/services/seo/shareImage.tsx", ...[400, 500, 700].map((weight) => `src/assets/fonts/roboto/roboto-${weight}.ttf`)]
      .forEach((file) => hash.update(new Uint8Array(readFileSync(file))));
    hash.update(JSON.stringify(BACKDROP_THEME.stars));

    expect(DESIGNS[SHARE_CARD_DESIGN]).toBe(hash.digest("hex").slice(0, 16));
  });

  test("its version changes only when what it says changes", () => {
    expect(shareCardVersion(card)).toBe(shareCardVersion(shareCardOf(portfolioData)));
    expect(shareCardVersion({ ...card, role: `${card.role}!` })).not.toBe(shareCardVersion(card));
  });

  // next/og loads its renderer with a dynamic import, which Jest runs only with Node's VM modules: so this draws the picture
  // only when asked (SHARE_IMAGE_OUT=card.png NODE_OPTIONS=--experimental-vm-modules), and every preview's is fetched by
  // the share card workflow instead.
  const draws = process.env.SHARE_IMAGE_OUT ? test : test.skip;

  draws("it draws a 1200 by 630 PNG", async () => {
    const png = await renderShareImage(card);

    // The PNG signature, then the header's width and height.
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(SHARE_IMAGE.width);
    expect(png.readUInt32BE(20)).toBe(SHARE_IMAGE.height);

    writeFileSync(process.env.SHARE_IMAGE_OUT ?? "card.png", new Uint8Array(png));
  }, 30000);
});
