import {
  isArrayOf,
  isCount,
  isFiniteNumber,
  isOptionalBoolean,
  isRecord,
  isText,
  isTextArray
} from "@/packages/core/domain";

describe("core/domain guards", () => {
  test("isRecord accepts plain objects only", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord("text")).toBe(false);
  });

  test("isFiniteNumber rejects NaN and infinities", () => {
    expect(isFiniteNumber(3)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber("3")).toBe(false);
  });

  test("isCount takes whole numbers from zero up", () => {
    expect(isCount(0)).toBe(true);
    expect(isCount(12)).toBe(true);
    expect(isCount(-1)).toBe(false);
    expect(isCount(1.5)).toBe(false);
    expect(isCount("3")).toBe(false);
  });

  test("isOptionalBoolean allows a missing value", () => {
    expect(isOptionalBoolean(undefined)).toBe(true);
    expect(isOptionalBoolean(false)).toBe(true);
    expect(isOptionalBoolean("false")).toBe(false);
  });

  test("isArrayOf checks every item", () => {
    expect(isTextArray(["a", "b"])).toBe(true);
    expect(isTextArray(["a", 1])).toBe(false);
    expect(isArrayOf(isText)("a")).toBe(false);
  });
});
