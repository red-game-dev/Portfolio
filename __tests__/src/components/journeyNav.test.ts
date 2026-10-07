import { NAV_ITEMS } from "@/components/Menu/config";
import { journeyState, sameSelection } from "@/components/Menu/utils/journeyState";
import { ZONE_BOUNDARIES } from "@/config/zones";
import { portfolioData } from "@/data/resume";
import { createJourneyTrail } from "@/services/journey/trail";

describe("journey navigation", () => {
  test("a stop is selected while any part of it is on screen, including a section at the very top", () => {
    const { selected } = journeyState([{ top: 0, bottom: 400 }, { top: 900, bottom: 1500 }, { top: -800, bottom: 1 }, null], 900);

    expect(selected).toEqual([true, false, true, false]);
  });

  test("progress is how far the middle of the screen is through the stop, clamped", () => {
    const { progress } = journeyState([{ top: 450, bottom: 1450 }, { top: -550, bottom: 450 }, { top: 2000, bottom: 3000 }, { top: -5000, bottom: -100 }], 900);

    expect(progress).toEqual([0, 1, 0, 1]);
    expect(journeyState([{ top: -50, bottom: 950 }], 900).progress[0]).toBeCloseTo(0.5);
  });

  test("a zero height stop never divides by zero", () => {
    expect(journeyState([{ top: 100, bottom: 100 }], 900).progress[0]).toBe(1);
  });

  test("selections compare by value, so an unchanged scroll does not re-render", () => {
    expect(sameSelection([true, false], [true, false])).toBe(true);
    expect(sameSelection([true, false], [false, false])).toBe(false);
    expect(sameSelection([true], [true, false])).toBe(false);
  });

  test("the stops cover the page in order, end to end, and the zones start at sections on the trail", () => {
    const trail = createJourneyTrail(portfolioData).map((section) => section.id);
    const indexOf = (id: string) => trail.indexOf(id);
    const firstOf = (first: string | string[]) => (Array.isArray(first) ? first : [first]).map(indexOf).filter((index) => index >= 0)[0];

    NAV_ITEMS.forEach((item, position) => {
      const start = firstOf(item.first);
      const end = indexOf(item.last);

      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeGreaterThanOrEqual(start);

      if (position > 0) {
        // Each stop starts right after the previous one ends, so no section is left unlit.
        expect(start).toBe(indexOf(NAV_ITEMS[position - 1].last) + 1);
      }
    });

    const zoneStarts = ZONE_BOUNDARIES.slice(1).map((boundary) => indexOf(boundary.startsAt));

    expect(zoneStarts.every((index) => index > 0)).toBe(true);
    expect([...zoneStarts].sort((first, second) => first - second)).toEqual(zoneStarts);
  });
});
