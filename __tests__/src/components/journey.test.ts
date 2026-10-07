import { readJourney } from "@/components/Journey/hooks/useJourney";
import { ZONE_BOUNDARIES } from "@/config/zones";
import { FrameRect } from "@/packages/interaction/scroll-frame";

const reading = (tops: Record<string, number>, scrollY: number) => ({
  viewportHeight: 1000,
  scrollY,
  scrollHeight: 11000,
  rectOf: (id: string): FrameRect | null => (id in tops ? { top: tops[id], bottom: tops[id] + 500, height: 500 } : null),
});

describe("readJourney", () => {
  const ids = ZONE_BOUNDARIES.map(({ startsAt }) => startsAt);

  it("is in the last zone whose start has passed the middle of the screen", () => {
    const tops = Object.fromEntries(ids.map((id, index) => [id, index * 2000 - 3000]));
    const journey = readJourney(reading(tops, 3000));

    // Starts at -3000, -1000, 1000, ...: the second has passed the middle (500), the third has not.
    expect(journey.zoneIndex).toBe(1);
    expect(journey.zone).toBe(ZONE_BOUNDARIES[1].zone);
  });

  it("measures progress against the scrollable height and places each zone's start", () => {
    const journey = readJourney(reading({ [ids[1]]: 2000 }, 5000));

    expect(journey.progress).toBe(0.5);
    expect(journey.starts[1]).toBeCloseTo(0.7);
    // A zone not on the page sits at the start, never NaN.
    expect(journey.starts[2]).toBe(0);
  });

  it("stays in the first zone at the top and clamps progress", () => {
    const journey = readJourney({ ...reading({}, -50), scrollHeight: 500 });

    expect(journey.zoneIndex).toBe(0);
    expect(journey.progress).toBe(0);
  });
});
