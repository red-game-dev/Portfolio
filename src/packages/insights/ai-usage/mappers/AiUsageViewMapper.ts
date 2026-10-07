import { Mapper } from "@/packages/core/domain";

import { AI_USAGE_CONFIG } from "../config";
import { AiUsageContent, AiUsageMix, AiUsageMixView, AiUsageView } from "../domain/types";
import { formatCountFloor, scaleToCells, sortByCountDescending } from "../utils/counts";

export class AiUsageViewMapper<TIcon = unknown> extends Mapper<AiUsageContent<TIcon>, AiUsageView<TIcon>> {
  private readonly barCells: number;
  private readonly countStep: number;

  constructor(barCells: number = AI_USAGE_CONFIG.barCells, countStep: number = AI_USAGE_CONFIG.countStep) {
    super();
    this.barCells = barCells;
    this.countStep = countStep;
  }

  public map(content: AiUsageContent<TIcon>): AiUsageView<TIcon> {
    return { ...content, mix: this.toMixView(content.mix) };
  }

  public toMixView(mix: AiUsageMix): AiUsageMixView {
    const tasks = sortByCountDescending(mix.tasks);
    const max = tasks[0]?.count ?? 0;

    return {
      ...mix,
      trackLength: this.barCells,
      tasks: tasks.map((task) => ({
        ...task,
        label: formatCountFloor(task.count, this.countStep),
        litCells: scaleToCells(task.count, max, this.barCells),
      })),
    };
  }
}
