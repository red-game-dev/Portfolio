// Keeps the items `keep` returns true for, in order, by shifting them down in place. Unlike filter it
// allocates nothing, which matters in code that runs every frame.
export const compact = <T>(items: T[], keep: (item: T) => boolean): void => {
  let write = 0;

  for (const item of items) {
    if (keep(item)) {
      items[write] = item;
      write += 1;
    }
  }

  items.length = write;
};
