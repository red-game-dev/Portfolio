import { portfolioData } from "@/data/resume";
import {
  DEFAULT_GUIDE_ANSWERS,
  deployScript,
  GUIDE_OPTIONS,
  hostFor,
  hostOfName,
  moveScript,
  nextHost,
  recommendHosts,
  stackOfName,
  UNIVERSE_STACKS,
} from "@/services/devops";
import { GuideAnswers } from "@/types/devops";

const { devops } = portfolioData;

const every = (): GuideAnswers[] => {
  const { traffic, budget, team, latency } = GUIDE_OPTIONS;

  return traffic.flatMap((t) => budget.flatMap((b) => team.flatMap((m) => latency.map((l) => ({ traffic: t, budget: b, team: m, latency: l })))));
};

describe("services/devops guide", () => {
  test("every answer puts Cloudflare in front, a front end, the services and the data somewhere, each layer once", () => {
    every().forEach((answers) => {
      const plan = recommendHosts(answers);
      const layers = plan.map(({ layer }) => layer);

      expect(plan[0]).toEqual({ layer: "edge", host: "cloudflare", reason: "edge" });
      expect(layers).toEqual(expect.arrayContaining(["front", "services", "data"]));
      expect(new Set(layers).size).toBe(layers.length);
      // Real time and background jobs only where the product serves them.
      expect(layers.includes("realtime")).toBe(answers.latency === "realtime");
      expect(layers.includes("jobs")).toBe(answers.latency === "batch");
    });
  });

  test("how I start a product, steady and lean, runs it from scratch on servers", () => {
    expect(recommendHosts(DEFAULT_GUIDE_ANSWERS).map(({ layer, host }) => [layer, host])).toEqual([
      ["edge", "cloudflare"],
      ["front", "dedicated"],
      ["services", "dedicated"],
      ["realtime", "dedicated"],
      ["data", "dedicated"],
    ]);
  });

  test("a cluster only where a platform team can pay for it, managed cloud where spikes cost more than the bill", () => {
    const pick = (answers: Partial<GuideAnswers>, layer: string) => recommendHosts({ ...DEFAULT_GUIDE_ANSWERS, ...answers }).find((entry) => entry.layer === layer)?.host;

    expect(pick({ team: "platform", budget: "balanced" }, "services")).toBe("gcp");
    expect(pick({ team: "platform", budget: "lean" }, "services")).toBe("dedicated");
    expect(pick({ traffic: "spiky", budget: "balanced" }, "services")).toBe("aws");
    expect(pick({ traffic: "spiky", budget: "balanced" }, "data")).toBe("aws");
    expect(pick({ traffic: "spiky", budget: "balanced" }, "realtime")).toBe("aws");
    expect(pick({ traffic: "spiky", team: "solo" }, "services")).toBe("railway");
    expect(pick({ traffic: "global", team: "small" }, "services")).toBe("digitalocean");
    expect(pick({ traffic: "global", team: "small" }, "data")).toBe("digitalocean");
    expect(pick({ traffic: "global" }, "front")).toBe("vercel");
  });

  test("every question offers exactly the answers it has words for", () => {
    (Object.keys(GUIDE_OPTIONS) as Array<keyof typeof GUIDE_OPTIONS>).forEach((question) => {
      expect([...GUIDE_OPTIONS[question]].sort()).toEqual(Object.keys(devops.guide.questions[question].options).sort());
    });
  });

  test("every reason the guide gives and every layer it names has words", () => {
    every().forEach((answers) => recommendHosts(answers).forEach(({ layer, reason, host }) => {
      expect(devops.guide.layers[layer]).toBeTruthy();
      expect(devops.guide.reasons[reason]).toBeTruthy();
      expect(devops.hosts.items.some(({ id }) => id === host)).toBe(true);
    }));
  });
});

describe("services/devops console", () => {
  test("each universe's stack ships where its layer runs, with the services standing in where there is no real time", () => {
    const plan = recommendHosts({ traffic: "spiky", budget: "balanced", team: "small", latency: "web" });

    expect(hostFor(plan, "matrix")).toBe("vercel");
    expect(hostFor(plan, "mmo")).toBe("aws");
    expect(hostFor(plan, "beyond")).toBe("aws");
  });

  test("a move always goes somewhere else, and round every host its layer can run on", () => {
    UNIVERSE_STACKS.forEach((stack) => {
      let host = hostFor(recommendHosts(DEFAULT_GUIDE_ANSWERS), stack);
      const seen = new Set([host]);

      for (let step = 0; step < 5; step += 1) {
        const next = nextHost(stack, host);

        expect(next).not.toBe(host);
        seen.add(next);
        host = next;
      }

      expect(seen.size).toBeGreaterThan(1);
    });
    // From a host its layer does not list, the first it does.
    expect(nextHost("matrix", "railway")).toBe("vercel");
  });

  test("the scripts fill every placeholder", () => {
    UNIVERSE_STACKS.forEach((stack) => devops.hosts.items.forEach(({ id }) => {
      deployScript(devops.console, stack, id).forEach((line) => expect(line).not.toMatch(/\{\w+\}/));
      moveScript(devops.console, stack, id, nextHost(stack, id)).forEach((line) => expect(line).not.toMatch(/\{\w+\}/));
    }));
  });

  test("the terminal reads hosts and stacks by their short names or ids", () => {
    expect(hostOfName("metal")).toBe("dedicated");
    expect(hostOfName("AWS")).toBe("aws");
    expect(hostOfName("gke")).toBe("gcp");
    expect(hostOfName("nowhere")).toBeNull();
    expect(stackOfName("game")).toBe("mmo");
    expect(stackOfName("chain")).toBe("chain");
    expect(stackOfName("toaster")).toBeNull();
  });
});
