import { hashText, hexHash } from "@/packages/encoding/hash";

describe("encoding/hash", () => {
  test("the same text always hashes the same, and different text differently", () => {
    expect(hashText("Smart contracts")).toBe(hashText("Smart contracts"));
    expect(hashText("Smart contracts")).not.toBe(hashText("Smart contract"));
    expect(hashText("")).toBe(7);
    expect(hashText("", { seed: 13 })).toBe(13);
  });

  test("the hash stays below its modulus", () => {
    const words = ["a", "Senior Frontend Engineer", "2026-10-10", "x".repeat(200)];

    words.forEach((word) => {
      expect(hashText(word, { modulus: 97 })).toBeLessThan(97);
      expect(hashText(word, { multiplier: 131, modulus: 2147483647 })).toBeLessThan(2147483647);
    });
  });

  test("a hex hash has exactly as many digits as asked, zero padded", () => {
    expect(hexHash("", 7)).toBe("0000007");
    expect(hexHash("Senior Frontend Engineer", 7)).toBe("80badf4");
    expect(hexHash("a", 8)).toBe("0000013a");
    expect(hexHash("Smart contracts", 8, 13)).toMatch(/^[0-9a-f]{8}$/);
  });

  test("a day's date gives the same seed it always has", () => {
    expect(hashText("2026-10-10", { multiplier: 131, modulus: 2147483647 }) % 2147483646 + 1).toBe(245697895);
  });
});
