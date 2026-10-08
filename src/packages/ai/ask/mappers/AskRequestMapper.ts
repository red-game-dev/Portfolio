import { Mapper } from "@/packages/core/domain";

import { AskLimits } from "../config/limits";
import { AskBody, AskRequest, AskTurn } from "../domain/types";
import { isAskDepth, isAskTurn } from "../guards/askBody";

// A validated body as the request the service works with: the question trimmed, quick unless deep was asked,
// and only well formed history, newest last, within the limits.
export class AskRequestMapper extends Mapper<AskBody, AskRequest> {
  private readonly limits: AskLimits;

  constructor(limits: AskLimits) {
    super();
    this.limits = limits;
  }

  public map(body: AskBody): AskRequest {
    const history = (Array.isArray(body.history) ? body.history : [])
      .filter(isAskTurn)
      .map((turn): AskTurn => ({ question: turn.question.trim().slice(0, this.limits.questionLength), answer: turn.answer.trim().slice(0, this.limits.answerLength) }))
      .filter((turn) => turn.question && turn.answer)
      .slice(-this.limits.historyTurns);

    return { question: body.question.trim(), depth: isAskDepth(body.depth) ? body.depth : "quick", history };
  }
}
