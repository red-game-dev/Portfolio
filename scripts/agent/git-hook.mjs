// Before a commit or a push, warn about what the repo's rules forbid. Never blocks: the person decides.
import { execFileSync } from "child_process";

import { readEvent, warn } from "./hook.mjs";
import { findSecrets, findViolations, isContentFile, isEnvFile, readDenylist } from "./rules.mjs";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const run = (command, args) => {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
};

const event = await readEvent();
const command = event.tool_input?.command ?? "";
const denylist = readDenylist(root);

// The lines a commit adds (to content files for the copy rules, to any file for secrets), any new env file it
// stages, and the message it is written with.
const commitWarnings = () => {
  const sections = run("git", ["diff", "--cached", "--unified=0", "--", "."]).split(/^diff --git /m);
  const addedIn = (keep) => sections
    .filter((section) => keep(section.split(" b/")[1]?.split("\n")[0] ?? ""))
    .flatMap((section) => section.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++")).map((line) => line.slice(1)));
  const added = addedIn((path) => isContentFile(path, root));
  const envFiles = run("git", ["diff", "--cached", "--name-only", "--diff-filter=A"]).split("\n").filter((path) => path && isEnvFile(path));

  return [
    ...envFiles.map((path) => `${path} is staged: keys belong in Vercel's environment, never in this public repo`),
    ...(findSecrets(addedIn(() => true).join("\n")).length > 0 ? ["the staged changes hold something shaped like a secret key"] : []),
    ...findViolations(added.join("\n"), denylist).map((issue) => `staged content, ${issue.replace(/^line \d+: /, "")}`),
    ...(command.includes("\u2014") ? ["the commit message has an em dash"] : []),
    ...(/Co-Authored-By:/i.test(command) ? ["the commit message has a Co-Authored-By trailer, which this repo leaves out"] : []),
  ];
};

const isAncestor = (head) => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", `origin/${head}`, "HEAD"], { cwd: root, stdio: "ignore" });

    return true;
  } catch {
    return false;
  }
};

// A branch that carries another open pull request's commits makes two reviews of the same work.
const pushWarnings = () => {
  const current = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  const heads = run("gh", ["pr", "list", "--state", "open", "--json", "number,headRefName", "--jq", ".[] | \"\\(.number) \\(.headRefName)\""])
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split(" "))
    .filter(([, head]) => head && head !== current);

  return heads
    .filter(([, head]) => isAncestor(head))
    .map(([number, head]) => `this branch carries the commits of open PR #${number} (${head}); push and open it after that one merges, or base it on main`);
};

if (/\bgit\s+commit\b/.test(command)) {
  warn("PreToolUse", "Before this commit:", commitWarnings());
} else if (/\bgit\s+push\b/.test(command)) {
  warn("PreToolUse", "Before this push:", pushWarnings());
}
