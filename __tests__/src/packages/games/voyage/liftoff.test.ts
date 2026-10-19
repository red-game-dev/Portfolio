import { climbDirection } from "@/packages/games/voyage/systems/liftoff";
import { angleBetween } from "@/packages/math/angles";

// A world of radius 1 at the origin, the ship on its top (screen up is negative y), and whatever else is near.
const GROUND = { id: "ground", x: 0, y: 0, radius: 1 };
const AT = { x: 0, y: -1.05 };
const UP = -Math.PI / 2;
const bodiesWith = (others: Array<{ id: string; x: number; y: number; radius: number }>) => [GROUND, ...others];
const offUp = (direction: { x: number; y: number }) => Math.abs(angleBetween(UP, Math.atan2(direction.y, direction.x)));

describe("the way a lift off climbs", () => {
  it("goes straight up with nothing close overhead", () => {
    expect(offUp(climbDirection(bodiesWith([{ id: "far", x: 0, y: -20, radius: 1 }]), GROUND, AT))).toBeCloseTo(0);
  });

  it("tips aside from a world close by and nearly overhead", () => {
    expect(offUp(climbDirection(bodiesWith([{ id: "moon", x: 0, y: -2.5, radius: 0.3 }]), GROUND, AT))).toBeCloseTo(Math.PI / 3);
  });

  it("never turns into the ground, however many close worlds tip it", () => {
    const up = Math.atan2(-2.5, 0);
    const beside = up + (40 * Math.PI) / 180;
    const others = [
      { id: "a", x: 0, y: -2.5, radius: 0.3 },
      { id: "b", x: Math.cos(beside) * 1.5, y: AT.y + Math.sin(beside) * 1.5, radius: 0.3 },
      { id: "c", x: Math.cos(beside + 0.6) * 1.5, y: AT.y + Math.sin(beside + 0.6) * 1.5, radius: 0.3 },
    ];

    expect(offUp(climbDirection(bodiesWith(others), GROUND, AT))).toBeLessThanOrEqual(Math.PI / 3 + 1e-9);
  });
});
