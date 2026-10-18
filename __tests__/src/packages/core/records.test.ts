import { entriesOf, isOneOf, keysOf, recordOf } from "@/packages/core/domain";

type Zone = "matrix" | "ai" | "chain";

const ACCENTS: Record<Zone, string> = { matrix: "#4bffa5", ai: "#4fd8ff", chain: "#b896ff" };

describe("records with a known set of keys", () => {
  test("give back their keys and entries in the record's own types", () => {
    expect(keysOf(ACCENTS)).toEqual(["matrix", "ai", "chain"]);
    expect(entriesOf(ACCENTS)).toEqual([["matrix", "#4bffa5"], ["ai", "#4fd8ff"], ["chain", "#b896ff"]]);
  });

  test("are built with a value for every key", () => {
    expect(recordOf(keysOf(ACCENTS), (zone) => ACCENTS[zone].length)).toEqual({ matrix: 7, ai: 7, chain: 7 });
  });

  test("never count an inherited key as their own", () => {
    const inherited: Record<Zone, string> = Object.assign(Object.create({ beyond: "#c4d2ff" }), ACCENTS);

    expect(keysOf(inherited)).toEqual(["matrix", "ai", "chain"]);
  });

  test("tell whether a value is one of a list of strings", () => {
    expect(isOneOf(keysOf(ACCENTS), "ai")).toBe(true);
    expect(isOneOf(keysOf(ACCENTS), "beyond")).toBe(false);
    expect(isOneOf(keysOf(ACCENTS), 3)).toBe(false);
    expect(isOneOf(keysOf(ACCENTS), undefined)).toBe(false);
  });
});
