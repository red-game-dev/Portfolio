const tidy = (part: string) => part
  .trim()
  .replace(/\.js$|js$/, "")
  .replace(/[\s.\-_]/g, "");

// "Next.js (App Router, SSR)", "NextJs" and "next" all become "next"; "Vue.js / Nuxt" yields both "vue" and
// "nuxt". Only a spaced slash splits, so "C/C++" stays one name.
export const skillKeys = (name: string): string[] => name
  .toLowerCase()
  .replace(/\([^)]*\)/g, " ")
  .split(" / ")
  .map(tidy)
  .filter(Boolean);

// A stack entry also counts for what it lists in brackets: "JS (jQuery, Backbone)" covers jQuery and Backbone.
export const sourceKeys = (name: string): string[] => {
  const bracketed = [...name.matchAll(/\(([^)]*)\)/g)].flatMap((match) => match[1].split(","));

  return [...skillKeys(name), ...bracketed.map((item) => tidy(item.toLowerCase())).filter(Boolean)];
};
