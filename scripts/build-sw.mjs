// Builds the service worker that keeps the site's offline copy (src/sw/service-worker.ts) into public/sw.js, which
// npm runs before every build (prebuild). The deploy is stamped in, so every deploy is a new worker the browser takes
// up, and the file is written fresh each time, so it is never committed.
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

import ts from "typescript";

const SOURCE = "src/sw/service-worker.ts";
const OUTPUT = "public/sw.js";
const STAMP = "__OFFLINE_VERSION__";

// Vercel names each deploy; elsewhere the commit, and with no git a moment, so a build is always told apart.
const gitHead = () => {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const version = (process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || gitHead() || Date.now().toString(36))
  .replace(/[^a-zA-Z0-9_-]/g, "");

const source = readFileSync(SOURCE, "utf8");

if (!source.includes(STAMP)) {
  throw new Error(`${SOURCE} has lost its ${STAMP} stamp`);
}

const { outputText, diagnostics } = ts.transpileModule(source, {
  fileName: SOURCE,
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, removeComments: true, strict: true },
});

if (diagnostics?.length) {
  throw new Error(ts.formatDiagnostics(diagnostics, { getCanonicalFileName: (name) => name, getCurrentDirectory: () => "", getNewLine: () => "\n" }));
}

// A classic worker script, which every browser that runs service workers can load: the module's exports stay inside.
const body = outputText.replace(/^"use strict";\n/, "").replaceAll(STAMP, version);
const script = `/* The site's offline copy, built from ${SOURCE}. */\n(() => {\n"use strict";\nvar exports = {};\n${body}})();\n`;

writeFileSync(OUTPUT, script);
console.log(`Service worker ${version} written to ${OUTPUT}`);
