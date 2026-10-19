import { fill } from "@/packages/text/format";
import { DevOpsConsoleContent, DevOpsHost, GuideAnswers, GuideQuestion, HostId, PickReason, StackLayer, UniverseStack } from "@/types/devops";

export interface HostPick {
  layer: StackLayer;
  host: HostId;
  reason: PickReason;
}

export type HostPlan = readonly HostPick[];

// The answers each of the guide's questions takes, in the order they are offered.
export const GUIDE_OPTIONS: { readonly [Q in GuideQuestion]: ReadonlyArray<GuideAnswers[Q]> } = {
  traffic: ["steady", "spiky", "global"],
  budget: ["lean", "balanced", "generous"],
  team: ["solo", "small", "platform"],
  latency: ["realtime", "web", "batch"],
};

// How I start a product before I know more: steady load, a lean budget, a small team, real time. Most of mine
// began that way, from scratch on servers.
export const DEFAULT_GUIDE_ANSWERS: GuideAnswers = { traffic: "steady", budget: "lean", team: "small", latency: "realtime" };

const servicesPick = ({ traffic, budget, team }: GuideAnswers): Pick<HostPick, "host" | "reason"> => {
  if (team === "platform" && budget !== "lean") {
    return { host: "gcp", reason: "cluster" };
  }

  if (traffic !== "steady" && budget !== "lean") {
    return { host: "aws", reason: "managed" };
  }

  if (traffic === "steady") {
    return { host: "dedicated", reason: "steady" };
  }

  return team === "solo" ? { host: "railway", reason: "small" } : { host: "digitalocean", reason: "regions" };
};

// Where each part of a product runs, from four answers about it, the way I choose: Cloudflare in front of
// everything, the front end at the edge unless steady traffic on a lean budget makes the servers cheaper, the
// services on a cluster only where a platform team and many markets pay for it, managed cloud where spikes and
// the team's time cost more than the bill, servers where the load is steady, and the data beside the services
// unless the budget or the cloud they are on makes managed data the better buy.
export const recommendHosts = (answers: GuideAnswers): HostPlan => {
  const { traffic, budget, latency } = answers;
  const services = servicesPick(answers);
  const plan: HostPick[] = [
    { layer: "edge", host: "cloudflare", reason: "edge" },
    traffic === "steady" && budget === "lean" ? { layer: "front", host: "dedicated", reason: "frontServers" } : { layer: "front", host: "vercel", reason: "frontEdge" },
    { layer: "services", ...services },
  ];

  if (latency === "realtime") {
    plan.push(traffic === "steady" || budget === "lean"
      ? { layer: "realtime", host: "dedicated", reason: "realtimeSteady" }
      : { layer: "realtime", host: "aws", reason: "autoscale" });
  } else if (latency === "batch") {
    plan.push({ layer: "jobs", host: "railway", reason: "workers" });
  }

  plan.push(budget === "generous" || services.host === "aws"
    ? { layer: "data", host: "aws", reason: "managedData" }
    : { layer: "data", host: services.host === "digitalocean" ? "digitalocean" : "dedicated", reason: "selfRun" });

  return plan;
};

// The part of a product each universe's stack is: the site is a front end, the game and the tables real time,
// the daily board data. A plan with no real time puts those with the services.
export const STACK_LAYERS: Readonly<Record<UniverseStack, StackLayer>> = {
  matrix: "front",
  ai: "services",
  chain: "services",
  casino: "realtime",
  mmo: "realtime",
  beyond: "data",
};

export const UNIVERSE_STACKS: readonly UniverseStack[] = ["matrix", "ai", "chain", "casino", "mmo", "beyond"];

export const hostFor = (plan: HostPlan, stack: UniverseStack): HostId => {
  const layer = STACK_LAYERS[stack];
  const pick = plan.find((entry) => entry.layer === layer) ?? plan.find((entry) => entry.layer === "services");

  return pick?.host ?? "dedicated";
};

// Where a stack of each layer can be moved to, in the order a move tries them: the point of building it the way I
// do is that none of them is the last.
const MOVES: Readonly<Record<StackLayer, readonly HostId[]>> = {
  edge: ["cloudflare"],
  front: ["vercel", "dedicated", "digitalocean", "cloudflare"],
  services: ["dedicated", "digitalocean", "aws", "gcp", "railway"],
  realtime: ["dedicated", "aws", "gcp"],
  jobs: ["railway", "dedicated", "aws"],
  data: ["dedicated", "aws", "digitalocean"],
};

// The next host a stack moves to from where it runs now (the first, from a host its layer does not list).
export const nextHost = (stack: UniverseStack, current: HostId): HostId => {
  const hosts = MOVES[STACK_LAYERS[stack]];

  return hosts[(hosts.indexOf(current) + 1) % hosts.length];
};

// The short names the console's commands use.
const STACK_SLUGS: Readonly<Record<UniverseStack, string>> = { matrix: "site", ai: "ask", chain: "exchange", casino: "tables", mmo: "game", beyond: "board" };
const HOST_SLUGS: Readonly<Record<HostId, string>> = {
  dedicated: "metal",
  digitalocean: "do",
  aws: "aws",
  gcp: "gke",
  vercel: "vercel",
  railway: "railway",
  cloudflare: "cloudflare",
};

export const stackSlug = (stack: UniverseStack) => STACK_SLUGS[stack];

export const hostSlug = (host: HostId) => HOST_SLUGS[host];

// The host a short name stands for, from its slug or its id, for the terminal.
export const hostOfName = (name: string): HostId | null => {
  const wanted = name.trim().toLowerCase();
  const found = Object.entries(HOST_SLUGS).find(([id, slug]) => id === wanted || slug === wanted);

  return found && isHostId(found[0]) ? found[0] : null;
};

export const stackOfName = (name: string): UniverseStack | null => {
  const wanted = name.trim().toLowerCase();

  return UNIVERSE_STACKS.find((stack) => stack === wanted || STACK_SLUGS[stack] === wanted) ?? null;
};

const isHostId = (value: string): value is HostId => Object.prototype.hasOwnProperty.call(HOST_SLUGS, value);

export const hostName = (hosts: readonly DevOpsHost[], host: HostId) => hosts.find((entry) => entry.id === host)?.name ?? host;

// What the console prints as a stack ships to a host, one line at a time.
export const deployScript = (content: DevOpsConsoleContent, stack: UniverseStack, host: HostId): string[] =>
  content.steps[host].map((step) => fill(step, { stack: content.stacks[stack], slug: STACK_SLUGS[stack] }));

// What it prints as a stack moves from one host to another with no downtime.
export const moveScript = (content: DevOpsConsoleContent, stack: UniverseStack, from: HostId, to: HostId): string[] =>
  content.moveSteps.map((step) => fill(step, { slug: STACK_SLUGS[stack], from: HOST_SLUGS[from], to: HOST_SLUGS[to] }));
