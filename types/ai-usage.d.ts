import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

import { AiUsageSections, AiUsageStage, AiUsageView } from "@/packages/insights/ai-usage";

// The domain package is icon agnostic; this site renders FontAwesome icons.
export type AiUsageIcon = FontAwesomeIconProps["icon"];

export type PortfolioAiUsage = AiUsageSections<AiUsageIcon>;

export type PortfolioAiUsageStage = AiUsageStage<AiUsageIcon>;

export type PortfolioAiUsageView = AiUsageView<AiUsageIcon>;
