import delivery from "@/data/blueprints/delivery";
import { Blueprint } from "@/types/blueprints";

// The DevOps universe's drawings: how my systems were set up from scratch on servers, moved between hosts with no
// lock-in, shipped by scripts of my own, run at the edge, and rolled out on Kubernetes. Every fact comes from what the
// page already says; no company is named. Every drawing is a glance, not the full design.

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
      "shell scripts doing the building and the shipping, so nothing was rented that a server of mine could do.",
    summary: {
      role: "Set up the servers, containers, build runners and scripts myself, with no AWS",
      scale: "The social network and the game: servers in each region on OVH and DigitalOcean",
      stack: ["Docker", "OVH", "DigitalOcean", "PostgreSQL", "Redis", "Shell scripts"],
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
          place: { col: 3, row: 1, rowSpan: 2 },
          nodes: [
            { id: "sc-one-app", label: "App containers", detail: "The same on every server" },
            { id: "sc-one-db", label: "PostgreSQL", detail: "In a container, backed up", kind: "store" },
            { id: "sc-one-cache", label: "Redis", detail: "In a container", kind: "store" },
          ],
        },
        {
          id: "sc-two",
          label: "Servers in another region",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "sc-two-app", label: "App containers", detail: "The same images" },
            { id: "sc-two-db", label: "PostgreSQL", detail: "Started and moved with the same tools", kind: "store" },
            { id: "sc-two-cache", label: "Redis", kind: "store" },
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
        { from: "sc-one-app", to: "sc-one-db" },
        { from: "sc-one-app", to: "sc-one-cache" },
        { from: "sc-two-app", to: "sc-two-db" },
      ],
    },
    journeys: [
      {
        title: "A release, from scratch",
        steps: [
          "I push, and my own runner builds the containers",
          "A script migrates the database",
          "The same images go out region by region",
          "Each region's health is checked",
          "A failed check rolls back to the last good build",
        ],
      },
      {
        title: "Moving a region to another host",
        steps: [
          "New servers on the new host",
          "The same containers started there",
          "The data restored with the same tools",
          "Players switched over",
          "The old servers retired",
        ],
      },
    ],
  },
  {
    id: "devops-hosts",
    tab: "Many hosts",
    zone: "devops",
    title: "One CLI, any host, no lock-in",
    caption: "One CLI sets up every host the same way through an adapter for each, so a whole stack moves in the same four " +
      "steps anywhere: add the host, run both, switch, retire.",
    summary: {
      role: "Designed and built the CLI most of my startups ran on, and later an infrastructure package on the same idea, " +
        "through 84 recorded decisions",
      scale: "Most of my startups, across dedicated and virtual servers",
      stack: ["Docker", "PostgreSQL", "Redis", "OVH", "Hetzner", "DigitalOcean"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "mh-cli",
          label: "The CLI",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "mh-provision", label: "Provision", detail: "Servers, set up the same way" },
            { id: "mh-start", label: "Start the stack", detail: "Containers, databases and Redis" },
            { id: "mh-move", label: "Move", detail: "With a cost comparison" },
            { id: "mh-secrets", label: "Secrets and runners" },
          ],
        },
        {
          id: "mh-adapters",
          label: "One adapter per host",
          place: { col: 2, row: 1, rowSpan: 2 },
          nodes: [
            { id: "mh-dedicated", label: "Dedicated servers" },
            { id: "mh-do", label: "Virtual servers" },
            { id: "mh-new", label: "A new host", detail: "One more adapter", kind: "note" },
          ],
        },
        {
          id: "mh-hosts",
          label: "Hosts",
          isExternal: true,
          place: { col: 3, row: 1 },
          nodes: [
            { id: "mh-ovh", label: "OVH and Hetzner" },
            { id: "mh-ocean", label: "DigitalOcean" },
            { id: "mh-other", label: "Any other host", detail: "Through its own adapter" },
          ],
        },
        {
          id: "mh-stack",
          label: "The same stack everywhere",
          place: { col: 3, row: 2, colSpan: 2 },
          columns: 2,
          nodes: [
            { id: "mh-containers", label: "Containers", detail: "One set of images", span: 2 },
            { id: "mh-db", label: "PostgreSQL", kind: "store" },
            { id: "mh-redis", label: "Redis", kind: "store" },
          ],
        },
        {
          id: "mh-cut",
          label: "The cut over",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "mh-both", label: "Run both", detail: "Old and new at once" },
            { id: "mh-retire", label: "Switch, then retire" },
          ],
        },
      ],
      edges: [
        { from: "mh-provision", to: "mh-adapters" },
        { from: "mh-dedicated", to: "mh-ovh" },
        { from: "mh-do", to: "mh-ocean" },
        { from: "mh-new", to: "mh-other" },
        { from: "mh-hosts", to: "mh-stack", label: "the same" },
        { from: "mh-move", to: "mh-both" },
        { from: "mh-both", to: "mh-retire" },
      ],
    },
    journeys: [
      {
        title: "Moving a stack to another host",
        steps: [
          "Add the host: one adapter",
          "Start the same stack on it",
          "Run both side by side",
          "Switch the traffic",
          "Retire the old host",
        ],
      },
      {
        title: "Choosing where it goes",
        steps: [
          "Compare what the stack would cost on each host",
          "Provision the one that fits",
          "Keep every environment the same across hosts",
        ],
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
      stack: ["Shell scripts", "Docker", "PostgreSQL"],
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
        title: "A release that fails its check",
        steps: [
          "The new build goes out",
          "Its health check fails",
          "A script puts the last good build back",
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
      "private or shared; everything else cached at the edge, and readable offline.",
    summary: {
      role: "Designed, built and run end to end",
      scale: "This site, and the same pattern across several other projects",
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
        { from: "ed-cache", to: "ed-functions", label: "on a miss" },
        { from: "ed-reader", to: "ed-worker", style: "dashed" },
        { from: "ed-ask", to: "ed-redis" },
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
          "CI runs lint, types and every test",
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
