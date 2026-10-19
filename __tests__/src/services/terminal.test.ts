import { SECTION_IDS } from "@/config/sections";
import { portfolioData } from "@/data/resume";
import { preferences } from "@/services/preferences/store";
import { GROUPS } from "@/services/terminal/commands/shared";
import { createPortfolioCommands, createPortfolioTerminal } from "@/services/terminal/portfolioTerminal";

// Runs every portfolio command against the real data, so a content change can never break the terminal.
describe("portfolio terminal", () => {
  test("every listed command runs without an error line", () => {
    const session = createPortfolioTerminal();

    ["whoami", "about", "experience", "experience kpmg", "skills", "skills frontend", "characters", "services", "ai", "cases", "projects",
      "contact", "hire", "goto", "help", "ventures", "industries", "references", "socials", "ls", "cat about.txt", "sudo hire red", "coffee",
      "matrix", "hosts", "deploy", "deploy chain", "migrate ask"].forEach((command) => {
      const before = session.output.length;

      session.execute(command);

      const added = session.output.slice(before);

      expect(added.filter((line) => line.kind === "error")).toEqual([]);
      expect(added.length).toBeGreaterThan(1);
    });
  });

  test("goto and cases ask the page to navigate", () => {
    const session = createPortfolioTerminal();

    expect(session.execute("goto history")).toEqual({ type: "navigate", target: "section-history" });
    expect(session.execute("cases payments")).toEqual({ type: "navigate", target: "payments-case-studies" });
    expect(session.execute("cv")).toEqual({ type: "open", url: "/cv/redeemer-pace-cv.pdf" });
  });

  test("ask hands the question to the page, and deeper asks the same one again in depth", () => {
    const session = createPortfolioTerminal();

    expect(session.execute("deeper")).toBeUndefined();
    expect(session.output[session.output.length - 1].kind).toBe("error");
    expect(session.execute("ask")).toBeUndefined();
    expect(session.execute("ask what did red build at kpmg?")).toEqual({ type: "ask", question: "what did red build at kpmg?", depth: "quick" });
    expect(session.execute("deeper")).toEqual({ type: "ask", question: "what did red build at kpmg?", depth: "deep" });
  });

  test("offline, ask and deeper say at once that asking needs a connection, and hand nothing to the page", () => {
    const session = createPortfolioTerminal();
    const onLine = jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    try {
      expect(session.execute("ask what did red build at kpmg?")).toBeUndefined();
      expect(session.output[session.output.length - 1]).toMatchObject({ kind: "error", text: portfolioData.terminal.ask.offline });
      expect(session.output.map((line) => line.text)).not.toContain(portfolioData.terminal.ask.thinking);
      expect(session.execute("deeper")).toBeUndefined();
      expect(session.output[session.output.length - 1]).toMatchObject({ kind: "error", text: portfolioData.terminal.ask.offline });

      onLine.mockReturnValue(true);
      expect(session.execute("deeper")).toEqual({ type: "ask", question: "what did red build at kpmg?", depth: "deep" });
    } finally {
      onLine.mockRestore();
    }
  });

  test("an answer printed later joins the output", () => {
    const session = createPortfolioTerminal();
    const before = session.output.length;

    session.print([{ kind: "output", text: "Red built it." }]);

    expect(session.output.slice(before)).toEqual([{ kind: "output", text: "Red built it." }]);
  });

  test("an unknown command points back to help", () => {
    const session = createPortfolioTerminal();

    session.execute("frobnicate");

    expect(session.output[session.output.length - 1].text).toContain("Type help");
  });

  test("every red intent opens a dialog whose sections point at real content", () => {
    const session = createPortfolioTerminal();

    ["red create app", "red fix my app", "red fix my broken vibe coded app", "red migrate app", "red enable ai in my company", "red build my app"].forEach((command) => {
      const effect = session.execute(command);

      expect(effect?.type).toBe("dialog");

      if (effect?.type === "dialog") {
        expect(effect.dialog.sections.every((section) => section.items.length > 0)).toBe(true);
        expect(effect.dialog.actions[0].target).toMatch(/^mailto:.+\?subject=/);
      }
    });
  });

  test("red hire as picks a character or a role, and lists them when unsure", () => {
    const session = createPortfolioTerminal();
    const cto = session.execute("red hire as CTO");

    expect(cto?.type === "dialog" && cto.dialog.subtitle).toMatch(/^CTO, Level \d+/);
    expect(session.execute("red hire as payments")?.type).toBe("dialog");
    expect(session.execute("red hire as frontend")?.type).toBe("dialog");
    expect(session.execute("red hire as enterprise architect")?.type).toBe("dialog");

    const before = session.output.length;

    expect(session.execute("red hire as astronaut")).toBeUndefined();
    expect(session.output.slice(before).some((line) => line.kind === "error")).toBe(true);
    expect(session.execute("red hire")).toBeUndefined();
    expect(session.execute("red dance")).toBeUndefined();
  });
});

describe("portfolio commands", () => {
  const commands = createPortfolioCommands(portfolioData);
  const sectionIds = new Set<string>(Object.values(SECTION_IDS));

  test("every command answers with no arguments, and none shares a name", () => {
    const names = commands.flatMap((command) => [command.name, ...(command.aliases ?? [])]);

    expect(new Set(names).size).toBe(names.length);
    commands.forEach((command) => {
      expect(command.run([]).lines.length).toBeGreaterThan(0);
    });
  });

  test("every file ls lists opens with cat", () => {
    const session = createPortfolioTerminal();

    session.execute("ls");

    const files = session.output[session.output.length - 1].text.split(/\s+/).filter(Boolean);

    expect(files.length).toBeGreaterThan(3);
    files.forEach((file) => {
      const before = session.output.length;

      session.execute(`cat ${file}`);
      expect(session.output.slice(before).filter((line) => line.kind === "error")).toEqual([]);
    });
  });

  test("every goto target is a section on the page", () => {
    const session = createPortfolioTerminal();

    session.execute("goto");

    const targets = session.output[session.output.length - 1].text.replace(/^Sections: /, "").split(", ");

    targets.forEach((target) => {
      const effect = session.execute(`goto ${target}`);

      expect(effect?.type).toBe("navigate");
      expect(sectionIds.has((effect as { target: string }).target)).toBe(true);
    });
  });

  test("help lists the groups in their order", () => {
    const order = [...new Set(commands.map((command) => command.group))];

    expect(order).toEqual([GROUPS.red, GROUPS.ask, GROUPS.me, GROUPS.work, GROUPS.devops, GROUPS.contact, GROUPS.around, GROUPS.fun, GROUPS.settings]);
  });

  test("hosts lists where I run things, deploy ships a universe where the plan puts it, and migrate moves it on", () => {
    const run = (name: string, args: string[]) => {
      const command = commands.find((candidate) => candidate.name === name);

      return command ? command.run(args).lines : [];
    };
    const text = (name: string, args: string[]) => run(name, args).map((line) => line.text)
.join("\n");

    expect(text("hosts", [])).toContain("metal: OVH and Hetzner, Dedicated servers.");
    expect(text("deploy", [])).toContain("game: The game servers");
    expect(text("deploy", ["game"])).toContain("The game servers: live on OVH and Hetzner.");
    expect(text("deploy", ["site", "vercel"])).toContain("This site: live on Vercel.");
    expect(text("migrate", ["board", "aws"])).toContain("The daily board: moved from OVH and Hetzner to AWS, with no downtime.");
    expect(text("migrate", ["board", "metal"])).toContain("The daily board: already runs on OVH and Hetzner.");
    expect(run("deploy", ["toaster"]).map(({ kind }) => kind)).toEqual(["error"]);
    expect(run("migrate", ["game", "mainframe"]).map(({ kind }) => kind)).toEqual(["error"]);
  });

  test("settings lists every setting, set changes one in the store the page reads, and reset puts them back", () => {
    const run = (name: string, args: string[]) => {
      const command = commands.find((candidate) => candidate.name === name);

      return command ? command.run(args).lines.map((line) => line.text).join("\n") : "";
    };

    preferences.reset();
    expect(run("settings", [])).toContain("landing-control: auto");
    expect(run("set", ["landing-control", "Manual"])).toContain("Landing control is now manual.");
    expect(preferences.get("landing-control")).toBe("manual");
    expect(run("set", ["landing-control", "sideways"])).toContain("Landing control can be auto, manual.");
    expect(run("set", ["volume", "11"])).toContain("There is no setting called volume.");
    expect(run("set", [])).toContain("Usage: set <setting> <value>");
    expect(run("reset", ["landing-control"])).toContain("Landing control is back to auto.");
    run("set", ["landing-time", "real"]);
    expect(run("reset", [])).toContain("Every setting is back to its default.");
    expect(preferences.get("landing-time")).toBe("compressed");
  });
});

