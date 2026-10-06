import { LensContent } from "@/types/lens";

// The three ways to read the site, chosen before the page opens and switchable from the header.
export const lensContent: LensContent = {
  chooser: {
    title: "Choose how you read this",
    description: "Same story at three depths. Every section stays; the detail changes. You can switch any time from the header.",
    select: "Select",
  },
  cards: [
    {
      lens: "recruiter",
      name: "Recruiter or hiring manager",
      characterClass: "Scout",
      tagline: "The facts, fast",
      perks: [
        "Roles, years and work rights up front",
        "Languages, frameworks and libraries at a glance",
        "Still visuals, nothing to wait for",
      ],
      stats: [{ name: "Detail", value: 2 }, { name: "Immersion", value: 1 }, { name: "Pace", value: 5 }],
    },
    {
      lens: "product",
      name: "Product",
      characterClass: "Strategist",
      tagline: "Problems, decisions, outcomes",
      perks: [
        "Ventures founded and users reached",
        "Every role read as a product outcome",
        "Wireframes and user flows before architecture",
      ],
      stats: [{ name: "Detail", value: 3 }, { name: "Immersion", value: 3 }, { name: "Pace", value: 3 }],
    },
    {
      lens: "engineer",
      name: "Engineer",
      characterClass: "Netrunner",
      tagline: "Everything, at full depth",
      perks: [
        "Architecture diagrams, stacks and trade offs",
        "Code review, the agent pipeline and the guardrails",
        "Full immersion: the world, the HUD and the fights",
      ],
      stats: [{ name: "Detail", value: 5 }, { name: "Immersion", value: 5 }, { name: "Pace", value: 2 }],
    },
  ],
  names: { recruiter: "Recruiter", product: "Product", engineer: "Engineer" },
  switchLabel: "View as",
  entrances: {
    recruiter: { title: "Opening the facts" },
    product: {
      title: "Plotting the roadmap",
      stages: [
        { name: "Discover", detail: "Find the real problem" },
        { name: "Build", detail: "Ship the smallest thing that proves it" },
        { name: "Launch", detail: "Put it in front of users" },
        { name: "Grow", detail: "Measure, market and scale" },
      ],
    },
    engineer: {
      lines: [
        "boot redgame.dev",
        "mount /architecture /stacks /pipelines",
        "load world: {zones} zones, {bosses} bosses",
        "verify reader: engineer",
      ],
      granted: "Access granted",
    },
  },
};
