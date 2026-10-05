import { createPortfolioTerminal } from "@/services/terminal/portfolioTerminal";

// Runs every portfolio command against the real data, so a content change can never break the terminal.
describe("portfolio terminal", () => {
  test("every listed command runs without an error line", () => {
    const session = createPortfolioTerminal();

    ["whoami", "about", "experience", "experience kpmg", "skills", "skills tech", "characters", "services", "ai", "cases", "projects",
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
});
