import { CARD_WIDTH, fanStep } from "@/components/IGaming/LiveTable/fan";

describe("the live table's hand", () => {
  test("is a row until it has been measured, or with one card", () => {
    expect(fanStep(0, 9)).toBeNull();
    expect(fanStep(900, 1)).toBeNull();
  });

  test("fans with the usual tuck where there is plenty of room", () => {
    expect(fanStep(2000, 9)).toBe(-46);
  });

  test("tucks further to fit a narrower table, but never past readable strips", () => {
    const width = 24 + CARD_WIDTH * 11 - 10 * 55;

    expect(fanStep(width, 11)).toBe(-55);
    expect(fanStep(24 + CARD_WIDTH * 11 - 10 * 61, 11)).toBeNull();
  });
});
