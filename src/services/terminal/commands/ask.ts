import { Command, error, heading, output, system } from "@/packages/interaction/terminal";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";

// "ask <question>" hands the question to the page, which streams the agent's answer back into the terminal.
// "deeper" asks the last question again of the larger model.
export const createAskCommands = ({ data }: CommandContext): Command[] => {
  const { ask } = data.terminal;
  let lastQuestion = "";

  return [
    {
      name: "ask",
      group: GROUPS.ask,
      usage: ask.usage,
      summary: ask.summary,
      run: (args) => {
        const question = args.join(" ").trim();

        if (!question) {
          return { lines: [heading(ask.summary), output(ask.usage), ...ask.examples.map((example) => output(`  ask ${example}`))] };
        }

        lastQuestion = question;

        return { lines: [system(ask.thinking)], effect: { type: "ask", question, depth: "quick" } };
      },
    },
    {
      name: "deeper",
      group: GROUPS.ask,
      summary: ask.deeperSummary,
      run: () => (lastQuestion
        ? { lines: [system(ask.thinkingDeeper)], effect: { type: "ask", question: lastQuestion, depth: "deep" } }
        : { lines: [error(ask.nothingToDeepen)] }),
    },
  ];
};
