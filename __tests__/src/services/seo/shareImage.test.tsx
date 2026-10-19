/**
 * @jest-environment node
 */
import { writeFileSync } from "fs";

import { portfolioData } from "@/data/resume";
import { shareCardOf, shareCardVersion } from "@/services/seo/shareCard";
import { renderShareImage, SHARE_IMAGE } from "@/services/seo/shareImage";

describe("the share picture drawn from the content", () => {
  const card = shareCardOf(portfolioData);

  test("it says the name, the role, three figures and every zone of the journey", () => {
    expect(card.name).toBe(portfolioData.details.name);
    expect(card.figures.map(({ id }) => id)).toEqual(["industry", "reach", "startups"]);
    expect(card.zones.map(({ id }) => id)).toEqual(["matrix", "ai", "chain", "devops", "casino", "mmo", "beyond"]);
    expect(card.domain).toBe("redgame.dev");
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
