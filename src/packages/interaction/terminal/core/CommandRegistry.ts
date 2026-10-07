import { Command } from "../domain/types";

// Commands by name and alias. Registering a name twice is a mistake in the host, so it throws.
export class CommandRegistry {
  private readonly commands: Command[] = [];
  private readonly byName = new Map<string, Command>();

  public register(command: Command): this {
    [command.name, ...(command.aliases ?? [])].forEach((name) => {
      const key = name.toLowerCase();

      if (this.byName.has(key)) {
        throw new Error(`Terminal command "${key}" is registered twice`);
      }

      this.byName.set(key, command);
    });
    this.commands.push(command);

    return this;
  }

  public resolve(name: string): Command | undefined {
    return this.byName.get(name.toLowerCase());
  }

  public list(): Command[] {
    return [...this.commands];
  }

  // Names that start with what has been typed, for tab completion.
  public complete(prefix: string): string[] {
    const normalised = prefix.replace(/^\//, "").toLowerCase();

    return this.commands.map((command) => command.name).filter((name) => name.startsWith(normalised));
  }
}
