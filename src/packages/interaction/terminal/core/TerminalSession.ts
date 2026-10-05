import { TerminalEffect, TerminalLine } from "../domain/types";
import { error } from "../utils/lines";
import { parseInput } from "../utils/parse";
import { CommandRegistry } from "./CommandRegistry";

export interface TerminalSessionOptions {
  prompt: string;
  welcome?: TerminalLine[];
  // Older lines are dropped past this, so a long session never grows without bound.
  maxLines?: number;
  unknownCommand?: (name: string) => string;
}

const DEFAULT_MAX_LINES = 400;

// The state of one terminal: what has been printed and what was typed. Pure, so it is easy to test and
// can sit behind any UI.
export class TerminalSession {
  private readonly registry: CommandRegistry;
  private readonly options: TerminalSessionOptions;
  private lines: TerminalLine[];
  private readonly history: string[] = [];
  private historyCursor = 0;

  constructor(registry: CommandRegistry, options: TerminalSessionOptions) {
    this.registry = registry;
    this.options = options;
    this.lines = [...(options.welcome ?? [])];
  }

  public get output(): TerminalLine[] {
    return this.lines;
  }

  public execute(input: string): TerminalEffect | undefined {
    const parsed = parseInput(input);

    this.append([{ kind: "input", text: `${this.options.prompt} ${input}` }]);

    if (!parsed) {
      return undefined;
    }

    this.history.push(input.trim());
    this.historyCursor = this.history.length;

    const command = this.registry.resolve(parsed.name);

    if (!command) {
      const message = this.options.unknownCommand?.(parsed.name) ?? `command not found: ${parsed.name}`;

      this.append([error(message)]);

      return undefined;
    }

    const result = command.run(parsed.args);

    if (result.effect?.type === "clear") {
      this.lines = [];

      return result.effect;
    }

    this.append(result.lines);

    return result.effect;
  }

  // Walks back and forth through what was typed, like the up and down arrows in a shell.
  public recall(direction: "previous" | "next"): string {
    if (this.history.length === 0) {
      return "";
    }

    this.historyCursor = direction === "previous"
      ? Math.max(0, this.historyCursor - 1)
      : Math.min(this.history.length, this.historyCursor + 1);

    return this.history[this.historyCursor] ?? "";
  }

  public complete(input: string): string {
    const matches = this.registry.complete(input.trim());

    return matches.length === 1 ? matches[0] : input;
  }

  private append(lines: TerminalLine[]): void {
    this.lines = [...this.lines, ...lines].slice(-(this.options.maxLines ?? DEFAULT_MAX_LINES));
  }
}
