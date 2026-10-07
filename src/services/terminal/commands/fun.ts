import { Command, output, system } from "@/packages/interaction/terminal";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";

// Just for fun.
export const createFunCommands = (context: CommandContext): Command[] => {
  const { contactDialog } = context;

  return [
    {
      name: "sudo",
      group: GROUPS.fun,
      usage: "sudo <anything>",
      summary: "Try it",
      run: () => ({
        lines: [
          system("[sudo] password for visitor: ********"),
          output("Access granted. You never needed sudo to hire me, but I like the confidence."),
          system("Opening the contact card..."),
        ],
        effect: { type: "dialog", dialog: contactDialog },
      }),
    },
    {
      name: "coffee",
      group: GROUPS.fun,
      summary: "Take a break",
      run: () => ({
        lines: [
          output("   ( ("),
          output("    ) )"),
          output("  ........"),
          output("  |      |]"),
          output("  \\      /"),
          output("   `----'"),
          output("Brewed. The best architecture starts over coffee: type contact and let's have one."),
        ],
      }),
    },
    {
      name: "matrix",
      group: GROUPS.fun,
      summary: "Follow the white rabbit",
      run: () => ({
        lines: [
          system("Wake up, visitor..."),
          system("The page has you."),
          output("Follow the rain back up: type goto about."),
        ],
      }),
    },
    {
      name: "echo",
      group: GROUPS.fun,
      usage: "echo <text>",
      summary: "Say something back",
      run: (args) => ({ lines: [output(args.join(" ") || " ")] }),
    },
    {
      name: "date",
      group: GROUPS.fun,
      summary: "Today",
      run: () => ({ lines: [output(new Date().toDateString())] }),
    },
    {
      name: "exit",
      group: GROUPS.fun,
      aliases: ["quit", "logout"],
      summary: "Leave",
      run: () => ({ lines: [output("There is no exit, only the next quest. Type hire.")] }),
    },
  ];
};
