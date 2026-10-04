import { Mapper } from "@/packages/core/domain";

import { AiUsageContent, AiUsageMix, AiUsageMixView, AiUsageView } from "../domain/types";
import { formatShare, sortByShareDescending } from "../utils/shares";

export class AiUsageViewMapper<TIcon = unknown> extends Mapper<AiUsageContent<TIcon>, AiUsageView<TIcon>> {
  public map(content: AiUsageContent<TIcon>): AiUsageView<TIcon> {
    return { ...content, mix: this.toMixView(content.mix) };
  }

  public toMixView(mix: AiUsageMix): AiUsageMixView {
    const tasks = sortByShareDescending(mix.tasks);

    return {
      ...mix,
      // The largest share fills its row exactly, which keeps one cell equal to one percentage point.
      trackLength: tasks[0]?.share ?? 0,
      tasks: tasks.map((task) => ({ ...task, label: formatShare(task.share) })),
    };
  }
}
