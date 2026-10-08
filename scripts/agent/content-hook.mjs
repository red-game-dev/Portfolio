// After an edit to a content file, warn about copy that breaks the rules. Never blocks.
import { existsSync, readFileSync } from "fs";
import { relative } from "path";

import { readEvent, warn } from "./hook.mjs";
import { findViolations, isContentFile, readDenylist } from "./rules.mjs";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const event = await readEvent();
const path = event.tool_input?.file_path ?? event.tool_response?.filePath;

if (path && existsSync(path)) {
  const file = relative(root, path);

  if (isContentFile(file, root)) {
    warn("PostToolUse", `Copy rules, ${file}:`, findViolations(readFileSync(path, "utf8"), readDenylist(root)).slice(0, 10));
  }
}
