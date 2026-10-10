// Fills every {name} in a template from `values`. Placeholders without a value are left as written, so a
// missing value shows up on the page rather than vanishing.
export const fill = (template: string, values: Record<string, string | number>) => template
  .replace(/\{(\w+)\}/g, (placeholder, name: string) => (Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : placeholder));

// Content written across several lines in a template literal, as one line of text.
export const collapseWhitespace = (text: string) => text.replace(/\s+/g, " ").trim();

// Text with its first letter upper case, for a name that may be written in lower case where it is kept.
export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
