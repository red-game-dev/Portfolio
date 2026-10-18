/**
 * @jest-environment node
 */
import {
  assetsIn, cacheFirst, cachesToDelete, cacheNames, Fetcher, isKeepable, isStale, isWarmMessage, networkFirst, pageKey, readable, routeOf,
  stamped, staleWhileRevalidate, Store, Strategy, versionsKept,
} from "@/sw/service-worker";

const ORIGIN = "https://www.redgame.dev";

const asked = (path: string, init: { mode?: RequestMode; method?: string; range?: boolean } = {}) => ({
  method: init.method ?? "GET",
  mode: init.mode ?? "cors",
  headers: new Headers(init.range ? { range: "bytes=0-100" } : {}),
});

const routeFor = (address: string, init?: Parameters<typeof asked>[1]) => routeOf(new URL(address, ORIGIN), asked(address, init), ORIGIN);

// A cache in memory, keyed by address as the Cache API keys them.
const memoryStore = (saved: Record<string, Response> = {}) => {
  const entries = new Map(Object.entries(saved).map(([key, response]) => [new URL(key, ORIGIN).href, response]));
  const keyOf = (request: Request | string) => new URL(typeof request === "string" ? request : request.url, ORIGIN).href;
  const store: Store & { entries: Map<string, Response> } = {
    entries,
    match: (request) => Promise.resolve(entries.get(keyOf(request))?.clone()),
    put: (request, response) => {
      entries.set(keyOf(request), response);

      return Promise.resolve();
    },
  };

  return store;
};

const answer = (body: string, headers: Record<string, string> = {}) => new Response(body, { status: 200, headers });
const page = (path: string) => new Request(new URL(path, ORIGIN));

describe("the offline copy's routes", () => {
  it("answers pages from the network first, the build's files from the copy, pictures and fonts from the copy refreshed", () => {
    expect(routeFor("/", { mode: "navigate" })).toBe("page");
    expect(routeFor("/resume/?view=recruiter", { mode: "navigate" })).toBe("page");
    expect(routeFor("/_next/static/chunks/main-abc.js")).toBe("build");
    expect(routeFor("/_next/static/css/abc.css")).toBe("build");
    expect(routeFor("/_next/image/?url=%2Fimages%2Fme.webp&w=640&q=75")).toBe("media");
    expect(routeFor("/images/projects/one.webp")).toBe("media");
    expect(routeFor("https://fonts.googleapis.com/css2?family=Roboto", { mode: "no-cors" })).toBe("media");
    expect(routeFor("https://fonts.gstatic.com/s/roboto/v1/a.woff2")).toBe("media");
  });

  it("keeps the heavy parts once opened, and the CVs once opened, fresh while there is a connection", () => {
    expect(routeFor("/models/customer/customer.glb")).toBe("heavy");
    expect(routeFor("/images/voyage/earth.webp")).toBe("heavy");
    expect(routeFor("/cv/redeemer-pace-cv.pdf")).toBe("download");
    expect(routeFor("/cv/redeemer-pace-cv.pdf", { mode: "navigate" })).toBe("download");
  });

  it("never keeps the site's own APIs, the worker itself, Vercel's analytics, other sites, a write or a part of a file", () => {
    expect(routeFor("/api/ask/", { method: "POST" })).toBeNull();
    expect(routeFor("/api/contact/")).toBe("network");
    expect(routeFor("/api/voyage/board/?day=2026-10-18")).toBe("network");
    expect(routeFor("/sw.js")).toBe("network");
    expect(routeFor("/_vercel/insights/script.js")).toBeNull();
    expect(routeFor("https://www.linkedin.com/in/someone")).toBeNull();
    expect(routeFor("/images/voyage/earth.webp", { range: true })).toBeNull();
  });

  it("keeps a page under its path with the trailing slash, whatever its query", () => {
    expect(pageKey(new URL("/?view=product", ORIGIN))).toBe("/");
    expect(pageKey(new URL("/resume", ORIGIN))).toBe("/resume/");
    expect(pageKey(new URL("/accessibility/?x=1", ORIGIN))).toBe("/accessibility/");
    expect(pageKey(new URL("/llms.txt", ORIGIN))).toBe("/llms.txt");
  });

  it("finds every script, style and font a page names, once each", () => {
    const html = '<link rel="preload" href="/_next/static/css/a1.css" as="style"/><link rel="stylesheet" href="/_next/static/css/a1.css"/>' +
      '<script src="/_next/static/chunks/webpack-9.js" defer=""></script><script src="/_next/static/b-id/_buildManifest.js"></script>' +
      '<img src="/_next/image/?url=%2Fimages%2Fme.webp&amp;w=64"/>';

    expect(assetsIn(html)).toEqual(["/_next/static/css/a1.css", "/_next/static/chunks/webpack-9.js", "/_next/static/b-id/_buildManifest.js"]);
  });
});

describe("the offline copy's deploys", () => {
  it("keeps this deploy and the one before, and gives back any older one's pages and files", () => {
    const kept = versionsKept("c", ["b", "a"]);

    expect(kept).toEqual(["c", "b"]);
    expect(versionsKept("c", ["c", "b"])).toEqual(["c", "b"]);
    expect(cachesToDelete([
      cacheNames("a").pages, cacheNames("a").build, cacheNames("b").build, cacheNames("c").pages, "offline-media", "offline-heavy", "offline-meta", "other",
    ], kept)).toEqual([cacheNames("a").pages, cacheNames("a").build]);
  });
});

describe("the offline copy's strategies", () => {
  const NOW = Date.parse("2026-10-18T12:00:00Z");
  const DAY = 24 * 60 * 60 * 1000;

  // A strategy over a store, with the work it leaves behind its answers gathered to wait on.
  const strategyOf = (store: Store, fetcher: Fetcher) => {
    const later: Array<Promise<unknown>> = [];
    const strategy: Strategy = { store, fetcher, later: (work) => later.push(work), now: NOW };

    return { strategy, settle: () => Promise.all(later) };
  };

  it("keeps only a whole answer the page can read", () => {
    expect(isKeepable(answer("ok"))).toBe(true);
    expect(isKeepable(new Response("", { status: 404 }))).toBe(false);
    expect(isKeepable(new Response(null, { status: 206 }))).toBe(false);
  });

  it("serves the build's files from the copy, fetching and keeping one it has not seen", async () => {
    const store = memoryStore({ "/_next/static/chunks/a.js": answer("kept") });
    const fetcher = jest.fn(() => Promise.resolve(answer("fetched")));
    const { strategy, settle } = strategyOf(store, fetcher);

    await expect((await cacheFirst(page("/_next/static/chunks/a.js"), strategy)).text()).resolves.toBe("kept");
    expect(fetcher).not.toHaveBeenCalled();
    await expect((await cacheFirst(page("/_next/static/chunks/b.js"), strategy)).text()).resolves.toBe("fetched");
    await settle();
    await expect((await store.match("/_next/static/chunks/b.js"))?.text()).resolves.toBe("fetched");
  });

  it("answers from the network even when saving fails, a full store only meaning it is not kept", async () => {
    const store = memoryStore();

    store.put = () => Promise.reject(new DOMException("full", "QuotaExceededError"));

    const { strategy, settle } = strategyOf(store, () => Promise.resolve(answer("fetched")));

    await expect((await cacheFirst(page("/_next/static/chunks/c.js"), strategy)).text()).resolves.toBe("fetched");
    await expect((await networkFirst(page("/"), "/", strategy, 1000, () => Promise.resolve(undefined))).text()).resolves.toBe("fetched");
    await expect(settle()).resolves.toBeDefined();
  });

  it("serves a saved picture at once, refreshing it behind only once it is a day old", async () => {
    const store = memoryStore({ "/images/a.webp": stamped(answer("fresh"), NOW - 1000), "/images/b.webp": stamped(answer("old"), NOW - 2 * DAY) });
    const fetcher = jest.fn(() => Promise.resolve(answer("new")));
    const { strategy, settle } = strategyOf(store, fetcher);

    await expect((await staleWhileRevalidate(page("/images/a.webp"), strategy, DAY)).text()).resolves.toBe("fresh");
    expect(fetcher).not.toHaveBeenCalled();

    await expect((await staleWhileRevalidate(page("/images/b.webp"), strategy, DAY)).text()).resolves.toBe("old");
    await settle();
    await settle();
    await expect((await store.match("/images/b.webp"))?.text()).resolves.toBe("new");
  });

  it("knows when a saved answer was kept from its own stamp, a font host's hidden date being no matter", () => {
    expect(isStale(stamped(answer("font"), NOW - 1000), NOW, DAY)).toBe(false);
    expect(isStale(answer("dated", { date: new Date(NOW - 1000).toUTCString() }), NOW, DAY)).toBe(false);
    expect(isStale(answer("no date"), NOW, DAY)).toBe(true);
  });

  it("fetches and keeps a picture not saved yet, and leaves a failure to the browser", async () => {
    const store = memoryStore();
    const kept = strategyOf(store, () => Promise.resolve(answer("c")));

    await expect((await staleWhileRevalidate(page("/images/c.webp"), kept.strategy, DAY)).text()).resolves.toBe("c");
    await kept.settle();
    expect(store.entries.size).toBe(1);

    const offline = strategyOf(store, () => Promise.reject(new TypeError("offline")));

    await expect(staleWhileRevalidate(page("/images/d.webp"), offline.strategy, DAY)).rejects.toThrow("offline");
  });

  it("shows a page from the network and keeps it under its key, the query left out", async () => {
    const store = memoryStore();
    const { strategy, settle } = strategyOf(store, () => Promise.resolve(answer("live")));
    const response = await networkFirst(page("/?view=product"), "/", strategy, 1000, () => Promise.resolve(undefined));

    await expect(response.text()).resolves.toBe("live");
    await settle();
    await expect((await store.match("/"))?.text()).resolves.toBe("live");
  });

  it("with no connection shows the saved page, else the home page, else lets the failure through", async () => {
    const store = memoryStore({ "/resume/": answer("saved résumé"), "/": answer("saved home") });
    const { strategy } = strategyOf(store, () => Promise.reject(new TypeError("Failed to fetch")));
    const home = () => store.match("/");

    await expect((await networkFirst(page("/resume/"), "/resume/", strategy, 1000, home)).text()).resolves.toBe("saved résumé");
    await expect((await networkFirst(page("/hud-lab/"), "/hud-lab/", strategy, 1000, home)).text()).resolves.toBe("saved home");

    const empty = strategyOf(memoryStore(), () => Promise.reject(new TypeError("Failed to fetch")));

    await expect(networkFirst(page("/x/"), "/x/", empty.strategy, 1000, () => Promise.resolve(undefined))).rejects.toThrow("Failed to fetch");
  });

  it("on a slow connection shows the saved page, keeping the late answer, and waits for a page never saved rather than show home", async () => {
    let arrive: (response: Response) => void = () => undefined;
    const slow = () => new Promise<Response>((resolve) => {
      arrive = resolve;
    });
    const store = memoryStore({ "/": answer("saved") });
    const { strategy, settle } = strategyOf(store, slow);

    await expect((await networkFirst(page("/"), "/", strategy, 10, () => Promise.resolve(undefined))).text()).resolves.toBe("saved");
    arrive(answer("late"));
    await settle();
    await settle();
    await expect((await store.match("/"))?.text()).resolves.toBe("late");

    const home = jest.fn(() => store.match("/"));
    const unsaved = networkFirst(page("/hud-lab/"), "/hud-lab/", strategyOf(store, slow).strategy, 10, home);

    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    arrive(answer("the lab"));
    await expect((await unsaved).text()).resolves.toBe("the lab");
    expect(home).not.toHaveBeenCalled();
  });

  it("asks Google's font stylesheet again with CORS, so it can be kept, and leaves every other request as it was", () => {
    const sheet = new Request("https://fonts.googleapis.com/css2?family=Roboto", { mode: "no-cors" });
    const picture = new Request(`${ORIGIN}/images/a.webp`, { mode: "no-cors" });

    expect(readable(sheet).mode).toBe("cors");
    expect(readable(sheet).credentials).toBe("omit");
    expect(readable(picture)).toBe(picture);
  });

  it("takes only a warm message of the right shape from the page", () => {
    expect(isWarmMessage({ type: "warm", urls: ["/a"], isFull: true })).toBe(true);
    expect(isWarmMessage({ type: "warm", urls: "/a", isFull: true })).toBe(false);
    expect(isWarmMessage({ type: "other" })).toBe(false);
    expect(isWarmMessage(null)).toBe(false);
  });
});
