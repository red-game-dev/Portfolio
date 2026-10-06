import { createPortfolioTerminal } from "@/services/terminal/portfolioTerminal";

// Runs every portfolio command against the real data, so a content change can never break the terminal.
describe("portfolio terminal", () => {
  test("every listed command runs without an error line", () => {
    const session = createPortfolioTerminal();

    ["whoami", "about", "experience", "experience kpmg", "skills", "skills frontend", "characters", "services", "ai", "cases", "projects",
      "contact", "hire", "goto", "help"].forEach((command) => {
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
    expect(session.execute("cases payments")).toEqual({ type: "navigate", target: "for-payments" });
    expect(session.execute("cv")).toEqual({ type: "open", url: "/cv/redeemer-pace-cv.pdf" });
  });

  test("an unknown command points back to help", () => {
    const session = createPortfolioTerminal();

    session.execute("sudo");

    expect(session.output[session.output.length - 1].text).toContain("Type help");
  });

  test("every red intent opens a dialog whose sections point at real content", () => {
    const session = createPortfolioTerminal();

    ["red create app", "red fix my app", "red migrate app", "red enable ai in my company", "red build my app"].forEach((command) => {
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
