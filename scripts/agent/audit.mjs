// Every content file checked against the copy rules, for the audit-copy command. Prints one line per violation
// and exits 1 if there are any.
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

import { findViolations, isContentFile, readDenylist } from "./rules.mjs";

const root = process.cwd();
const denylist = readDenylist(root);
const SKIP = new Set(["node_modules", ".next", ".git", ".agents", ".vercel", ".playwright-mcp"]);

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);

  if (SKIP.has(name)) {
    return [];
  }

  return statSync(path).isDirectory() ? walk(path) : [relative(root, path)];
});

const issues = walk(root)
  .filter((file) => isContentFile(file, root))
  .flatMap((file) => findViolations(readFileSync(join(root, file), "utf8"), denylist).map((issue) => `${file}: ${issue}`));

process.stdout.write(issues.length ? `${issues.join("\n")}\n` : "No copy rule violations.\n");
process.exitCode = issues.length ? 1 : 0;
