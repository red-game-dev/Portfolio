import { TerminalLine } from "../domain/types";

export const output = (text: string): TerminalLine => ({ kind: "output", text });

export const heading = (text: string): TerminalLine => ({ kind: "heading", text });

export const error = (text: string): TerminalLine => ({ kind: "error", text });

export const system = (text: string): TerminalLine => ({ kind: "system", text });
