import { Command, output, system } from "@/packages/interaction/terminal";
import { collapseWhitespace } from "@/packages/text/format";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";

// Just for fun.
export const createFunCommands = (context: CommandContext): Command[] => {
  const { contactDialog, data } = context;

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
    {
      name: "fortune",
      group: GROUPS.fun,
      aliases: ["quote"],
      summary: "Something someone I worked with said",
      run: () => {
        const pick = data.recommendations[Math.floor(Math.random() * data.recommendations.length)];

        return pick
          ? { lines: [output(`"${collapseWhitespace(pick.quote)}"`), system(`${pick.role}, ${pick.company}, ${pick.date}`)] }
          : { lines: [output("No fortunes today.")] };
      },
    },
    {
      name: "ping",
      group: GROUPS.fun,
      usage: "ping [host]",
      summary: "How quickly I answer",
      run: ([host]) => ({
        lines: [
          system(`PING ${host || data.details.name.toLowerCase().replace(/\s+/g, ".")}`),
          output(`64 bytes: ${data.terminal.contact.subtitle}`),
          output(`Reachable: ${data.details.contactTime.toLowerCase()}`),
          system("Type contact to send a real packet."),
        ],
      }),
    },
  ];
};
