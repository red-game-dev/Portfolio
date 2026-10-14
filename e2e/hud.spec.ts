import { expect, Page, test } from "@playwright/test";

import known from "./hud-known.json";

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// A panel as measured: its area, and every part of it that paints.
interface Area {
  area: string;
  rects: Rect[];
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

// Room two parts may share, or a part may reach past the screen's edge, for rounding (px).
const SLACK = 1;
// How long the lab has to show its HUD before a case gives up (ms).
const SHOWN_MS = 15_000;

// Where the line the voyage says becomes a strip across the top, drawn over the place and the readout for its moment
// as designed: the same query as STRIP in Finale/Voyage/VoyageDialog.styles.ts.
const STRIP = "(max-width: 767px) and (max-height: 720px), (orientation: portrait) and (max-width: 479px), (orientation: landscape) and (max-height: 500px)";

// The radar is drawn on the canvas, not a panel, so its box comes from the same rules as MapLayer's: a circle in the
// bottom left corner 14px in, smaller on smaller screens. It is not drawn while a world's card shows.
const radarOf = (width: number, height: number): Area => {
  const radius = height < 360 || width < 300 || (height <= 520 && height > width) ? 38 : width < 640 || height < 420 ? 44 : 58;

  return { area: "radar", rects: [{ left: 14, top: height - 14 - radius * 2, right: 14 + radius * 2, bottom: height - 14 }] };
};

// Every HUD panel on screen by its area, as the parts it paints (its text, and everything inside with a background, a
// border or an image), each cut to whatever clips it inside the panel: a container stretched wider than what it holds,
// or a name cut short with an ellipsis, is measured by what shows. And whether the strip is in force.
const measure = (page: Page, strip: string) => page.evaluate((query) => {
  interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }

  const isShown = (element: Element) => {
    const style = getComputedStyle(element);

    return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
  };
  const isPainted = (element: Element) => {
    const style = getComputedStyle(element);
    const hasBackground = style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
    const hasBorder = ["top", "right", "bottom", "left"].some((side) => parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0);

    return hasBackground || hasBorder || style.backgroundImage !== "none" || ["IMG", "CANVAS", "svg"].includes(element.tagName);
  };
  const cut = (box: Box, clip: Box): Box | null => {
    const left = Math.max(box.left, clip.left);
    const top = Math.max(box.top, clip.top);
    const right = Math.min(box.right, clip.right);
    const bottom = Math.min(box.bottom, clip.bottom);

    return right - left > 0 && bottom - top > 0 ? { left, top, right, bottom } : null;
  };
  // The room an element shows its content in, where it hides what overflows: inside its borders.
  const clipOf = (element: Element): Box | null => {
    const style = getComputedStyle(element);

    if (style.overflowX === "visible" && style.overflowY === "visible") {
      return null;
    }

    const box = element.getBoundingClientRect();
    const left = box.left + element.clientLeft;
    const top = box.top + element.clientTop;

    return { left, top, right: left + element.clientWidth, bottom: top + element.clientHeight };
  };
  const textRects = (element: Element): Box[] => [...element.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "")
    .flatMap((node) => {
      const range = document.createRange();

      range.selectNodeContents(node);

      return [...range.getClientRects()];
    });
  // What an element and everything inside it paints, each part cut to every clip on the way down from the panel.
  const painted = (element: Element, clips: Box[]): Box[] => {
    if (!isShown(element)) {
      return [];
    }

    const clip = clipOf(element);
    const inner = clip ? [...clips, clip] : clips;
    const cutTo = (within: Box[]) => (box: Box) => within.reduce<Box | null>((left, each) => (left ? cut(left, each) : null), box);
    // Its own background is cut only by what clips it from outside; its text, like its children, by its own clip too.
    const background = isPainted(element) ? [cutTo(clips)(element.getBoundingClientRect())] : [];

    return [...background, ...textRects(element).map(cutTo(inner)), ...[...element.children].flatMap((child) => painted(child, inner))]
      .filter((box): box is Box => box !== null && box.right - box.left > 0 && box.bottom - box.top > 0);
  };
  const areas = [...document.querySelectorAll<HTMLElement>("[data-hud-area]")]
    .map((element) => ({ area: element.dataset.hudArea ?? "", rects: painted(element, []) }))
    .filter(({ rects }) => rects.length > 0);

  return { areas, isStrip: window.matchMedia(query).matches };
}, strip);

const overlap = (one: Rect, two: Rect) =>
  Math.min(one.right, two.right) - Math.max(one.left, two.left) > SLACK && Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top) > SLACK;

const within = (inner: Rect, outer: Rect) =>
  inner.left >= outer.left - SLACK && inner.top >= outer.top - SLACK && inner.right <= outer.right + SLACK && inner.bottom <= outer.bottom + SLACK;

// Overlaps the HUD is known to have, by screen, moment and layout, as CI's Linux browser measures them: none since the
// grid, and a new one is to be fixed rather than listed. An entry that no longer happens fails there too, so the list
// only ever shrinks (elsewhere, where fonts render a pixel apart, it is only noted).
const KNOWN = known as Record<string, string[]>;

for (const screen of SCREENS) {
  for (const moment of MOMENTS) {
    for (const layout of LAYOUTS) {
      const name = `${screen.name} ${moment} ${layout}`;

      test(`the HUD's panels never overlap or leave the screen: ${name}`, async ({ page }) => {
        await page.setViewportSize({ width: screen.width, height: screen.height });
        await page.goto(`/hud-lab/?moment=${moment}&hud=${layout}`, { waitUntil: "domcontentloaded" });
        await page.locator("[data-hud-area='bar']").waitFor({ timeout: SHOWN_MS });
        await page.locator("[data-hud-area='message']").waitFor({ timeout: SHOWN_MS });
        // Measured in the site's own font once it has loaded, and once the line has settled in from its entrance.
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        await page.waitForTimeout(800);

        const { areas, isStrip } = await measure(page, STRIP);
        const all = moment === "flight" ? [...areas, radarOf(screen.width, screen.height)] : areas;
        const found = new Set<string>();
        const screenBox = { left: 0, top: 0, right: screen.width, bottom: screen.height };

        expect(all.map(({ area }) => area), "the line is still showing when measured").toContain("message");

        all.forEach((one, index) => {
          if (one.rects.some((rect) => !within(rect, screenBox))) {
            found.add(`${one.area}|screen`);
          }

          all.slice(index + 1).forEach((other) => {
            const pair = [one.area, other.area].sort().join("|");

            one.rects.forEach((rect) => other.rects.forEach((otherRect) => {
              if (!overlap(rect, otherRect)) {
                return;
              }

              // On a phone the line is a strip that covers the readout and the place for its moment, as designed.
              const isDesigned = isStrip && (pair === "message|readout" || pair === "message|place");

              if (!isDesigned) {
                found.add(pair);
              }
            }));
          });
        });

        const expected = KNOWN[name] ?? [];
        const unexpected = [...found].filter((pair) => !expected.includes(pair));
        const gone = expected.filter((pair) => !found.has(pair));

        expect(unexpected, `panels overlapping on ${name}: ${JSON.stringify(all)}`).toEqual([]);

        if (process.env.CI) {
          expect(gone, `no longer overlapping on ${name}: take them out of e2e/hud-known.json`).toEqual([]);
        } else if (gone.length > 0) {
          test.info().annotations.push({ type: "no longer overlapping", description: gone.join(", ") });
        }
      });
    }
  }
}
