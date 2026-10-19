import { Command, error, heading, output, system } from "@/packages/interaction/terminal";
import { fill } from "@/packages/text/format";
import {
  DEFAULT_GUIDE_ANSWERS,
  deployScript,
  hostFor,
  hostName,
  hostOfName,
  hostSlug,
  moveScript,
  nextHost,
  recommendHosts,
  stackOfName,
  stackSlug,
  UNIVERSE_STACKS,
} from "@/services/devops";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";

// The DevOps universe from the command line: where I run things, then each universe's stack shipped to where the
// guide's starting plan puts it, or to a host named, or moved on with no downtime. The same scripts the console
// prints, from the same words.
export const createDevOpsCommands = ({ data }: CommandContext): Command[] => {
  const { devops } = data;
  const words = devops.terminal;
  const hosts = devops.hosts.items;
  const plan = recommendHosts(DEFAULT_GUIDE_ANSWERS);
  const stacks = () => [
    heading(words.stacksTitle),
    ...UNIVERSE_STACKS.map((stack) => output(fill(words.stackRow, { slug: stackSlug(stack), name: devops.console.stacks[stack] }))),
    system(words.usage),
  ];

  return [
    {
      name: "hosts",
      group: GROUPS.devops,
      summary: words.hostsSummary,
      run: () => ({
        lines: [
          heading(words.hostsTitle),
          ...hosts.map((host) => output(fill(words.hostRow, { slug: hostSlug(host.id), name: host.name, kind: host.kind, reach: host.reach }))),
          system(words.usage),
        ],
      }),
    },
    {
      name: "deploy",
      aliases: ["ship"],
      group: GROUPS.devops,
      usage: "deploy <universe> [host]",
      summary: words.deploySummary,
      run: ([name = "", hostWord]) => {
        if (!name) {
          return { lines: stacks() };
        }

        const stack = stackOfName(name);
        const host = hostWord ? hostOfName(hostWord) : stack && hostFor(plan, stack);

        if (!stack) {
          return { lines: [error(fill(words.unknownStack, { input: name }))] };
        }

        if (!host) {
          return { lines: [error(fill(words.unknownHost, { input: hostWord ?? "" }))] };
        }

        return {
          lines: [
            ...deployScript(devops.console, stack, host).map((line) => system(`$ ${line}`)),
            output(fill(devops.console.shipped, { stack: devops.console.stacks[stack], host: hostName(hosts, host) })),
          ],
        };
      },
    },
    {
      name: "migrate",
      aliases: ["move"],
      group: GROUPS.devops,
      usage: "migrate <universe> <host>",
      summary: words.migrateSummary,
      run: ([name = "", hostWord]) => {
        if (!name) {
          return { lines: stacks() };
        }

        const stack = stackOfName(name);

        if (!stack) {
          return { lines: [error(fill(words.unknownStack, { input: name }))] };
        }

        const from = hostFor(plan, stack);
        const to = hostWord ? hostOfName(hostWord) : nextHost(stack, from);

        if (!to) {
          return { lines: [error(fill(words.unknownHost, { input: hostWord ?? "" }))] };
        }

        if (to === from) {
          return { lines: [system(fill(words.sameHost, { stack: devops.console.stacks[stack], host: hostName(hosts, to) }))] };
        }

        return {
          lines: [
            ...moveScript(devops.console, stack, from, to).map((line) => system(`$ ${line}`)),
            output(fill(devops.console.moved, { stack: devops.console.stacks[stack], from: hostName(hosts, from), to: hostName(hosts, to) })),
          ],
        };
      },
    },
  ];
};
