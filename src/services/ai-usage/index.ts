import { AiUsageService } from "@/packages/insights/ai-usage";
import { PortfolioAiUsageSource } from "@/services/ai-usage/PortfolioAiUsageSource";
import { AiUsageIcon } from "@/types/ai-usage";

// Composition root: the only place the generic service meets this site's content.
export const aiUsageService = new AiUsageService<AiUsageIcon>(new PortfolioAiUsageSource());
