import {
  clearCommand,
  CommandRegistry,
  createHelpCommand,
  output,
  parseInput,
  TerminalSession
} from "@/packages/interaction/terminal";

const createSession = () => {
  const registry = new CommandRegistry();

  registry
    .register({ name: "echo", summary: "Print the arguments", usage: "echo <text>", run: (args) => ({ lines: [output(args.join(" "))] }) })
    .register({ name: "goto", summary: "Go to a section", run: ([target]) => ({ lines: [], effect: { type: "navigate", target } }) })
    .register(clearCommand)
    .register(createHelpCommand(registry, "Commands"));

  return new TerminalSession(registry, { prompt: "$", welcome: [output("hello")] });
};

describe("interaction/terminal", () => {
  test("parses a command, quoted arguments and an optional leading slash", () => {
    expect(parseInput('/Echo "two words" three')).toEqual({ name: "echo", args: ["two words", "three"] });
    expect(parseInput("   ")).toBeNull();
  });

  test("runs a command and records the input and its output", () => {
    const session = createSession();

    session.execute("echo hi there");

    expect(session.output.map((line) => line.text)).toEqual(["hello", "$ echo hi there", "hi there"]);
  });

  test("reports an unknown command without throwing", () => {
    const session = createSession();

    session.execute("rm -rf /");

    expect(session.output[session.output.length - 1]).toEqual({ kind: "error", text: "command not found: rm" });
  });

  test("returns effects for the host and clears on clear", () => {
    const session = createSession();

    expect(session.execute("goto history")).toEqual({ type: "navigate", target: "history" });

    session.execute("clear");

    expect(session.output).toEqual([]);
  });

  test("help lists every command with its usage", () => {
    const session = createSession();

    session.execute("help");
    const text = session.output.map((line) => line.text).join("\n");

    expect(text).toContain("echo <text>");
    expect(text).toContain("Clear the screen");
  });

  test("recalls history in both directions and completes unique prefixes", () => {
    const session = createSession();

    session.execute("echo one");
    session.execute("echo two");

    expect(session.recall("previous")).toBe("echo two");
    expect(session.recall("previous")).toBe("echo one");
    expect(session.recall("next")).toBe("echo two");
    expect(session.complete("he")).toBe("help");
    expect(session.complete("e")).toBe("echo");
  });

  test("refuses a name registered twice", () => {
    const registry = new CommandRegistry().register(clearCommand);

    expect(() => registry.register({ name: "cls", summary: "", run: () => ({ lines: [] }) })).toThrow("registered twice");
  });
});
