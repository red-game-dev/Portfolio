// The DevOps universe's section: where I run things and why, how I built and moved them from scratch, and the
// questions screeners ask about it, answered from what the rest of the page shows.

export type HostId = "dedicated" | "digitalocean" | "aws" | "gcp" | "vercel" | "railway" | "cloudflare";

export interface DevOpsHost {
  id: HostId;
  // The hosts it covers, as named elsewhere on the page.
  name: string;
  kind: string;
  // When I reach for it.
  reach: string;
  // Where it stops paying, and what takes over.
  stops: string;
  // Cheaper or dearer than the others at a given scale, never a price.
  cost: string;
}

export interface DevOpsAnswer {
  id: string;
  question: string;
  answer: string[];
}

export interface DevOpsContent {
  guide: DevOpsGuideContent;
  console: DevOpsConsoleContent;
  hosts: {
    title: string;
    intro: string;
    labels: { reach: string; stops: string; cost: string };
    items: DevOpsHost[];
  };
  scratch: { title: string; points: string[] };
  cli: { title: string; points: string[] };
  screeners: { title: string; intro: string; answers: DevOpsAnswer[] };
}

// The guide's questions and what each may be answered with.
export interface GuideAnswers {
  traffic: "steady" | "spiky" | "global";
  budget: "lean" | "balanced" | "generous";
  team: "solo" | "small" | "platform";
  latency: "realtime" | "web" | "batch";
}

export type GuideQuestion = keyof GuideAnswers;

// The layers of a product, each run where it fits best: real time or background jobs only where it serves them.
export type StackLayer = "edge" | "front" | "services" | "realtime" | "jobs" | "data";

// Why a host was picked for a layer.
export type PickReason = "edge" | "frontEdge" | "frontServers" | "cluster" | "managed" | "steady" | "small" | "regions" | "realtimeSteady"
  | "autoscale" | "workers" | "selfRun" | "managedData";

// What each of the site's universes runs, shipped by the console.
export type UniverseStack = "matrix" | "ai" | "chain" | "casino" | "mmo" | "beyond";

export interface DevOpsGuideContent {
  title: string;
  intro: string;
  questions: { [Q in GuideQuestion]: { label: string; options: Record<GuideAnswers[Q], string> } };
  layers: Record<StackLayer, string>;
  reasons: Record<PickReason, string>;
  result: string;
}

export interface DevOpsConsoleContent {
  title: string;
  intro: string;
  label: string;
  prompt: string;
  stacks: Record<UniverseStack, string>;
  deploy: string;
  deployAll: string;
  move: string;
  // "{stack}" and "{host}" are replaced.
  shipped: string;
  // "{stack}", "{from}" and "{to}" are replaced.
  moved: string;
  idle: string;
  // Each host's way to ship a stack, a line at a time: "{stack}" is the stack's name, "{slug}" its short name.
  steps: Record<HostId, string[]>;
  // A stack moved from one host to another: "{slug}", "{from}" and "{to}" are replaced.
  moveSteps: string[];
}
