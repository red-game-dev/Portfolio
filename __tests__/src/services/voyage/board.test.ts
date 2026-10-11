/**
 * @jest-environment node
 */
import { readBoard, submitRun } from "@/services/voyage/board/server";

const NOON = Date.parse("2026-10-11T12:00:00Z");

describe("the board's service", () => {
  test("puts a valid run on the day's board and says where it stands, keeping only initials and the score", async () => {
    const first = await submitRun({ day: "2026-10-11", initials: "abc", score: 500 }, "203.0.113.1", NOON);
    const second = await submitRun({ day: "2026-10-11", initials: "xyz", score: 900 }, "203.0.113.2", NOON);

    expect(first).toMatchObject({ rank: 1 });
    expect(second).toEqual({ day: "2026-10-11", entries: [{ initials: "XYZ", score: 900 }, { initials: "ABC", score: 500 }], rank: 1 });
    expect((await readBoard("2026-10-11")).entries).toHaveLength(2);
    expect(JSON.stringify(await readBoard("2026-10-11"))).not.toContain("203.0.113");
  });

  test("refuses a run that breaks the rules, and too many from one visitor", async () => {
    expect(await submitRun({ day: "2026-10-01", initials: "abc", score: 5 }, "203.0.113.9", NOON)).toEqual({ error: "invalid" });
    expect(await submitRun({ initials: "abc" }, "203.0.113.9", NOON)).toEqual({ error: "invalid" });

    const results = [];

    for (let run = 0; run < 8; run += 1) {
      results.push(await submitRun({ day: "2026-10-11", initials: "rep", score: 10 + run }, "203.0.113.50", NOON));
    }

    expect(results.some((result) => "error" in result && result.error === "busy")).toBe(true);
  });
});
