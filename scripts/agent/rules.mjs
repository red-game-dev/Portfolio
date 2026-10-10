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

// Secrets never go in this public repo: the keys live in Vercel's environment. Env files are ignored, and nothing
// shaped like a provider's key or a private key is ever committed.
export const isEnvFile = (path) => /(^|\/)\.env($|\.)/.test(path);

// The only names a committed env file may hold: switches, never keys.
export const SAFE_ENV_NAMES = ["DEBUG", "ANALYZE"];

const SECRET_SHAPES = [
  /sk-ant-[A-Za-z0-9_-]{20,}/,
  /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /\bgh[pousr]_[A-Za-z0-9]{36}/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bnpm_[A-Za-z0-9]{36}\b/,
  /\bgsk_[A-Za-z0-9]{40,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

// Every line of a text that holds something shaped like a secret, as short readable messages (never the secret).
export const findSecrets = (text) => text.split("\n").flatMap((line, index) =>
  (SECRET_SHAPES.some((shape) => shape.test(line)) ? [`line ${index + 1}: something shaped like a secret key`] : []));
