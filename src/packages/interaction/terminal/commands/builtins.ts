import { CommandRegistry } from "../core/CommandRegistry";
import { Command } from "../domain/types";
import { heading, output } from "../utils/lines";

export const createHelpCommand = (registry: CommandRegistry, title: string): Command => ({
  name: "help",
  aliases: ["?", "commands"],
  summary: "List every command",
  run: () => {
    const commands = registry.list();
    const width = Math.max(...commands.map((command) => (command.usage ?? command.name).length));

    return {
      lines: [
        heading(title),
        ...commands.map((command) => output(`  ${(command.usage ?? command.name).padEnd(width + 2)}${command.summary}`)),
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
