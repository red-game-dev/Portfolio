export const formatShare = (share: number) => `${share}%`;

export const sumShares = <TTask extends { share: number }>(tasks: TTask[]) => tasks.reduce((sum, task) => sum + task.share, 0);

export const sortByShareDescending = <TTask extends { share: number }>(tasks: TTask[]) => [...tasks]
  .sort((first, second) => second.share - first.share);
