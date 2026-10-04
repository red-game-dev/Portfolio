const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

// Rounds down, never up, then marks it as a floor: 3,085 becomes "3,050+", not "3,100+".
export const formatCountFloor = (count: number, step: number) => `${NUMBER_FORMAT.format(Math.floor(count / step) * step)}+`;

export const sortByCountDescending = <TTask extends { count: number }>(tasks: TTask[]) => [...tasks]
  .sort((first, second) => second.count - first.count);

export const scaleToCells = (count: number, max: number, cells: number) => (max > 0 ? Math.max(1, Math.round((count / max) * cells)) : 0);
