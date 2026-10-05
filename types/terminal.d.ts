export interface TerminalContent {
  prompt: string;
  welcome: string[];
  suggestions: string[];
  helpTitle: string;
  // "{name}" is replaced with what was typed.
  unknownCommand: string;
  inputLabel: string;
  shortcutHint: string;
}
