import { AiUsageContent } from "@/packages/insights/ai-usage";

export const createAiUsageContent = (overrides: Partial<AiUsageContent<string>> = {}): AiUsageContent<string> => ({
  intro: { title: "How I use AI", description: ["Intro"] },
  screen: { message: ["1,000 prompts"], label: "1,000 prompts" },
  mix: {
    title: "What I use it for",
    description: ["Breakdown"],
    tasks: [
      { name: "Review", count: 3428 },
      { name: "Coding", count: 7916 },
      { name: "Docs", count: 1087 },
    ],
    notes: ["Approximate"],
  },
  areas: {
    title: "Subjects I use it on",
    description: ["Overlapping"],
    groups: [{ label: "Hundreds of prompts each", items: ["Testing", "SEO"] }],
    notes: ["Performance has no row in the task split"],
  },
  agents: {
    title: "How I work with agents",
    description: ["Stages"],
    stages: [{ name: "Context", icon: "file", principles: [{ title: "Rules", description: "A context file per repo" }] }],
    examples: { title: "Caught in review", items: [{ title: "A flow", description: "Found on the deployed build" }] },
    footer: "Footer",
  },
  timeline: {
    title: "How I got here",
    milestones: [{ period: "2023", title: "Start", description: "Began", isCurrent: true }],
  },
  ...overrides,
});
