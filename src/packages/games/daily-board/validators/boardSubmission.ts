import { BLOCKED_INITIALS, BOARD } from "../config/board";
import { BoardSubmission } from "../domain/board";

const DAY_MS = 24 * 60 * 60 * 1000;

const utcDayOf = (moment: number): string => new Date(moment).toISOString()
.slice(0, 10);

// Initials as a board keeps them: upper case, letters only.
export const cleanInitials = (initials: string): string => initials.trim().toUpperCase();

// What is wrong with a submission, if anything: a board only for today or yesterday (UTC, so a run that began before
// midnight still counts), one to three letters that are not blocked, and a whole score from 1 up to the cap.
export const submissionProblems = (submission: BoardSubmission, now: number): string[] => {
  const problems: string[] = [];
  const initials = cleanInitials(submission.initials);

  if (submission.day !== utcDayOf(now) && submission.day !== utcDayOf(now - DAY_MS)) {
    problems.push("day");
  }

  if (!BOARD.initials.test(initials) || BLOCKED_INITIALS.includes(initials)) {
    problems.push("initials");
  }

  if (!Number.isInteger(submission.score) || submission.score < 1 || submission.score > BOARD.maxScore) {
    problems.push("score");
  }

  return problems;
};
