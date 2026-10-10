import { execFileSync } from "child_process";
import { lstatSync, readFileSync } from "fs";
import { join } from "path";

import { findSecrets, isEnvFile, SAFE_ENV_NAMES } from "../../../scripts/agent/rules.mjs";

const root = join(__dirname, "../../..");
// Files that are not text, or are text written by tools, are not read.
const SKIPPED = /\.(png|jpe?g|webp|gif|ico|pdf|woff2?|ttf|otf|mp3|mp4|webm|zip|gz)$|(^|\/)package-lock\.json$/;

// Every file git tracks (a submodule or a link is not a file of its own here).
const tracked = (): string[] => execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0")
  .filter((path) => path && lstatSync(join(root, path), { throwIfNoEntry: false })?.isFile());

describe("this public repo holds no secrets", () => {
  test("knows a key when it sees one, and an env file by its name", () => {
    // Built here so no key shaped string sits in the repo.
    expect(findSecrets(`const key = "AIza${"x".repeat(35)}";`)).toHaveLength(1);
    expect(findSecrets(`token: "sk-ant-${"a1".repeat(12)}"`)).toHaveLength(1);
    expect(findSecrets(`KV_REST_API_TOKEN=AYQg${"Ab9".repeat(8)}`)).toHaveLength(1);
    expect(findSecrets(`MISTRAL_API_KEY: "${"k".repeat(32)}"`)).toHaveLength(1);
    expect(findSecrets("the docs talk about an API key, but hold none")).toEqual([]);
    expect(findSecrets("const salt = process.env.ASK_SALT ?? \"\";")).toEqual([]);
    expect(findSecrets("KV_REST_API_TOKEN=")).toEqual([]);
    expect(isEnvFile(".env")).toBe(true);
    expect(isEnvFile("apps/web/.env.production")).toBe(true);
    expect(isEnvFile("src/packages/games/voyage/systems/environment.ts")).toBe(false);
  });

  test("no tracked file holds anything shaped like a provider's key or a private key", () => {
    const found = tracked()
      .filter((path) => !SKIPPED.test(path))
      .flatMap((path) => findSecrets(readFileSync(join(root, path), "utf8")).map((issue) => `${path}, ${issue}`));

    expect(found).toEqual([]);
  });

  test("an env file still tracked holds only switches, never a key", () => {
    tracked().filter(isEnvFile)
.forEach((path) => {
      const names = readFileSync(join(root, path), "utf8").split("\n")
.map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
.map((line) => line.split("=")[0].trim());

      names.forEach((name) => expect(SAFE_ENV_NAMES).toContain(name));
    });
  });
});
