import { authoriseAt, routeAt, SPLIT_SHARES, splitAt, STORY_AT, syncAt } from "@/packages/graphics/payment-stories";
import type { StoryFrame } from "@/packages/graphics/payment-stories";

const times = Array.from({ length: 201 }, (_, step) => step / 200);
const nodeOf = (frame: StoryFrame, id: string) => frame.nodes.find((node) => node.id === id);

describe("the payments drawings' opening stories", () => {
  it("draw every frame of every story with real numbers", () => {
    Object.values(STORY_AT).forEach((tell) => times.forEach((t) => {
      const frame = tell(t);
      const numbers = [
        ...frame.nodes.flatMap((node) => [node.at.x, node.at.y, node.glow, node.shake]),
        ...frame.wires.map((wire) => wire.lit),
        ...frame.packets.map((packet) => packet.at),
        ...frame.coins.flatMap((coin) => [coin.at.x, coin.at.y, coin.radius]),
        ...frame.receipts.flatMap((receipt) => [receipt.at.x, receipt.at.y, receipt.opacity]),
      ];

      expect(numbers.every(Number.isFinite)).toBe(true);
    }));
  });

  it("tell each story inside the panel's showing (0.06 to 0.84): moving in the middle, still and decided by its end", () => {
    Object.values(STORY_AT).forEach((tell) => {
      expect(tell(0.84).packets).toHaveLength(0);
      expect(tell(0.84).coins).toHaveLength(0);
      expect(tell(0.84).receipts).toHaveLength(0);
      expect(tell(0.84).nodes.some((node) => node.tone === "approved")).toBe(true);
    });
  });

  it("routes past a provider that errors to one that approves, and back", () => {
    expect(routeAt(0.15).packets[0].tone).toBe("lit");
    expect(nodeOf(routeAt(0.3), "first")?.tone).toBe("failed");
    expect(nodeOf(routeAt(0.3), "first")?.mark?.kind).toBe("cross");
    expect(routeAt(0.4).packets[0]).toMatchObject({ tone: "failed", heading: -1 });
    expect(nodeOf(routeAt(0.5), "second")?.tone).not.toBe("approved");
    expect(nodeOf(routeAt(0.7), "second")?.tone).toBe("approved");
    expect(nodeOf(routeAt(0.84), "third")?.tone).toBe("idle");
  });

  it("takes the authorisation stop by stop to the issuer and its answer back to the terminal", () => {
    const xs = [0.1, 0.2, 0.3, 0.36].map((t) => {
      const [moving] = authoriseAt(t).packets;

      return moving.wire.from.x + (moving.wire.to.x - moving.wire.from.x) * moving.at;
    });

    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(nodeOf(authoriseAt(0.42), "stop-3")?.mark?.kind).toBe("tick");
    expect(authoriseAt(0.6).packets[0].heading).toBe(-1);
    expect(nodeOf(authoriseAt(0.8), "stop-0")?.tone).toBe("approved");
  });

  it("keeps selling through the outage, then syncs each receipt once when the signal is back", () => {
    expect(syncAt(0.2).signal?.isLost).toBe(true);
    expect(syncAt(0.28).receipts.length).toBeGreaterThan(2);
    expect(syncAt(0.4).signal).toMatchObject({ isLost: false, bars: 4 });
    expect(nodeOf(syncAt(0.82), "cloud")?.mark?.kind).toBe("tick");
  });

  it("splits one payment three ways, each coin as large as its share", () => {
    expect(SPLIT_SHARES.reduce((total, share) => total + share, 0)).toBeCloseTo(1);
    expect(splitAt(0.15).coins).toHaveLength(1);

    const flying = splitAt(0.48).coins;
    const radii = flying.map((coin) => coin.radius);

    expect(flying).toHaveLength(3);
    expect(radii[1]).toBeGreaterThan(radii[2]);
    expect(radii[2]).toBeGreaterThan(radii[0]);
    expect(splitAt(0.8).nodes.filter((node) => node.id.startsWith("share") && node.tone === "approved")).toHaveLength(3);
  });
});
