// Writes the repository's growth, commit by commit, for the time-lapse in "How I use AI". Vercel builds do not
// carry the full git history, so the snapshot is made here and committed: run `npm run timelapse` after a big
// change to bring it up to date.
import { execFileSync } from "child_process";
import { writeFileSync } from "fs";

// Each district is a part of the codebase, drawn as one building; a path belongs to the first that matches.
const DISTRICTS = [
  ["components", ["src/components/"]],
  ["packages", ["src/packages/"]],
  ["content", ["src/data/"]],
  ["tests", ["__tests__/"]],
  ["services", ["src/services/"]],
  ["types", ["types/"]],
  ["config", ["src/config/"]],
  ["hooks", ["src/hooks/"]],
  ["pages", ["src/pages/", "src/layouts/"]],
  ["styles", ["src/styles/"]],
  ["agents", [".claude/", ".agents/", "scripts/"]],
];

const OUTPUT = "src/data/timelapse/history.json";

const districtOf = (path) => DISTRICTS.findIndex(([, prefixes]) => prefixes.some((prefix) => path.startsWith(prefix)));

// Renames off, so a moved file leaves one district and joins another with its whole line count.
const log = execFileSync("git", ["log", "--reverse", "--no-merges", "--no-renames", "--date=short", "--format=@@%ad", "--numstat", "HEAD"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

const lines = DISTRICTS.map(() => 0);
const frames = [];

log.split("@@").filter(Boolean).forEach((entry) => {
  const [date, ...changes] = entry.trim().split("\n");

  changes.forEach((change) => {
    const [added, deleted, path] = change.split("\t");
    const district = path === undefined ? -1 : districtOf(path);

    // Binary files report "-" and have no lines to count.
    if (district >= 0 && added !== "-") {
      lines[district] = Math.max(0, lines[district] + Number(added) - Number(deleted));
    }
  });

  frames.push({ date: date.trim(), lines: [...lines] });
});

writeFileSync(OUTPUT, `${JSON.stringify({ districts: DISTRICTS.map(([id]) => id), frames })}\n`);
process.stdout.write(`${OUTPUT}: ${frames.length} commits, ${lines.reduce((sum, value) => sum + value, 0)} lines today\n`);
