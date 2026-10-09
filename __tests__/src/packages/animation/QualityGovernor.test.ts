import { QualityGovernor } from "@/packages/animation/frame-loop";

// Feeds frames of one length for a while; returns every level change along the way.
const run = (governor: QualityGovernor, frameMs: number, forMs: number, from = 0) => {
  const changes: number[] = [];

  for (let now = from; now < from + forMs; now += frameMs) {
    const level = governor.sample(frameMs, now);

    if (level !== null) {
      changes.push(level);
    }
  }

  return changes;
};

describe("QualityGovernor", () => {
  test("steps down a level each window that runs slow, never past the coarsest", () => {
    const governor = new QualityGovernor({ levels: 3, windowMs: 1000 });

    expect(run(governor, 40, 5000)).toEqual([1, 2]);
    expect(governor.level).toBe(2);
  });

  test("holds steady on a device that keeps up, and ignores pauses", () => {
    const governor = new QualityGovernor({ levels: 4 });

    expect(run(governor, 16.7, 10000)).toEqual([]);
    expect(governor.sample(2000, 12000)).toBeNull();
    expect(governor.level).toBe(0);
  });

  test("steps back up only after frames stay fast for a while, and only so many times", () => {
    const governor = new QualityGovernor({ levels: 4, start: 2, windowMs: 1000, recoverAfterMs: 4000, maxRecoveries: 1 });

    expect(run(governor, 8, 3000)).toEqual([]);
    expect(run(governor, 8, 4000, 3000)).toEqual([1]);
    expect(run(governor, 8, 20000, 7000)).toEqual([]);
    expect(governor.level).toBe(1);
  });
});
