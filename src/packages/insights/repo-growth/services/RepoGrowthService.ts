import { ContentService } from "@/packages/core/content";

import { RepoGrowth, RepoGrowthView } from "../domain/types";
import { isRepoGrowth } from "../guards/isRepoGrowth";
import { RepoGrowthViewMapper } from "../mappers/RepoGrowthViewMapper";
import { RepoGrowthValidator } from "../validators/RepoGrowthValidator";

// Source in, view out: the generated history is guarded, validated and mapped like any content crossing a
// boundary.
export class RepoGrowthService extends ContentService<RepoGrowth, RepoGrowthView> {
  protected readonly guard = isRepoGrowth;
  protected readonly validator = new RepoGrowthValidator();
  protected readonly mapper = new RepoGrowthViewMapper();
}
