// A number as it reads in British English, grouped in thousands, to at most `digits` places (or exactly that many,
// with `isFixed`, so a column of readings lines up).
export const formatNumber = (value: number, digits = 0, isFixed = false): string =>
  new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: isFixed ? digits : 0 }).format(value);
