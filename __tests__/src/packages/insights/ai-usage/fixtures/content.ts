import { AiUsageContent } from "@/packages/insights/ai-usage";

export const createAiUsageContent = (overrides: Partial<AiUsageContent<string>> = {}): AiUsageContent<string> => ({
  intro: { title: "How I use AI", description: ["Intro"] },
  screen: { message: ["1,000 prompts"], label: "1,000 prompts" },
  mix: {
    title: "What I use it for",
    description: ["Breakdown"],
    tasks: [
      { name: "Review", share: 25 },
      { name: "Coding", share: 60 },
      { name: "Docs", share: 15 },
    ],
    notes: ["Approximate"],
  },
  agents: {
    title: "How I work with agents",
    description: ["Stages"],
    stages: [{ name: "Context", icon: "file", principles: [{ title: "Rules", description: "A context file per repo" }] }],
    footer: "Footer",
  },
  timeline: {
    title: "How I got here",
    milestones: [{ period: "2023", title: "Start", description: "Began", isCurrent: true }],
  },
  ...overrides,
});
