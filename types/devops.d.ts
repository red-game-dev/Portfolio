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
