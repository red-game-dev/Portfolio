import { isStoredGame } from "@/components/Game/storage";
import { isLens, lensFromSearch } from "@/config/lenses";
import { readStored, writeStored } from "@/packages/browser/storage";

describe("browser storage", () => {
  afterEach(() => window.localStorage.clear());

  it("round trips JSON and validates what it reads", () => {
    expect(writeStored("k", { characterClass: "Architect", bestScore: 12 })).toBe(true);
    expect(readStored("k", isStoredGame)).toEqual({ characterClass: "Architect", bestScore: 12 });
    expect(readStored("missing", isStoredGame)).toBeNull();
  });

  it("still reads a value stored as a plain string before values were JSON", () => {
    window.localStorage.setItem("redgame.lens", "product");

    expect(readStored("redgame.lens", isLens)).toBe("product");
  });

  it("ignores what does not pass the guard", () => {
    window.localStorage.setItem("k", JSON.stringify({ characterClass: 3, bestScore: "high" }));

    expect(readStored("k", isStoredGame)).toBeNull();
    expect(isStoredGame({ characterClass: null, bestScore: Infinity })).toBe(false);
    expect(isStoredGame({ characterClass: null, bestScore: 0 })).toBe(true);
  });

  it("finds nothing and remembers nothing when storage is blocked", () => {
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readStored("k", isLens)).toBeNull();
    expect(writeStored("k", "engineer")).toBe(false);

    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe("lensFromSearch", () => {
  it("takes a view a link names and ignores anything else", () => {
    expect(lensFromSearch("?view=recruiter")).toBe("recruiter");
    expect(lensFromSearch("?view=boss&x=1")).toBeNull();
    expect(lensFromSearch("")).toBeNull();
  });
});
