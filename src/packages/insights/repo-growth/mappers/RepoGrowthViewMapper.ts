import { Mapper } from "@/packages/core/domain";

import { RepoGrowth, RepoGrowthView } from "../domain/types";

// Lines as heights against the tallest district at any point, so a building's height means the same thing in
// every frame and the city visibly grows.
export class RepoGrowthViewMapper extends Mapper<RepoGrowth, RepoGrowthView> {
  public map({ districts, frames }: RepoGrowth): RepoGrowthView {
    const peak = Math.max(1, ...frames.flatMap((frame) => frame.lines));

    return {
      districts,
      peak,
      frames: frames.map(({ date, lines }) => ({
        date,
        heights: lines.map((count) => count / peak),
        total: lines.reduce((sum, count) => sum + count, 0),
      })),
    };
  }
}
