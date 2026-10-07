import { CommandRegistry } from "../core/CommandRegistry";
import { Command } from "../domain/types";
import { error, heading, output, system } from "../utils/lines";

// Every command with its summary, under its group when it has one. Ungrouped commands come last, under
// `otherGroup`.
export const createHelpCommand = (registry: CommandRegistry, title: string, otherGroup = "Other"): Command => ({
  name: "help",
  aliases: ["?", "commands"],
  summary: "List every command",
  group: otherGroup,
  run: () => {
    const commands = registry.list();
    const width = Math.max(...commands.map((command) => (command.usage ?? command.name).length));
    const groups = new Map<string, Command[]>();

    commands.forEach((command) => {
      const group = command.group ?? otherGroup;

      groups.set(group, [...(groups.get(group) ?? []), command]);
    });

    const ordered = [...groups.entries()].sort(([first], [second]) => Number(first === otherGroup) - Number(second === otherGroup));

    return {
      lines: [
        heading(title),
        ...ordered.flatMap(([group, members]) => [
          system(group),
          ...members.map((command) => output(`  ${(command.usage ?? command.name).padEnd(width + 2)}${command.summary}`)),
        ]),
      ],
    };
  },
});

export const clearCommand: Command = {
  name: "clear",
  aliases: ["cls"],
  summary: "Clear the screen",
  run: () => ({ lines: [], effect: { type: "clear" } }),
};

// One command in full: what it does, how to call it and its other names. Asked about nothing, or about a
// command that does not exist, it says how to use it.
export const createManCommand = (registry: CommandRegistry, otherGroup = "Other"): Command => ({
  name: "man",
  usage: "man <command>",
  summary: "How one command works",
  group: otherGroup,
  run: ([name]) => {
    const command = name ? registry.resolve(name.toLowerCase()) : undefined;

    if (!command) {
      return { lines: [error(name ? `No manual entry for ${name}. Try help.` : "What manual page do you want? Try man whoami.")] };
    }

    return {
      lines: [
        heading(command.name),
        output(command.summary),
        system(`Usage: ${command.usage ?? command.name}`),
        ...(command.aliases?.length ? [system(`Also: ${command.aliases.join(", ")}`)] : []),
      ],
    };
  },
});
