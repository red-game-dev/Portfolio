/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ALIASES = Object.entries((JSON.parse(fs.readFileSync(path.join(ROOT, "tsconfig.json"), "utf8")) as {
  compilerOptions: { paths: Record<string, string[]> };
}).compilerOptions.paths).map(([alias, [target]]) => [alias.replace("/*", "/"), target.replace("/*", "/")] as const);
const EXTENSIONS = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx", "/index.js"];

// What a module statically imports, as webpack would follow it: value imports, side effect imports and re-exports.
// Type only imports are erased, and an `import()` is a chunk of its own, loaded later, so neither counts.
const importsOf = (source: string): string[] => {
  const found: string[] = [];
  const patterns = [
    /^\s*import\s+(?!type\b)([\s\S]*?)\s+from\s+["']([^"']+)["']/gm,
    /^\s*export\s+(?!type\b)(?:\*(?:\s+as\s+\w+)?|\{[\s\S]*?\})\s+from\s+["']([^"']+)["']/gm,
    /^\s*import\s+\w+\s*=\s*require\(\s*["']([^"']+)["']\s*\)/gm,
    /^\s*import\s+["']([^"']+)["']/gm,
  ];

  patterns.forEach((pattern, index) => {
    for (const match of source.matchAll(pattern)) {
      const clause = index === 0 ? match[1] : "";
      const names = (clause.match(/\{([\s\S]*)\}/)?.[1] ?? "").split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      const hasDefault = clause.replace(/\{[\s\S]*\}/, "").replace(",", "")
        .trim() !== "";
      const isTypesOnly = index === 0 && !hasDefault && names.length > 0 && names.every((name) => name.startsWith("type "));

      if (!isTypesOnly) {
        found.push(match[index === 0 ? 2 : 1]);
      }
    }
  });

  return found;
};

// A module the page names, as a file, or null for a package. One of the site's own that cannot be found fails the walk
// rather than being skipped, so nothing slips past unread.
const resolve = (specifier: string, from: string): string | null => {
  const alias = ALIASES.find(([prefix]) => specifier.startsWith(prefix));
  const base = specifier.startsWith(".") ? path.resolve(path.dirname(from), specifier) : alias ? path.join(ROOT, alias[1], specifier.slice(alias[0].length)) : null;

  if (!base) {
    return null;
  }

  const file = EXTENSIONS.map((extension) => `${base}${extension}`).find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  // Declarations (types/*.d.ts) carry no code into the bundle.
  const isDeclaration = fs.existsSync(`${base}.d.ts`);

  if (!file && !isDeclaration && !/\.(css|scss|svg|png|jpg|webp)$/.test(specifier)) {
    throw new Error(`${path.relative(ROOT, from)} imports ${specifier}, which the walk cannot find`);
  }

  return file ?? null;
};

// Every module the page and the app shell carry before anything loads on demand, and every package they name.
const firstLoad = () => {
  const seen = new Set<string>();
  const externals = new Set<string>();
  const queue = ["src/pages/index.tsx", "src/pages/_app.tsx"].map((file) => path.join(ROOT, file));

  while (queue.length > 0) {
    const file = queue.pop() as string;

    if (seen.has(file)) {
      continue;
    }

    seen.add(file);
    importsOf(fs.readFileSync(file, "utf8")).forEach((specifier) => {
      const resolved = resolve(specifier, file);

      if (resolved) {
        queue.push(resolved);
      } else if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
        externals.add(specifier.startsWith("@") ? specifier.split("/").slice(0, 2)
.join("/") : specifier.split("/")[0]);
      }
    });
  }

  return { modules: [...seen].map((file) => path.relative(ROOT, file)), externals };
};

describe("the home page's first load", () => {
  test("carries no network client: the forms, Ask Red and the board load theirs on first use", () => {
    const { modules, externals } = firstLoad();

    expect(modules.length).toBeGreaterThan(50);
    expect(externals.has("fetchff")).toBe(false);
    expect(modules.filter((module) => module.startsWith("src/packages/http/"))).toEqual([]);
    expect(modules.filter((module) => module.includes("contact-site") || module === "src/services/contact/client.ts")).toEqual([]);
  });

  test("carries none of the email's look or its drawing, which only the server needs", () => {
    const { modules } = firstLoad();
    const serverOnly = [
      "src/packages/messaging/contact-email/",
      "src/packages/effects/pixel-reveal-raster/",
      "src/packages/graphics/gif/",
      "src/services/contact/art.ts",
      "src/data/email/",
    ];

    expect(modules.filter((module) => serverOnly.some((prefix) => module.startsWith(prefix)))).toEqual([]);
    // The portrait's reveal engine loads on demand, so a page that reaches it statically has pulled it in by mistake.
    expect(modules.filter((module) => module.startsWith("src/packages/effects/pixel-reveal/"))).toEqual([]);
  });

  test("carries no 3D: three.js, the stage, the hand and what builds it load only once the counter asks for them", () => {
    const { modules, externals } = firstLoad();
    const onDemand = [
      "src/packages/graphics/stage3d/",
      "src/packages/graphics/stage3d-three/",
      "src/packages/graphics/hand/",
      "src/packages/graphics/sdf/",
      "src/packages/graphics/checkout-stage/",
      "src/services/stage/",
    ];

    expect(externals.has("three")).toBe(false);
    expect(modules.filter((module) => onDemand.some((prefix) => module.startsWith(prefix)))).toEqual([]);
  });

  test("carries no till: the currencies and prices load with the payments counter", () => {
    const { modules } = firstLoad();

    expect(modules.filter((module) => module.startsWith("src/packages/finance/money/") || module.startsWith("src/services/payments/"))).toEqual([]);
  });
});
