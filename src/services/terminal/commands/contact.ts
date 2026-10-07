import { Command, heading, output, system } from "@/packages/interaction/terminal";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";

// Get in touch.
export const createContactCommands = (context: CommandContext): Command[] => {
  const { data, linkedIn, contactDialog } = context;

  return [
    {
      name: "contact",
      group: GROUPS.contact,
      aliases: ["connect"],
      summary: "Every way to reach me, with buttons",
      run: () => ({
        lines: [
          heading("Contact"),
          output(`  Email     ${data.details.email}`),
          output(`  LinkedIn  ${linkedIn}`),
          output(`  Phone     ${data.details.phone}, ${data.details.contactTime.toLowerCase()}`),
          ...data.github.map((account) => output(`  GitHub    ${account.link}`)),
          system("Opening the contact card..."),
        ],
        effect: { type: "dialog", dialog: contactDialog },
      }),
    },
    {
      name: "email",
      group: GROUPS.contact,
      aliases: ["mail"],
      summary: "Write me an email",
      run: () => ({ lines: [system(`Opening an email to ${data.details.email}...`)], effect: { type: "open", url: `mailto:${data.details.email}` } }),
    },
    {
      name: "linkedin",
      group: GROUPS.contact,
      summary: "Connect on LinkedIn",
      run: () => ({ lines: [system("Opening LinkedIn...")], effect: { type: "open", url: linkedIn } }),
    },
    {
      name: "github",
      group: GROUPS.contact,
      aliases: ["git"],
      summary: "My code on GitHub",
      run: () => ({ lines: [system("Opening GitHub...")], effect: { type: "open", url: data.github[0].link } }),
    },
    {
      name: "phone",
      group: GROUPS.contact,
      aliases: ["call"],
      summary: "My number",
      run: () => ({ lines: [output(`${data.details.phone}, ${data.details.contactTime.toLowerCase()}`)] }),
    },
    {
      name: "socials",
      group: GROUPS.contact,
      summary: "Where else I am",
      run: () => ({
        lines: [
          heading("Socials"),
          output(`  LinkedIn   ${linkedIn}`),
          output(`  X          https://x.com/${data.socialMedia.byUsername.twitter.replace("@", "")}`),
          output(`  Instagram  https://www.instagram.com/${data.socialMedia.byUsername.instagram}`),
          output(`  Facebook   https://www.facebook.com/${data.socialMedia.byUsername.facebook}`),
          output(`  My game    https://www.youtube.com/${data.socialMedia.byProjectsUsername.gameYt}`),
        ],
      }),
    },
    {
      name: "cv",
      group: GROUPS.contact,
      aliases: ["resume"],
      summary: "Download my CV",
      run: () => ({ lines: [system("Opening the CV...")], effect: { type: "open", url: data.cv } }),
    },
    {
      name: "hire",
      group: GROUPS.contact,
      summary: "Availability and the fastest way to talk",
      run: () => ({
        lines: [heading("Hire me"), output(data.headline.availability), output(`Email ${data.details.email}, or type cv for the PDF.`)],
      }),
    },
  ];
};
