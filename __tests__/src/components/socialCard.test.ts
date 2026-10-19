import { CARD_MS, cardAt, countUp } from "@/components/SocialCard/timeline";
import { ZONE_BOUNDARIES } from "@/config/zones";

const ZONES = ZONE_BOUNDARIES.map(({ zone }) => zone);

describe("the share card's film", () => {
  test("it opens in bits in the first universe, nothing lit, and ends on the finished card in the last", () => {
    const first = cardAt(0, ZONES);
    const last = cardAt(CARD_MS, ZONES);

    expect([first.name, first.role, first.availability, first.figures, first.lit]).toEqual([0, 0, 0, 0, 0]);
    expect(first.zone).toBe(ZONES[0]);
    expect([last.name, last.role, last.availability, last.figures, last.lit]).toEqual([1, 1, 1, 1, ZONES.length]);
    expect(last.zone).toBe(ZONES[ZONES.length - 1]);
  });

  test("every universe lights in page order, and the card holds still well before the loop ends", () => {
    const seen: string[] = [];

    for (let ms = 0; ms <= CARD_MS; ms += 1000 / 30) {
      const { zone } = cardAt(ms, ZONES);

      if (seen[seen.length - 1] !== zone) {
        seen.push(zone);
      }
    }

    expect(seen).toEqual(ZONES);
    // At least a second and a half on the finished card, so the last frame is the picture.
    expect(cardAt(CARD_MS - 1500, ZONES).lit).toBe(ZONES.length);
  });

  test("a figure counts up keeping its sign, unit and decimals", () => {
    expect(countUp("200M+", 0)).toBe("0M+");
    expect(countUp("200M+", 0.5)).toBe("100M+");
    expect(countUp("200M+", 1)).toBe("200M+");
    expect(countUp("1.5M+", 0.5)).toBe("0.8M+");
    expect(countUp("$4", 1)).toBe("$4");
    expect(countUp("Many", 0.3)).toBe("Many");
  });
});
