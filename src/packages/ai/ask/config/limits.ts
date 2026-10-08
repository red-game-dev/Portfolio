export interface AskLimits {
  // Characters in a question.
  questionLength: number;
  // Characters kept of each earlier answer sent back as history.
  answerLength: number;
  // Earlier exchanges kept, newest last.
  historyTurns: number;
  // How long a request waits for another one already answering the same first question, and how often it looks.
  waitForPeerMs: number;
  pollMs: number;
}

export const DEFAULT_ASK_LIMITS: AskLimits = {
  questionLength: 400,
  answerLength: 1500,
  historyTurns: 2,
  waitForPeerMs: 8 * 1000,
  pollMs: 400,
};

export const resolveAskLimits = (overrides: Partial<AskLimits> = {}): AskLimits => ({ ...DEFAULT_ASK_LIMITS, ...overrides });
