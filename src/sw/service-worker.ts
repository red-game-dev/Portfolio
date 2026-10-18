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

// When an answer was saved, stamped on it as it is kept, since a font host does not let its own date be read.
const SAVED_AT = "x-offline-saved";

// An answer as it is kept: the moment it was saved stamped on it.
export const stamped = (response: Response, now: number): Response => {
  const headers = new Headers(response.headers);

  headers.set(SAVED_AT, String(now));

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Whether a saved answer is old enough to refresh: one that says neither when it was saved nor when it was sent always is.
export const isStale = (response: Response, now: number, freshMs: number): boolean => {
  const saved = response.headers.get(SAVED_AT);
  const at = saved === null ? Date.parse(response.headers.get("date") ?? "") : Number(saved);

  return Number.isNaN(at) || now - at > freshMs;
};

export interface Store {
  match(request: Request | string): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
}

export type Fetcher = (request: Request) => Promise<Response>;

// What a strategy works with: where answers are kept, how they are fetched, how work goes on after the answer (the
// fetch event's waitUntil), and the time.
export interface Strategy {
  store: Store;
  fetcher: Fetcher;
  later: (work: Promise<unknown>) => void;
  now: number;
}

// Only a whole, successful answer the page can read is kept.
export const isKeepable = (response: Response): boolean => response.status === 200 && response.type !== "opaque";

// Saved behind the answer, never holding it up or failing it: a full store or a refused write only means it is not kept.
const keep = (strategy: Strategy, key: Request | string, response: Response): Response => {
  if (isKeepable(response)) {
    strategy.later(strategy.store.put(key, stamped(response.clone(), strategy.now)).catch(() => undefined));
  }

  return response;
};

// The saved copy, else the network's (then saved).
export const cacheFirst = async (request: Request, strategy: Strategy): Promise<Response> =>
  (await strategy.store.match(request)) ?? keep(strategy, request, await strategy.fetcher(request));

// The saved copy at once, refreshed from the network for next time once it is `freshMs` old; the network's when
// nothing is saved.
export const staleWhileRevalidate = async (request: Request, strategy: Strategy, freshMs: number): Promise<Response> => {
  const kept = await strategy.store.match(request);

  if (!kept) {
    return keep(strategy, request, await strategy.fetcher(request));
  }

  if (isStale(kept, strategy.now, freshMs)) {
    strategy.later(strategy.fetcher(request).then((response) => keep(strategy, request, response))
      .catch(() => undefined));
  }

  return kept;
};

// The network's answer (then saved under `key`), unless it is slower than `waitMs` or fails, when the saved copy is
// shown. With none saved, the network's answer whenever it comes, and only if it fails the fallback's.
export const networkFirst = async (
  request: Request, key: string, strategy: Strategy, waitMs: number, fallback: () => Promise<Response | undefined>,
): Promise<Response> => {
  const fresh = strategy.fetcher(request).then((response) => keep(strategy, key, response));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const waited = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), waitMs);
  });

  // Kept alive past a saved copy shown first, so a late answer is still saved; a late failure is no one's to hear.
  strategy.later(fresh.catch(() => undefined));

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

  const saved = await strategy.store.match(key);

  if (saved) {
    return saved;
  }

  return fresh.catch(async (error: unknown) => {
    const instead = await fallback();

    if (instead) {
      return instead;
    }

    throw error;
  });
};

// The parts of the Cache API a store needs, so a store can be made over a fake one in tests.
export interface CacheLike {
  match(request: Request | string, options?: CacheQueryOptions): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
}

export interface CachesLike {
  open(name: string): Promise<CacheLike>;
  match(request: Request | string, options?: CacheQueryOptions): Promise<Response | undefined>;
}

// A store over one named cache. Reads look in it first, then in every other (the deploy before's files too); writes go
// to it, then `afterPut` runs. The build's files are matched without their query, since their names already say which
// build they are, and one found only in another deploy's cache (a chunk no change touched) is copied into this one, so
// it outlives that deploy's files.
export const cacheStore = (storage: CachesLike, name: string, isBuild: boolean, afterPut?: () => Promise<void>): Store => {
  const options: CacheQueryOptions = { ignoreVary: true, ignoreSearch: isBuild };

  return {
    match: async (request) => {
      const own = await storage.open(name);
      const kept = await own.match(request, options);

      if (kept) {
        return kept;
      }

      const elsewhere = await storage.match(request, options);

      if (elsewhere && isBuild) {
        await own.put(request, elsewhere.clone()).catch(() => undefined);
      }

      return elsewhere;
    },
    put: async (request, response) => {
      await (await storage.open(name)).put(request, response);
      await afterPut?.();
    },
  };
};

// Google's font stylesheet is asked for without CORS, which would come back opaque and could not be kept: it is asked
// for again with CORS, which Google's font hosts allow.
export const readable = (request: Request): Request =>
  (request.mode === "no-cors" && FONT_HOSTS.has(new URL(request.url).hostname) ? new Request(request.url, { mode: "cors", credentials: "omit" }) : request);

// The subsets of Google's fonts the site's words are written in, saved ahead with the stylesheet that names them.
const FONT_SUBSETS: ReadonlySet<string> = new Set(["latin", "latin-ext"]);

// The font files Google's stylesheet names for those subsets, once each. On a first visit the fonts load before the
// worker is there and leave no trace the page can name, so the worker reads them from the stylesheet it saved.
export const fontFilesIn = (css: string): string[] => [...new Set([...css.matchAll(/\/\* ([a-z-]+) \*\/\s*@font-face\s*\{([^}]*)\}/g)]
  .filter(([, subset]) => FONT_SUBSETS.has(subset))
  .map(([, , body]) => /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(body)?.[1])
  .filter((url): url is string => url !== undefined))];

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
  // A trim of the pictures kept, every so many saved, so the cache never grows far past MEDIA_MOST between deploys.
  const TRIM_EVERY = 40;
  let mediaSaved = 0;

  const trim = async (name: string, most: number) => {
    const cache = await caches.open(name);
    const keys = await cache.keys();

    await Promise.all(keys.slice(0, Math.max(0, keys.length - most)).map((key) => cache.delete(key)));
  };

  const trimMedia = async () => {
    mediaSaved += 1;

    if (mediaSaved % TRIM_EVERY === 0) {
      await trim(names.media, MEDIA_MOST);
    }
  };

  const storeOf = (name: string): Store => cacheStore(caches, name, name === names.build, name === names.media ? trimMedia : undefined);

  const strategyFor = (name: string, event: Extendable): Strategy => ({
    store: storeOf(name),
    fetcher,
    later: (work) => event.waitUntil(work),
    now: Date.now(),
  });

  const cacheFor = (route: Route | null): string | null => {
    if (route === "build") {
      return names.build;
    }

    return route === "media" ? names.media : route === "heavy" ? names.heavy : null;
  };

  // What a browser asks for when it shows a picture, so a picture saved ahead is the format the page would be given.
  const PICTURE_ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
  const askedLikeThePage = (url: URL) =>
    new Request(url.href, url.pathname.startsWith("/_next/image") ? { headers: { accept: PICTURE_ACCEPT } } : {});

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

        const saved = name ? await storeOf(name).match(url.href) : undefined;
        const response = name && !saved ? await fetcher(askedLikeThePage(url)) : saved;

        if (name && response && !saved && isKeepable(response)) {
          await (await caches.open(name)).put(url.href, stamped(response.clone(), Date.now()));
        }

        if (url.hostname === "fonts.googleapis.com" && response && isKeepable(response)) {
          queue.push(...fontFilesIn(await response.text()));
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
      event.respondWith(networkFirst(request, pageKey(url), strategyFor(names.pages, event), PAGE_WAIT_MS, () => storeOf(names.pages).match("/")));
    } else if (route === "download") {
      event.respondWith(networkFirst(request, url.pathname, strategyFor(names.heavy, event), PAGE_WAIT_MS, () => Promise.resolve(undefined)));
    } else if (route === "build") {
      event.respondWith(cacheFirst(request, strategyFor(names.build, event)));
    } else {
      event.respondWith(staleWhileRevalidate(request, strategyFor(route === "heavy" ? names.heavy : names.media, event), FRESH_MS));
    }
  });
}
