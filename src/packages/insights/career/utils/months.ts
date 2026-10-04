const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Months since year 0, so ranges can be compared and merged with plain arithmetic.
export const toMonthIndex = (value: string): number => {
  const parts = value
    .trim()
    .toLowerCase()
    .split(/\s+/);
  const year = Number(parts[parts.length - 1]);
  const month = parts.length > 1 ? MONTHS.indexOf(parts[0].slice(0, 3)) : 0;

  if (!Number.isInteger(year) || month < 0) {
    throw new Error(`Cannot read the date "${value}". Use "Nov 2019" or "2025".`);
  }

  return year * 12 + month;
};
