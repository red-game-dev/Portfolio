import history from "@/data/timelapse/history.json";
import { ContentSource } from "@/packages/core/content";
import { RepoGrowthService } from "@/packages/insights/repo-growth";

// The committed snapshot `npm run timelapse` writes from git history. Loaded with a dynamic import when the
// time-lapse comes near, so neither the history nor this code is in the page bundle.
class SnapshotRepoGrowthSource implements ContentSource {
  public read(): unknown {
    return history;
  }
}

export const repoGrowthService = new RepoGrowthService(new SnapshotRepoGrowthSource());

// Computed once when this module loads, and handed to the page with what it needs to glide between frames.
export const repoGrowthView = repoGrowthService.getView();

export { heightBetween } from "@/packages/insights/repo-growth";
