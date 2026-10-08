// The copy rules every agent working on this repo is held to, in one place: the hooks warn with them and the
// content rules test fails on them. Plain ESM with no dependencies, so a hook runs it with bare node.
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const EM_DASH = "\u2014";
const EMOJI = /\p{Extended_Pictographic}/u;

// Names Red does not want on the site live in a gitignored file, one per line, so the rule never names them in
// this public repo. Matching is whole word and case sensitive.
export const DENYLIST_PATH = ".claude/private/denylist.txt";

export const readDenylist = (root) => {
  const path = join(root, DENYLIST_PATH);

  if (!existsSync(path)) {
    return [];
  }

  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
};

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Every rule a piece of text breaks, line by line, as short readable messages.
export const findViolations = (text, denylist = []) => {
  const names = denylist.map((name) => ({ name, pattern: new RegExp(`(^|[^\\w])${escape(name)}($|[^\\w])`) }));

  return text.split("\n").flatMap((line, index) => {
    const where = `line ${index + 1}`;

    return [
      ...(line.includes(EM_DASH) ? [`${where}: an em dash (use a comma, a full stop or a colon)`] : []),
      ...(EMOJI.test(line) ? [`${where}: an emoji`] : []),
      ...names.filter(({ pattern }) => pattern.test(line)).map(() => `${where}: a name on the private denylist`),
    ];
  });
};

// Skills installed from elsewhere (listed in skills-lock.json) are someone else's copy, kept as published.
const vendoredSkills = (root) => {
  try {
    return Object.keys(JSON.parse(readFileSync(join(root, "skills-lock.json"), "utf8")).skills ?? {});
  } catch {
    return [];
  }
};

// Where the copy rules apply: site content, the agent's prompt, and the docs agents read, but not vendored skills.
export const isContentFile = (path, root = process.cwd()) => /(^|\/)(src\/data\/|src\/services\/ask\/prompt\.ts$|CLAUDE\.md$|\.claude\/(skills|commands)\/.*\.md$|src\/packages\/README\.md$)/.test(path)
  && !vendoredSkills(root).some((name) => path.includes(`.claude/skills/${name}/`));
