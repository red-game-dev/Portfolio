export interface AskLimits {
  // Characters in a question.
  questionLength: number;
  // Characters kept of each earlier answer sent back as history.
  answerLength: number;
  // Earlier exchanges kept, newest last.
  historyTurns: number;
}

export const DEFAULT_ASK_LIMITS: AskLimits = {
  questionLength: 400,
  answerLength: 1500,
  historyTurns: 2,
};

export const resolveAskLimits = (overrides: Partial<AskLimits> = {}): AskLimits => ({ ...DEFAULT_ASK_LIMITS, ...overrides });
