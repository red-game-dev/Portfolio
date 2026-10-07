import { collapseWhitespace, fill } from "@/packages/text/format";

describe("fill", () => {
  it("fills every placeholder, numbers included, wherever and however often it appears", () => {
    expect(fill("{from} to {to} of {count}", { from: 3, to: 4, count: 23 })).toBe("3 to 4 of 23");
    expect(fill("{n} and {n} again", { n: 2 })).toBe("2 and 2 again");
  });

  it("leaves a placeholder without a value as written, so it shows rather than vanishes", () => {
    expect(fill("Stop {n} of {total}", { n: 1 })).toBe("Stop 1 of {total}");
  });

  it("does not read values off the object's prototype", () => {
    expect(fill("{toString}", {})).toBe("{toString}");
  });
});

describe("collapseWhitespace", () => {
  it("joins a multi line template literal into one line", () => {
    expect(collapseWhitespace(`  The breadth of his
      knowledge   is excellent. `)).toBe("The breadth of his knowledge is excellent.");
  });
});
