import { portfolioData, PortfolioData } from "@/data/resume";
import { clearCommand, Command, CommandRegistry, createHelpCommand, system, TerminalSession } from "@/packages/interaction/terminal";
import { fill } from "@/packages/text/format";
import { createAroundCommands } from "@/services/terminal/commands/around";
import { createContactCommands } from "@/services/terminal/commands/contact";
import { createFunCommands } from "@/services/terminal/commands/fun";
import { createMeCommands } from "@/services/terminal/commands/me";
import { createCommandContext, GROUPS } from "@/services/terminal/commands/shared";
import { createWorkCommands } from "@/services/terminal/commands/work";
import { createRedCommand } from "@/services/terminal/redCommand";

// The portfolio as commands, one file per group help lists them under. Every answer is built from the same
// data the page renders, so the terminal never says something the page does not.
export const createPortfolioCommands = (data: PortfolioData): Command[] => {
  const context = createCommandContext(data);
  const commands: Command[] = [
    { ...createRedCommand(data), group: GROUPS.red },
    ...createMeCommands(context),
    ...createWorkCommands(context),
    ...createContactCommands(context),
    ...createAroundCommands(context),
    ...createFunCommands(context),
  ];

  commands.forEach((command) => context.commandsByName.set(command.name, command));

  return commands;
};

export const createPortfolioTerminal = (data: PortfolioData = portfolioData) => {
  const registry = new CommandRegistry();

  createPortfolioCommands(data).forEach((command) => registry.register(command));
  registry.register(clearCommand).register(createHelpCommand(registry, data.terminal.helpTitle, GROUPS.terminal));

  return new TerminalSession(registry, {
    prompt: data.terminal.prompt,
    welcome: data.terminal.welcome.map(system),
    unknownCommand: (name) => fill(data.terminal.unknownCommand, { name }),
  });
};
