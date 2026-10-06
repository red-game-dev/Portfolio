import { CommandRegistry } from "../core/CommandRegistry";
import { Command } from "../domain/types";
import { heading, output, system } from "../utils/lines";

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
