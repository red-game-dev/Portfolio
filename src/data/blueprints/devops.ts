import delivery from "@/data/blueprints/delivery";
import { Blueprint } from "@/types/blueprints";

// The DevOps universe's drawings: how my systems were set up from scratch on servers, moved between hosts with no
// lock-in, shipped by scripts of my own, run at the edge, and rolled out on Kubernetes. Every fact comes from what the
// page already says (the DevOps section, the case studies) or from this site's own repository; no company is named.
// Every drawing is a glance, not the full design.

// The commerce platform's rollout on Kubernetes is drawn once, in More Skills by Area, and shown here as well in this
// universe's look, rather than told twice.
const kubernetes = delivery.find((blueprint) => blueprint.id === "commerce-delivery");

const blueprints: Blueprint[] = [
  {
    id: "devops-scratch",
    tab: "From scratch",
    zone: "devops",
    title: "Servers set up from scratch, region by region",
    caption: "Every service in the same Docker containers on servers I set up myself in each region, with my own runners and " +
      "shell scripts doing the building and the shipping, so no build minutes were ever paid for.",
    summary: {
      role: "Set up the servers, containers, build runners and scripts myself, with no AWS",
      scale: "The social network and the game: servers in each region on OVH and DigitalOcean",
      stack: ["Docker", "OVH", "DigitalOcean", "Redis", "Shell scripts"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "sc-people",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "sc-players", label: "Players and members", kind: "actor" },
            { id: "sc-me", label: "Me", detail: "Pushing a release", kind: "actor" },
          ],
        },
        {
          id: "sc-build",
          label: "My own runner",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "sc-runner", label: "Build runner", detail: "No build minutes paid for" },
            { id: "sc-scripts", label: "Shell scripts", detail: "Build, migrate, deploy, check, roll back" },
          ],
        },
        {
          id: "sc-switch",
          label: "Before load balancers were common",
          place: { col: 2, row: 2 },
          nodes: [{ id: "sc-region", label: "Which region?", detail: "Switched by hand", kind: "decision" }],
        },
        {
          id: "sc-one",
          label: "Servers in one region",
          place: { col: 3, row: 1 },
          nodes: [{ id: "sc-one-app", label: "App containers", detail: "The same on every server" }],
        },
        {
          id: "sc-two",
          label: "Servers in another region",
          place: { col: 4, row: 1 },
          nodes: [{ id: "sc-two-app", label: "App containers", detail: "The same images" }],
        },
        {
          id: "sc-data",
          label: "Data, in containers too",
          place: { col: 3, row: 2, colSpan: 2 },
          columns: 2,
          nodes: [
            { id: "sc-db", label: "Databases", detail: "Started, backed up and moved with the same tools", kind: "store" },
            { id: "sc-cache", label: "Redis", kind: "store" },
          ],
        },
      ],
      edges: [
        { from: "sc-me", to: "sc-runner", label: "push" },
        { from: "sc-runner", to: "sc-scripts" },
        { from: "sc-scripts", to: "sc-one", label: "deploy" },
        { from: "sc-scripts", to: "sc-two", label: "deploy" },
        { from: "sc-players", to: "sc-region" },
        { from: "sc-region", to: "sc-one-app" },
        { from: "sc-region", to: "sc-two-app" },
        { from: "sc-one-app", to: "sc-data" },
        { from: "sc-two-app", to: "sc-data" },
      ],
    },
    journeys: [
      {
        title: "A player arrives",
        steps: [
          "The player is sent to a region, switched by hand",
          "The same containers serve them wherever they land",
          "Their data lives in containers too, backed up with the same tools",
        ],
      },
    ],
  },
  {
    id: "devops-hosts",
    tab: "Many hosts",
    zone: "devops",
    title: "One CLI, then one adapter per host",
    caption: "The CLI most of my startups ran on set up servers and moved whole stacks between hosts; the infrastructure " +
      "package after it makes a new host one adapter. The cut over is the same for any host: add it, run both, switch, retire.",
    summary: {
      role: "Built the CLI most of my startups ran on, and designed the infrastructure package after it through 84 recorded decisions",
      scale: "Most of my startups, and the platform I build now",
      stack: ["Docker", "Redis"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "mh-cli",
          label: "The CLI my startups ran on",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "mh-servers", label: "Set up servers" },
            { id: "mh-start", label: "Start the stack", detail: "Containers, databases and Redis" },
            { id: "mh-same", label: "Keep every environment the same", detail: "Across hosts" },
            { id: "mh-move", label: "Move a whole stack", detail: "From one host to another" },
          ],
        },
        {
          id: "mh-hosts",
          label: "Hosts",
          isExternal: true,
          place: { col: 2, row: 1 },
          nodes: [
            { id: "mh-one", label: "One host" },
            { id: "mh-another", label: "Another host" },
          ],
        },
        {
          id: "mh-cut",
          label: "The same cut over for any host",
          place: { col: 2, row: 2 },
          nodes: [
            { id: "mh-add", label: "Add it, run both" },
            { id: "mh-switch", label: "Switch, retire" },
          ],
        },
        {
          id: "mh-package",
          label: "The infrastructure package, on the platform I build now",
          place: { col: 3, row: 1, rowSpan: 2 },
          nodes: [
            { id: "mh-one-cli", label: "One CLI", detail: "A new host is one adapter" },
            { id: "mh-moves", label: "Moving between hosts", detail: "With a cost comparison" },
            { id: "mh-runners", label: "Build runners and secrets" },
            { id: "mh-decisions", label: "84 recorded decisions", kind: "note" },
          ],
        },
        {
          id: "mh-adapters",
          label: "Its adapters",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "mh-targets", label: "Deploy targets" },
            { id: "mh-env", label: "Environment variables" },
            { id: "mh-source", label: "Source control" },
          ],
        },
      ],
      edges: [
        { from: "mh-servers", to: "mh-hosts", label: "sets up" },
        { from: "mh-move", to: "mh-cut" },
        { from: "mh-add", to: "mh-switch" },
        { from: "mh-one-cli", to: "mh-adapters" },
        { from: "mh-moves", to: "mh-cut", style: "dashed" },
      ],
    },
    journeys: [
      {
        title: "Moving a stack to another host",
        steps: ["Add the host", "Run both", "Switch", "Retire the old one"],
      },
      {
        title: "A new host on the package",
        steps: ["Add one adapter for it", "Compare what the move would cost", "Move with the same cut over"],
      },
    ],
  },
  {
    id: "devops-scripts",
    tab: "Shell deploys",
    zone: "devops",
    title: "The scripts that ship it",
    caption: "Build, migrate, deploy, check and roll back, each a script run on my own runner, so a release that fails its " +
      "check puts the last good build back.",
    summary: {
      role: "Wrote the build and deploy scripts and ran the runners myself, so no build minutes were ever paid for",
      scale: "Every stack I set up from scratch",
      stack: ["Shell scripts", "Docker"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "sd-build",
          label: "Build",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "sd-push", label: "A push", kind: "actor" },
            { id: "sd-image", label: "Build the image" },
          ],
        },
        {
          id: "sd-migrate",
          label: "Migrate",
          place: { col: 2, row: 1 },
          nodes: [{ id: "sd-db", label: "Database migration", detail: "Before the new code runs", kind: "store" }],
        },
        {
          id: "sd-deploy",
          label: "Deploy",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "sd-servers", label: "Deploy to the servers" },
            { id: "sd-health", label: "Healthy?", detail: "Checked by a script", kind: "decision" },
          ],
        },
        {
          id: "sd-live",
          label: "Live",
          place: { col: 4, row: 1 },
          nodes: [{ id: "sd-done", label: "The new build serves" }],
        },
        {
          id: "sd-back",
          label: "Roll back",
          place: { col: 3, row: 2, colSpan: 2 },
          nodes: [{ id: "sd-last", label: "The last good build", detail: "Put back by a script" }],
        },
      ],
      edges: [
        { from: "sd-push", to: "sd-image" },
        { from: "sd-image", to: "sd-db", label: "then" },
        { from: "sd-db", to: "sd-servers", label: "then" },
        { from: "sd-servers", to: "sd-health" },
        { from: "sd-health", to: "sd-done", label: "yes" },
        { from: "sd-health", to: "sd-last", label: "no" },
      ],
    },
    journeys: [
      {
        title: "A release, end to end",
        steps: [
          "I push, and my own runner builds the image",
          "A script migrates the database",
          "Another deploys the new build",
          "Its health is checked",
          "A failed check puts the last good build back",
        ],
      },
    ],
  },
  {
    id: "devops-edge",
    tab: "Edge and serverless",
    zone: "devops",
    title: "Edge and serverless, from branch to reader",
    caption: "A preview for every branch, checked in a real browser before it merges; functions only where something must be " +
      "private, shared or drawn on request; everything else cached at the edge, and readable offline.",
    summary: {
      role: "Designed, built and run end to end",
      scale: "This site, and other projects of mine",
      stack: ["Next.js", "Vercel", "Upstash Redis", "Resend", "GitHub Actions", "Playwright", "Service worker"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "ed-ship",
          label: "From branch to production",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ed-branch", label: "A branch", kind: "actor" },
            { id: "ed-preview", label: "Preview", detail: "Every branch, its own address" },
            { id: "ed-checks", label: "Checks", detail: "Lint, types, tests, the HUD in a browser" },
            { id: "ed-prod", label: "Production", detail: "On merge" },
          ],
        },
        {
          id: "ed-edge",
          label: "Edge",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "ed-reader", label: "Reader", kind: "actor" },
            { id: "ed-cache", label: "Edge cache", detail: "Pages, the share picture, the email art" },
          ],
        },
        {
          id: "ed-offline",
          label: "On the reader's device",
          place: { col: 2, row: 2 },
          nodes: [{ id: "ed-worker", label: "Offline worker", detail: "Pages and builds kept" }],
        },
        {
          id: "ed-functions",
          label: "Functions",
          place: { col: 3, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ed-ask", label: "Ask Red", detail: "Streams answers" },
            { id: "ed-contact", label: "Messages" },
            { id: "ed-board", label: "Daily board" },
            { id: "ed-picture", label: "Share picture", detail: "Drawn from the content" },
          ],
        },
        {
          id: "ed-store",
          label: "Shared store",
          place: { col: 4, row: 1 },
          nodes: [{ id: "ed-redis", label: "Upstash Redis", detail: "Limits, quotas, the board, cached answers", kind: "store" }],
        },
        {
          id: "ed-outside",
          label: "Outside",
          isExternal: true,
          place: { col: 4, row: 2 },
          nodes: [
            { id: "ed-models", label: "AI providers", detail: "The first that answers" },
            { id: "ed-mail", label: "Email delivery" },
          ],
        },
      ],
      edges: [
        { from: "ed-branch", to: "ed-preview" },
        { from: "ed-preview", to: "ed-checks" },
        { from: "ed-checks", to: "ed-prod", label: "merge" },
        { from: "ed-reader", to: "ed-cache" },
        { from: "ed-cache", to: "ed-picture", label: "on a miss" },
        { from: "ed-reader", to: "ed-ask", label: "asks, sends, posts" },
        { from: "ed-reader", to: "ed-worker", style: "dashed" },
        { from: "ed-ask", to: "ed-redis" },
        { from: "ed-contact", to: "ed-redis" },
        { from: "ed-board", to: "ed-redis" },
        { from: "ed-ask", to: "ed-models" },
        { from: "ed-contact", to: "ed-mail" },
      ],
    },
    journeys: [
      {
        title: "A change, from branch to reader",
        steps: [
          "Push a branch: it gets a preview of its own",
          "Open a pull request: CI runs lint, types and every test",
          "The HUD is measured on the preview in a real browser",
          "Reviewed, then merged",
          "Production deploys, and the offline copy updates",
        ],
      },
      {
        title: "A question to Ask Red",
        steps: [
          "The reader asks in the terminal",
          "Limits and the shared cache are checked first",
          "The first AI provider that answers streams it back",
        ],
      },
    ],
  },
  ...(kubernetes ? [{ ...kubernetes, id: "devops-kubernetes", tab: "Kubernetes", zone: "devops" as const }] : []),
];

export default blueprints;
