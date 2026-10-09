// A number rounded to `places` decimal places, still a number: for readings and coordinates that should not carry
// more precision than they mean, where formatting for reading is a separate step.
export const roundTo = (value: number, places: number): number => Math.round(value * 10 ** places) / 10 ** places;
