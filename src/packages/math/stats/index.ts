// The total of what `value` reads off each item, added in order: 0 for none.
export const sumBy = <T>(items: readonly T[], value: (item: T) => number): number => items.reduce((total, item) => total + value(item), 0);

// The total of some numbers, added in order: 0 for none.
export const sum = (values: readonly number[]): number => sumBy(values, (value) => value);

// The middle of some numbers once sorted (the upper of the two middles for an even count), so one outlier does not
// move it the way it moves a mean. NaN for none. The numbers given are left in their order.
export const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((first, second) => first - second);

  return sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : Number.NaN;
};
