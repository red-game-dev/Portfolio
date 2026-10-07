import { balancedColumns } from "@/packages/math/grid";

describe("balancedColumns", () => {
  it("prefers the most columns that fill every row", () => {
    expect(balancedColumns(6, 5)).toBe(3);
    expect(balancedColumns(8, 5)).toBe(4);
    expect(balancedColumns(10, 5)).toBe(5);
    expect(balancedColumns(4, 3)).toBe(2);
  });

  it("otherwise leaves the fewest empty cells", () => {
    expect(balancedColumns(7, 5)).toBe(4);
    expect(balancedColumns(11, 4)).toBe(4);
  });

  it("never asks for more columns than cards, or fewer than one", () => {
    expect(balancedColumns(2, 5)).toBe(2);
    expect(balancedColumns(1, 3)).toBe(1);
    expect(balancedColumns(0, 3)).toBe(1);
  });
});
