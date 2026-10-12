/**
 * @jest-environment node
 */
import { newProfile, pilotEnvelope, readPilot } from "@/packages/games/voyage";
import { pilotSavedOf } from "@/services/voyage/channel";
import { PILOT_ANCHOR, pilotFile, pilotLink, readPilotFile, readPilotLink, summarisePilot } from "@/services/voyage/pilot";

describe("moving a pilot to another device", () => {
  const pilot = { ...newProfile(), level: 7 };

  test("a link carries the pilot in its fragment and reads back whole", async () => {
    const link = await pilotLink(pilot);
    const hash = link.slice(link.indexOf("#"));

    expect(link.startsWith("https://www.redgame.dev/#")).toBe(true);
    expect(hash.startsWith(`#${PILOT_ANCHOR}`)).toBe(true);
    await expect(readPilotLink(hash)).resolves.toEqual(pilot);
  });

  test("a file carries it as well", async () => {
    await expect(readPilotFile(pilotFile(pilot))).resolves.toEqual(pilot);
  });

  test("anything else, or a pilot from a newer release, is refused", async () => {
    await expect(readPilotLink("#section-roster")).resolves.toBeNull();
    await expect(readPilotLink(`#${PILOT_ANCHOR}zgarbage`)).resolves.toBeNull();
    await expect(readPilotFile(new Blob(["{\"version\": 4, \"data\": {\"level\": \"high\"}}"]))).resolves.toBeNull();
    expect(readPilot({ ...pilotEnvelope(pilot), version: 99 })).toBeNull();
  });

  test("a link or file too large to be a pilot is refused before it is read", async () => {
    await expect(readPilotLink(`#${PILOT_ANCHOR}j${"a".repeat(300 * 1024)}`)).resolves.toBeNull();
    await expect(readPilotFile(new Blob(["x".repeat(1024 * 1024 + 1)]))).resolves.toBeNull();
  });

  test("a save on the channel is read whether it says the pilot was replaced or comes from an older tab", () => {
    expect(pilotSavedOf({ savedAt: 5, isReplaced: true })).toEqual({ savedAt: 5, isReplaced: true });
    expect(pilotSavedOf(7)).toEqual({ savedAt: 7, isReplaced: false });
    expect(pilotSavedOf("hello")).toBeNull();
  });

  test("a pilot is summed up by its own level and its ship's", () => {
    expect(summarisePilot(pilot)).toEqual({ level: 1, ship: 8 });
  });
});
