export type TerminalLineKind = "input" | "output" | "heading" | "error" | "system";

export interface TerminalLine {
  kind: TerminalLineKind;
  text: string;
}

// Something the host should do after a command runs. The terminal never touches the page itself.
export type TerminalEffect =
  | { type: "clear" }
  | { type: "navigate"; target: string }
  | { type: "open"; url: string };

export interface CommandResult {
  lines: TerminalLine[];
  effect?: TerminalEffect;
}

export interface Command {
  name: string;
  aliases?: string[];
  summary: string;
  usage?: string;
  run(args: string[]): CommandResult;
}
