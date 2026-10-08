export type TerminalLineKind = "input" | "output" | "heading" | "error" | "system";

export interface TerminalLine {
  kind: TerminalLineKind;
  text: string;
}

// A link out of the dialog ("link") or a place on the page to go to ("navigate").
export interface TerminalDialogAction {
  label: string;
  kind: "link" | "navigate";
  target: string;
}

export interface TerminalDialogSection {
  heading: string;
  items: string[];
}

// A richer answer than lines can hold, for the host to show however it likes.
export interface TerminalDialog {
  title: string;
  subtitle?: string;
  sections: TerminalDialogSection[];
  actions: TerminalDialogAction[];
}

// Something the host should do after a command runs. The terminal never touches the page itself.
export type TerminalEffect =
  | { type: "clear" }
  | { type: "navigate"; target: string }
  | { type: "open"; url: string }
  | { type: "dialog"; dialog: TerminalDialog }
  // A question for the host to answer in its own time, quickly or in depth, printing the answer when it has it.
  | { type: "ask"; question: string; depth: "quick" | "deep" };

export interface CommandResult {
  lines: TerminalLine[];
  effect?: TerminalEffect;
}

export interface Command {
  name: string;
  aliases?: string[];
  summary: string;
  usage?: string;
  // Help lists commands under their group, in the order the groups first appear.
  group?: string;
  run(args: string[]): CommandResult;
}
