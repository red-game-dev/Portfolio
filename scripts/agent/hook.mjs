// Shared plumbing for the hooks: read the event Claude Code sends on stdin, and warn without ever blocking. A
// warning goes to the agent as additional context and to the person as a system message.
export const readEvent = async () => {
  let input = "";

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
};

export const warn = (eventName, title, lines) => {
  if (lines.length === 0) {
    return;
  }

  const message = `${title}\n${lines.map((line) => `- ${line}`).join("\n")}`;

  process.stdout.write(JSON.stringify({ systemMessage: message, hookSpecificOutput: { hookEventName: eventName, additionalContext: message } }));
};
