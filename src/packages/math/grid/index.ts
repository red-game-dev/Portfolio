// How many columns to lay `count` cards in, at most `max`, so the last row is as full as it can be: six
// cards in a row of five leave one alone, in three they make two even rows. The most columns that divide
// the cards evenly win; failing that, the most columns that leave the fewest empty cells.
export const balancedColumns = (count: number, max: number) => {
  const limit = Math.max(1, Math.min(count, max));
  let best = limit;
  let fewestEmpty = Infinity;

  // One column always divides evenly, so it only wins when nothing wider fits.
  for (let columns = limit; columns >= Math.min(2, limit); columns -= 1) {
    const empty = (columns - (count % columns)) % columns;

    if (empty === 0) {
      return columns;
    }

    if (empty < fewestEmpty) {
      fewestEmpty = empty;
      best = columns;
    }
  }

  return best;
};
