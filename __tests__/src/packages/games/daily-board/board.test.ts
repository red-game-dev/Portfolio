import { BLOCKED_INITIALS, BOARD, boardEntries, boardKey, boardMember, cleanInitials, isBoardSubmission, submissionProblems } from "@/packages/games/daily-board";

const NOON = Date.parse("2026-10-11T12:00:00Z");

describe("the daily voyage's board", () => {
  test("takes a run for today or yesterday, one to three letters not blocked, and a whole score in range", () => {
    const run = { day: "2026-10-11", initials: "abc", score: 4200 };

    expect(submissionProblems(run, NOON)).toEqual([]);
    expect(submissionProblems({ ...run, day: "2026-10-10" }, NOON)).toEqual([]);
    expect(submissionProblems({ ...run, day: "2026-10-09" }, NOON)).toEqual(["day"]);
    expect(submissionProblems({ ...run, initials: "ABCD" }, NOON)).toEqual(["initials"]);
    expect(submissionProblems({ ...run, initials: "A1" }, NOON)).toEqual(["initials"]);
    expect(submissionProblems({ ...run, initials: BLOCKED_INITIALS[0].toLowerCase() }, NOON)).toEqual(["initials"]);
    expect(submissionProblems({ ...run, score: 0 }, NOON)).toEqual(["score"]);
    expect(submissionProblems({ ...run, score: 12.5 }, NOON)).toEqual(["score"]);
    expect(submissionProblems({ ...run, score: BOARD.maxScore + 1 }, NOON)).toEqual(["score"]);
    expect(cleanInitials(" xy ")).toBe("XY");
  });

  test("a body must have a submission's shape before its rules are read", () => {
    expect(isBoardSubmission({ day: "2026-10-11", initials: "AB", score: 1 })).toBe(true);
    expect(isBoardSubmission({ day: "2026-10-11", initials: "AB" })).toBe(false);
    expect(isBoardSubmission("AB")).toBe(false);
  });

  test("shows only the initials of each place, best first, two pilots with the same initials both kept", () => {
    expect(boardKey("2026-10-11")).toBe("voyage:board:2026-10-11");
    expect(boardEntries([{ member: boardMember("ABC", "1f"), score: 900 }, { member: boardMember("ABC", "2e"), score: 800.4 }])).toEqual([
      { initials: "ABC", score: 900 },
      { initials: "ABC", score: 800 },
    ]);
  });
});
