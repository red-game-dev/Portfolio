import { expect, Page, test } from "@playwright/test";

import known from "./hud-known.json";

interface Box {
  area: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Screens from the smallest phone to a large desktop, upright and on their side, covering every layout the HUD has:
// narrow (under 340), upright phones (under 480), short and shortest upright (under 700 and 520 tall), short landscape
// (under 500 tall), tablets and desktops.
const SCREENS = [
  { name: "phone-narrow", width: 320, height: 568 },
  { name: "phone", width: 375, height: 667 },
  { name: "phone-tall", width: 390, height: 844 },
  { name: "phone-large", width: 430, height: 932 },
  { name: "phone-shortest", width: 375, height: 500 },
  { name: "phone-landscape", width: 667, height: 375 },
  { name: "phone-landscape-large", width: 932, height: 430 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1920, height: 1080 },
];

const MOMENTS = ["flight", "descent"] as const;
const LAYOUTS = ["full", "compact"] as const;

// Room a box may share with another, or reach past the screen's edge, for rounding (px).
const SLACK = 1;

// The radar is drawn on the canvas, not a panel, so its box comes from the same rules as MapLayer's: a circle in the
// bottom left corner 14px in, smaller on smaller screens. It is not drawn while a world's card shows.
const radarOf = (width: number, height: number): Box => {
  const radius = height < 360 || width < 300 || (height <= 520 && height > width) ? 38 : width < 640 || height < 420 ? 44 : 58;

  return { area: "radar", left: 14, top: height - 14 - radius * 2, right: 14 + radius * 2, bottom: height - 14 };
};

// Every HUD panel on screen, by its area: each element marked data-hud-area that takes up room, and the place's own box
// (the line the voyage says may cover it, as it covers the readout, for its moment).
const measure = (page: Page) => page.evaluate(() => {
  const boxOf = (element: Element) => {
    const { left, top, right, bottom } = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return right - left > 0 && bottom - top > 0 && style.visibility !== "hidden" && style.display !== "none" ? { left, top, right, bottom } : null;
  };
  const boxes = [...document.querySelectorAll<HTMLElement>("[data-hud-area]")].flatMap((element) => {
    const box = boxOf(element);

    return box ? [{ area: element.dataset.hudArea ?? "", ...box }] : [];
  });
  const place = document.querySelector("[data-hud-place]");

  return { boxes, place: place ? boxOf(place) : null };
});

const overlap = (one: Box, two: Box) =>
  Math.min(one.right, two.right) - Math.max(one.left, two.left) > SLACK && Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top) > SLACK;

const within = (inner: Omit<Box, "area">, outer: Omit<Box, "area">) =>
  inner.left >= outer.left - SLACK && inner.top >= outer.top - SLACK && inner.right <= outer.right + SLACK && inner.bottom <= outer.bottom + SLACK;

// The overlaps the HUD is known to have today, by screen, moment and layout, kept so the check guards against new ones;
// the grid rebuild clears this list.
const KNOWN = known as Record<string, string[]>;

for (const screen of SCREENS) {
  for (const moment of MOMENTS) {
    for (const layout of LAYOUTS) {
      const name = `${screen.name} ${moment} ${layout}`;

      test(`the HUD's panels never overlap or leave the screen: ${name}`, async ({ page }) => {
        await page.setViewportSize({ width: screen.width, height: screen.height });
        await page.goto(`/hud-lab/?moment=${moment}&hud=${layout}`);
        await page.locator("[data-hud-area='bar']").waitFor();
        await page.locator("[data-hud-area='message']").waitFor();
        // The line the voyage says settles in from its entrance before it is measured.
        await page.waitForTimeout(800);

        const { boxes, place } = await measure(page);
        const all: Box[] = moment === "flight" ? [...boxes, radarOf(screen.width, screen.height)] : boxes;
        const found: string[] = [];

        all.forEach((box, index) => {
          if (!within(box, { left: 0, top: 0, right: screen.width, bottom: screen.height })) {
            found.push(`${box.area}|screen`);
          }

          all.slice(index + 1).forEach((other) => {
            const pair = [box.area, other.area].sort();
            const shared = {
              left: Math.max(box.left, other.left),
              top: Math.max(box.top, other.top),
              right: Math.min(box.right, other.right),
              bottom: Math.min(box.bottom, other.bottom),
            };
            // The line may cover the readout, and the place at the top of the column, for its moment, as designed.
            const isDesigned = pair.join("|") === "message|readout" || (pair.join("|") === "message|vitals" && place !== null && within(shared, place));

            if (overlap(box, other) && !isDesigned) {
              found.push(pair.join("|"));
            }
          });
        });

        const unexpected = found.filter((pair) => !(KNOWN[name] ?? []).includes(pair));

        expect(unexpected, `panels overlapping on ${name}: ${JSON.stringify(all)}`).toEqual([]);
      });
    }
  }
}
