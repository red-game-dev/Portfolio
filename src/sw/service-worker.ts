// The site's offline copy, kept by a service worker. Built into public/sw.js by scripts/build-sw.mjs before each build,
// with the deploy stamped in (VERSION), so every deploy is taken up as an update. It is one file with no imports: the
// pure parts above the wiring are tested.
//
// What it keeps, and how:
// - pages (the home page, the résumé, the accessibility statement): the network first, the saved copy after a short
//   wait or with no connection; a page never saved opens as the home page;
// - the build's scripts, styles and fonts: kept for good under their hashed names, the pages' own on install, the rest
//   of the build's list once the page says it has loaded (all but the largest, which are kept once used);
// - pictures and fonts: the saved copy at once, refreshed in the background at most once a day;
// - the heavy parts (3D models, the voyage's maps): kept once opened, the same way; the CVs once opened, the network's
//   copy first while there is one, so a new CV is never hidden behind an old one;
// - the site's own APIs (Ask Red, messages, the daily board), Vercel's analytics and other sites: never kept.
// A new deploy keeps the previous one's files beside its own, so a page still open on it never misses a script.

export const VERSION = "__OFFLINE_VERSION__";

// The pages kept on install, as the site writes them (with their trailing slash).
export const PAGES = ["/", "/resume/", "/accessibility/"] as const;

// The build's list of its scripts, styles and fonts, written by the build (next.config.js).
export const PRECACHE_LIST = "/_next/static/offline/precache.json";

// How long a page waits for the network before the saved copy is shown instead.
export const PAGE_WAIT_MS = 3500;

// How long a saved picture, font or model goes before it is refreshed in the background.
export const FRESH_MS = 24 * 60 * 60 * 1000;

// The most pictures and fonts kept; the oldest go first.
export const MEDIA_MOST = 400;

// How many deploys' files are kept: this one and the one before.
export const VERSIONS_KEPT = 2;

const PREFIX = "offline";

export const cacheNames = (version: string) => ({
  pages: `${PREFIX}-pages-${version}`,
  build: `${PREFIX}-build-${version}`,
  media: `${PREFIX}-media`,
  heavy: `${PREFIX}-heavy`,
  meta: `${PREFIX}-meta`,
});

// Where the deploys kept are listed, newest first.
const VERSIONS_KEY = "/__offline/versions";

// page: network first, saved under the page; build: saved for good; media and heavy: the saved copy, refreshed;
// download: network first, saved; network: never saved.
export type Route = "page" | "build" | "media" | "heavy" | "download" | "network";

export const FONT_HOSTS: ReadonlySet<string> = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

// How a request is answered, or null to leave it to the browser.
export const routeOf = (url: URL, request: Pick<Request, "method" | "mode" | "headers">, origin: string): Route | null => {
  if (request.method !== "GET" || request.headers.has("range")) {
    return null;
  }

  if (FONT_HOSTS.has(url.hostname)) {
    return "media";
  }

  if (url.origin !== origin || url.pathname.startsWith("/_vercel/")) {
    return null;
  }

  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") {
    return "network";
  }

  if (url.pathname.startsWith("/cv/")) {
    return "download";
  }

  if (url.pathname.startsWith("/models/") || url.pathname.startsWith("/images/voyage/")) {
    return "heavy";
  }

  if (request.mode === "navigate") {
    return "page";
  }

  return url.pathname.startsWith("/_next/static/") ? "build" : "media";
};

// The address a page is kept under: its path with the trailing slash the site uses, without its query (a ?view= link
// opens the same page).
export const pageKey = (url: URL): string => (url.pathname.endsWith("/") || /\.[a-z0-9]+$/i.test(url.pathname) ? url.pathname : `${url.pathname}/`);

// The build's files a page names: its scripts, styles and fonts under /_next/static/.
export const assetsIn = (html: string): string[] => [...new Set(html.match(/\/_next\/static\/[^"'\s)<>\\]+/g) ?? [])];

// The deploys to keep after this one takes over: this one first, then the one before.
export const versionsKept = (current: string, known: readonly string[]): string[] =>
  [current, ...known.filter((version) => version !== current)].slice(0, VERSIONS_KEPT);

// The caches to delete once the kept deploys are known: another deploy's pages and build files.
export const cachesToDelete = (names: readonly string[], kept: readonly string[]): string[] => names.filter((name) => {
  const deploy = /^offline-(?:pages|build)-(.+)$/.exec(name)?.[1];

  return deploy !== undefined && !kept.includes(deploy);
});

// Whether a saved answer is old enough to refresh: one that does not say when it was sent always is.
export const isStale = (response: Response, now: number, freshMs: number): boolean => {
  const sent = Date.parse(response.headers.get("date") ?? "");

  return Number.isNaN(sent) || now - sent > freshMs;
};

export interface Store {
  match(request: Request | string): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
}

export type Fetcher = (request: Request) => Promise<Response>;

// Only a whole, successful answer the page can read is kept.
export const isKeepable = (response: Response): boolean => response.status === 200 && response.type !== "opaque";

const keep = async (store: Store, key: Request | string, response: Response): Promise<Response> => {
  if (isKeepable(response)) {
    await store.put(key, response.clone());
  }

  return response;
};

// The saved copy, else the network's (then saved).
export const cacheFirst = async (request: Request, store: Store, fetcher: Fetcher): Promise<Response> =>
  (await store.match(request)) ?? keep(store, request, await fetcher(request));

// The saved copy at once, refreshed from the network for next time once it is `freshMs` old; the network's when
// nothing is saved.
export const staleWhileRevalidate = async (
  request: Request, store: Store, fetcher: Fetcher, later: (work: Promise<unknown>) => void, now: number, freshMs: number,
): Promise<Response> => {
  const kept = await store.match(request);

  if (!kept) {
    return keep(store, request, await fetcher(request));
  }

  if (isStale(kept, now, freshMs)) {
    later(fetcher(request).then((response) => keep(store, request, response))
      .catch(() => undefined));
  }

  return kept;
};

// The network's answer (then saved under `key`) unless it fails or is slower than `waitMs`, when the saved copy, or
// the fallback's, is shown; with neither, the network's answer whenever it comes.
export const networkFirst = async (
  request: Request, key: string, store: Store, fetcher: Fetcher, waitMs: number, fallback: () => Promise<Response | undefined>,
): Promise<Response> => {
  const fresh = fetcher(request).then((response) => keep(store, key, response));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const waited = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), waitMs);
  });

  // A late failure, after the saved copy was shown, is no one's to hear.
  fresh.catch(() => undefined);

  try {
    const first = await Promise.race([fresh, waited]);

    if (first) {
      return first;
    }
  } catch {
    // No connection: the saved copy below.
  } finally {
    clearTimeout(timer);
  }

  return (await store.match(key)) ?? (await fallback()) ?? fresh;
};

// Google's font stylesheet is asked for without CORS, which would come back opaque and could not be kept: it is asked
// for again with CORS, which Google's font hosts allow.
export const readable = (request: Request): Request =>
  (request.mode === "no-cors" && FONT_HOSTS.has(new URL(request.url).hostname) ? new Request(request.url, { mode: "cors", credentials: "omit" }) : request);

// What the page asks the worker to save once it has loaded: what it fetched before the worker could see it, and, unless
// the connection asks to save data, the rest of the build.
export interface WarmMessage {
  type: "warm";
  urls: string[];
  isFull: boolean;
}

export const isWarmMessage = (value: unknown): value is WarmMessage => typeof value === "object" && value !== null &&
  (value as WarmMessage).type === "warm" && Array.isArray((value as WarmMessage).urls) && typeof (value as WarmMessage).isFull === "boolean";

// Below here, the worker itself: wired only where it runs as one.

interface Extendable extends Event {
  waitUntil(work: Promise<unknown>): void;
}

interface Fetching extends Extendable {
  request: Request;
  respondWith(response: Promise<Response>): void;
}

interface Messaged extends Extendable {
  data: unknown;
}

interface WorkerScope {
  location: Location;
  clients: { claim(): Promise<void> };
  skipWaiting(): Promise<void>;
  addEventListener(type: "install" | "activate", listener: (event: Extendable) => void): void;
  addEventListener(type: "fetch", listener: (event: Fetching) => void): void;
  addEventListener(type: "message", listener: (event: Messaged) => void): void;
}

const isWorker = typeof self !== "undefined" && typeof (self as unknown as { registration?: unknown }).registration === "object" &&
  typeof (self as unknown as { document?: unknown }).document === "undefined";

if (isWorker) {
  const scope = self as unknown as WorkerScope;
  const names = cacheNames(VERSION);
  const { origin } = scope.location;
  const fetcher: Fetcher = (request) => fetch(readable(request));

  // Reads look in this deploy's cache first, then in every other (the deploy before's files too); writes go to this
  // deploy's.
  const storeOf = (name: string): Store => ({
    match: async (request) => (await (await caches.open(name)).match(request, { ignoreVary: true })) ?? caches.match(request, { ignoreVary: true }),
    put: async (request, response) => {
      await (await caches.open(name)).put(request, response);
    },
  });

  const cacheFor = (route: Route | null): string | null => {
    if (route === "build") {
      return names.build;
    }

    return route === "media" ? names.media : route === "heavy" ? names.heavy : null;
  };

  const trim = async (name: string, most: number) => {
    const cache = await caches.open(name);
    const keys = await cache.keys();

    await Promise.all(keys.slice(0, Math.max(0, keys.length - most)).map((key) => cache.delete(key)));
  };

  // A list of addresses saved where each belongs, any already saved left alone, a few at a time.
  const warm = async (urls: readonly string[]) => {
    const queue = [...new Set(urls)];
    const next = async (): Promise<void> => {
      const address = queue.shift();

      if (address === undefined) {
        return;
      }

      try {
        const url = new URL(address, origin);
        const name = cacheFor(routeOf(url, new Request(url.href), origin));

        if (name && !await caches.match(url.href, { ignoreVary: true })) {
          await keep(storeOf(name), url.href, await fetcher(new Request(url.href)));
        }
      } catch {
        // Not saved now; saved when it is next used.
      }

      await next();
    };

    await Promise.all([next(), next(), next(), next()]);
    await trim(names.media, MEDIA_MOST);
  };

  // On install: the pages, and the scripts, styles and fonts they name, so the site opens with no connection.
  scope.addEventListener("install", (event) => {
    event.waitUntil((async () => {
      const pages = await caches.open(names.pages);
      const build = await caches.open(names.build);
      const htmls = await Promise.all(PAGES.map(async (path) => {
        const response = await fetch(path, { cache: "reload" });

        if (!isKeepable(response)) {
          return "";
        }

        await pages.put(path, response.clone());

        return response.text();
      }));

      await Promise.all(htmls.flatMap(assetsIn).map((asset) => build.add(asset).catch(() => undefined)));
      await scope.skipWaiting();
    })());
  });

  // On taking over: this deploy and the one before are kept, any older one's files given back.
  scope.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
      const meta = await caches.open(names.meta);
      const listed = await meta.match(VERSIONS_KEY);
      const known = listed ? await listed.json() as unknown : [];
      const kept = versionsKept(VERSION, Array.isArray(known) ? known.filter((name): name is string => typeof name === "string") : []);

      await meta.put(VERSIONS_KEY, new Response(JSON.stringify(kept), { headers: { "content-type": "application/json" } }));
      await Promise.all(cachesToDelete(await caches.keys(), kept).map((name) => caches.delete(name)));
      await scope.clients.claim();
    })());
  });

  // The page, once loaded and in this worker's hands, names what it fetched before; the rest of the build comes with it.
  scope.addEventListener("message", (event) => {
    if (!isWarmMessage(event.data)) {
      return;
    }

    const { urls, isFull } = event.data;

    event.waitUntil((async () => {
      const listed: { files?: unknown } = isFull
        ? await fetch(PRECACHE_LIST, { cache: "no-store" })
          .then(async (response) => (response.ok ? await response.json() as { files?: unknown } : {}))
          .catch(() => ({}))
        : {};
      const files = Array.isArray(listed.files) ? listed.files.filter((file: unknown): file is string => typeof file === "string") : [];

      await warm([...urls.filter((url) => typeof url === "string"), ...files]);
    })());
  });

  scope.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const route = routeOf(url, request, origin);

    if (route === null || route === "network") {
      return;
    }

    if (route === "page") {
      event.respondWith(networkFirst(request, pageKey(url), storeOf(names.pages), fetcher, PAGE_WAIT_MS, () => storeOf(names.pages).match("/")));
    } else if (route === "download") {
      event.respondWith(networkFirst(request, url.pathname, storeOf(names.heavy), fetcher, PAGE_WAIT_MS, () => Promise.resolve(undefined)));
    } else if (route === "build") {
      event.respondWith(cacheFirst(request, storeOf(names.build), fetcher));
    } else {
      const name = route === "heavy" ? names.heavy : names.media;

      event.respondWith(staleWhileRevalidate(request, storeOf(name), fetcher, (work) => event.waitUntil(work), Date.now(), FRESH_MS));
    }
  });
}
