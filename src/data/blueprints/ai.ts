import { Blueprint } from "@/types/blueprints";

// AI delivery, drawn in the AI zone. Every drawing is a glance, not the full design.
const blueprints: Blueprint[] = [
  {
    id: "ai-workflow",
    zone: "ai",
    title: "AI delivery: plan artifacts, agents and test batteries",
    caption: "The plan artifact is the system of record, batteries prove each task on the deployed build, and a person " +
      "merges. A tracker is an optional view, not the source.",
    summary: {
      role: "Proposed and designed it, and work inside it every day",
      scale: "My own products, client work and a large enterprise delivery organisation; on one product, 600+ battery " +
        "scripts across 40+ subjects and 150+ end to end specs",
      stack: ["Claude Code on Max", "Gemini Enterprise", "Claude, GPT and Gemini APIs", "MCP servers", "Subagents", "Playwright", "Shell batteries", "Artifacts"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "ai-plan",
          label: "Plan artifact, the system of record",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "ai-phases", label: "Phases", detail: "Each with the gate that closes it" },
            { id: "ai-tasks", label: "Tasks", detail: "Owner, acceptance, status" },
            { id: "ai-decisions", label: "Decision register", detail: "Numbered, searched first" },
          ],
        },
        {
          id: "ai-contract",
          label: "Contract the agent works under",
          place: { col: 1, row: 2 },
          nodes: [
            { id: "ai-policy", label: "Policy", detail: "What AI may touch" },
            { id: "ai-rules", label: "Rules and skills", detail: "Per repository" },
            { id: "ai-handoffs", label: "Handoffs and memory" },
          ],
        },
        {
          id: "ai-run",
          label: "Agent run",
          place: { col: 2, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ai-agent", label: "Main agent", detail: "Large model" },
            { id: "ai-subagents", label: "Subagents", detail: "Read only, never build or commit" },
            { id: "ai-mcp", label: "Scoped tools, MCP", detail: "Staging and production kept apart" },
          ],
        },
        {
          id: "ai-proof",
          label: "Batteries on the deployed build",
          place: { col: 3, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ai-security", label: "Security", detail: "Negative cases: 403 and 404 where they belong" },
            { id: "ai-function", label: "Functionality", detail: "HTTP verified" },
            { id: "ai-flows", label: "Product flows", detail: "Web app to back office, and back" },
            { id: "ai-providers", label: "Provider agnostic", detail: "One contract, every provider" },
            { id: "ai-money", label: "Money path", detail: "Ledger rows verified in the database" },
            { id: "ai-e2e", label: "End to end", detail: "Playwright, screenshots before and after" },
          ],
        },
        {
          id: "ai-gates",
          label: "Gates",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "ai-ledgers", label: "Runs and endpoint ledgers", detail: "Every run, with its commit" },
            { id: "ai-prbody", label: "Pull request body", detail: "Verified versus assumed" },
            { id: "ai-design", label: "Design review agent" },
            { id: "ai-human", label: "Human review", detail: "Every change" },
          ],
        },
        {
          id: "ai-landing",
          place: { col: 4, row: 2 },
          nodes: [{ id: "ai-merge", label: "Merge and republish the plan" }],
        },
      ],
      edges: [
        { from: "ai-phases", to: "ai-tasks" },
        { from: "ai-tasks", to: "ai-agent" },
        { from: "ai-contract", to: "ai-run" },
        { from: "ai-agent", to: "ai-subagents" },
        { from: "ai-agent", to: "ai-mcp" },
        { from: "ai-run", to: "ai-proof" },
        { from: "ai-proof", to: "ai-ledgers" },
        { from: "ai-ledgers", to: "ai-prbody" },
        { from: "ai-prbody", to: "ai-design" },
        { from: "ai-design", to: "ai-human" },
        { from: "ai-human", to: "ai-merge" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "The plan artifact",
          regions: [
            { kind: "bar", label: "Where things stand", area: "header" },
            { kind: "steps", label: "Phases, each with its gate", area: "left" },
            { kind: "list", label: "Tasks: owner, acceptance, status, the decision behind it", area: "main" },
            { kind: "card", label: "Open questions, with options and a recommendation", area: "right" },
            { kind: "list", label: "Changelog of settled sections", area: "footer" },
          ],
        },
        {
          title: "The runs ledger",
          regions: [
            { kind: "bar", label: "Battery, commit, time" },
            { kind: "list", label: "Each run: pass, fail, skip, pending", size: 2.4 },
            { kind: "bar", label: "Stale when its source changes" },
          ],
        },
      ],
      decision: "The plan page is the record: every row is re-measured on each pass, a row that cannot be checked stays " +
        "unverified, and status is earned by a battery on the deployed build.",
      outcome: "Nothing is re-entered into a tracker, decisions survive long agent sessions, and a change merges only when the batteries and a person agree.",
    },
    journeys: [
      {
        title: "A phase, from decision to merge",
        steps: [
          "The refund window per jurisdiction is decided and recorded as a numbered decision",
          "The agent adds a jurisdiction snapshot at checkout, proven by a probe on staging",
          "The refund endpoint refuses late requests, proven by a battery: 403 outside the window, 200 inside",
          "Ledger rows are checked in the database: debit and credit balance under one correlation id",
          "The back office screen is built and the design review agent approves it",
          "All batteries are green on the deployed build, and a person merges",
        ],
      },
      {
        title: "A battery run",
        steps: [
          "Runs against the deployed build, never against seeded state",
          "Checks the negative cases: another user's data is 403, a foreign id is 404",
          "Moves money only behind an explicit flag, so a plain run is harmless",
          "Writes one line to the runs ledger with its commit",
          "A change to the code it covers marks its last green run as stale",
        ],
      },
    ],
  },
];

export default blueprints;
