import { portfolioData, PortfolioData } from "@/data/resume";
import { ContentSource } from "@/packages/core/content";

// The one place that knows where this site keeps its AI usage content. A CMS or API source would
// implement the same port and nothing downstream would change.
export class PortfolioAiUsageSource implements ContentSource {
  private readonly data: PortfolioData;

  constructor(data: PortfolioData = portfolioData) {
    this.data = data;
  }

  public read(): unknown {
    return {
      intro: this.data.sections.aiUsage,
      ...this.data.aiUsage,
    };
  }
}
