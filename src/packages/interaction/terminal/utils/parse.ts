export interface ParsedInput {
  name: string;
  args: string[];
}

const TOKEN = /"([^"]*)"|'([^']*)'|(\S+)/g;

// Splits input into a command and its arguments. Quotes group words, and a leading slash is optional,
// so "/help" and "help" are the same command.
export const parseInput = (input: string): ParsedInput | null => {
  const tokens = [...input.trim().matchAll(TOKEN)].map((match) => match[1] ?? match[2] ?? match[3]);

  if (tokens.length === 0) {
    return null;
  }

  return { name: tokens[0].replace(/^\//, "").toLowerCase(), args: tokens.slice(1) };
};
