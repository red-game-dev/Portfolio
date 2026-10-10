import { MemoryAdapter } from "@/packages/browser/store";
import {
  BAR_SLOTS,
  Career,
  codexId,
  DEFAULT_VOYAGE_THEME,
  Hangar,
  isPilotProfile,
  MAX_CHARGES,
  newBar,
  newCareer,
  newEconomyProfile,
  newProfile,
  PilotLink,
  PilotRepository,
  VoyageGame,
  VoyageNotice,
  VoyageRenderer,
  VoyageSimulation,
} from "@/packages/games/voyage";

import { createFlying, EPOCH } from "./fixtures/simulation";

// A renderer that draws nothing: every method a no-op (one that hands back a way to stop listening, a no-op too),
// and no surface under the ship.
const silentRenderer = (): VoyageRenderer => new Proxy({}, { get: (_, key) => (key === "surface" ? null : () => () => undefined) }) as unknown as VoyageRenderer;

// A host round a calm run already flying, with the pilot's hangar, its notices kept.
const hostFor = (simulation: VoyageSimulation, hangar: Hangar) => {
  const notices: VoyageNotice[] = [];
  const scheduler = { request: () => 0, cancel: () => undefined };
  const game = new VoyageGame(simulation, silentRenderer(), null, null, DEFAULT_VOYAGE_THEME, { hangar, scheduler, onNotice: (notice) => notices.push(notice) });

  return { game, notices };
};

describe("voyage loadout", () => {
  test("a new pilot's bar holds the starter fuel cell and repair kit, two slots left for boosts", () => {
    const hangar = new Hangar(newProfile());

    expect(newBar()).toHaveLength(BAR_SLOTS);
    expect(hangar.view().bar.map((row) => row.slot)).toEqual([{ kind: "item", id: "fuelCell" }, { kind: "item", id: "repairKit" }, null, null]);
    expect(hangar.view().bar.map((row) => row.count)).toEqual([1, 1, 0, 0]);
    expect(hangar.view().boosts).toEqual([]);
  });

  test("each core found is a charge and a find: the first takes an empty slot, more raise the level, charges stop at the most carried", () => {
    const hangar = new Hangar(newProfile());
    const first = hangar.findBoost("afterburner");

    expect(first).toEqual({ level: 1, charges: 1, isFirst: true, isLevelUp: false });
    expect(hangar.slot(2)).toEqual({ kind: "boost", id: "afterburner" });

    expect(hangar.findBoost("afterburner")).toMatchObject({ level: 1, isLevelUp: false });
    expect(hangar.findBoost("afterburner")).toMatchObject({ level: 2, isLevelUp: true, charges: 3 });

    Array.from({ length: 12 }, () => hangar.findBoost("afterburner"));
    expect(hangar.boostCharges("afterburner")).toBe(MAX_CHARGES);
    expect(hangar.boostLevel("afterburner")).toBe(5);
    expect(hangar.view().boosts[0]).toMatchObject({ id: "afterburner", finds: 15, level: 5, nextAt: null, max: MAX_CHARGES });

    // A second boost takes the last empty slot; a third finds none and waits in the Loadout.
    hangar.findBoost("tractor");
    hangar.findBoost("decoy");
    expect(hangar.view().bar.map((row) => row.slot?.id ?? null)).toEqual(["fuelCell", "repairKit", "afterburner", "tractor"]);
    expect(hangar.view().boosts.map((row) => row.id)).toEqual(["afterburner", "tractor", "decoy"]);
  });

  test("a charge is spent only while there is one", () => {
    const hangar = new Hangar(newProfile());

    expect(hangar.spendBoost("cloak")).toBe(false);
    hangar.findBoost("cloak");
    expect(hangar.spendBoost("cloak")).toBe(true);
    expect(hangar.boostCharges("cloak")).toBe(0);
    expect(hangar.spendBoost("cloak")).toBe(false);
    // Spent, it keeps its level and its slot.
    expect(hangar.boostLevel("cloak")).toBe(1);
    expect(hangar.slot(2)).toEqual({ kind: "boost", id: "cloak" });
  });

  test("a slot takes a boost found or a thing that does something; one already on the bar moves, swapping with what was there", () => {
    const hangar = new Hangar(newProfile());

    hangar.findBoost("prism");

    expect(hangar.setSlot(0, { kind: "boost", id: "warpJump" })).toBe(false);
    expect(hangar.setSlot(0, { kind: "item", id: "scrap" })).toBe(false);
    expect(hangar.setSlot(BAR_SLOTS, { kind: "item", id: "shieldCell" })).toBe(false);
    expect(hangar.setSlot(-1, null)).toBe(false);

    expect(hangar.setSlot(0, { kind: "boost", id: "prism" })).toBe(true);
    expect(hangar.view().bar.map((row) => row.slot?.id ?? null)).toEqual(["prism", "repairKit", "fuelCell", null]);

    expect(hangar.setSlot(3, { kind: "item", id: "shieldCell" })).toBe(true);
    expect(hangar.setSlot(1, null)).toBe(true);
    expect(hangar.view().bar.map((row) => row.slot?.id ?? null)).toEqual(["prism", null, "fuelCell", "shieldCell"]);
    // A thing not in the hold still sits on the bar, with none left.
    expect(hangar.view().bar[3]).toMatchObject({ count: 0, level: 0, colour: null });
    expect(hangar.view().bar[0].colour).toMatch(/^#[0-9a-f]{6}$/);
  });

  test("boosts and the bar are kept in the profile, and read back with anything that no longer fits left out", () => {
    const hangar = new Hangar(newProfile());

    hangar.findBoost("gravityWell");
    hangar.findBoost("gravityWell");

    const profile = { ...newProfile(), ...hangar.toProfile() };

    expect(isPilotProfile(profile)).toBe(true);

    const again = new Hangar(profile);

    expect(again.boostCharges("gravityWell")).toBe(2);
    expect(again.slot(2)).toEqual({ kind: "boost", id: "gravityWell" });

    const odd = new Hangar({
      ...profile,
      bar: [{ kind: "item", id: "scrap" }, null, { kind: "boost", id: "heatSink" }],
      boosts: { gravityWell: { charges: 40, finds: 2 } },
    });

    expect(odd.view().bar.map((row) => row.slot)).toEqual([null, null, null, null]);
    expect(odd.boostCharges("gravityWell")).toBe(MAX_CHARGES);
  });

  test("the guard turns away boosts it does not know and bars that are not slots", () => {
    const profile = newProfile();

    expect(isPilotProfile({ ...profile, boosts: { hyperdrive: { charges: 1, finds: 1 } } })).toBe(false);
    expect(isPilotProfile({ ...profile, boosts: { cloak: { charges: -1, finds: 1 } } })).toBe(false);
    expect(isPilotProfile({ ...profile, bar: [{ kind: "boost", id: "hyperdrive" }] })).toBe(false);
    expect(isPilotProfile({ ...profile, bar: [{ kind: "weapon", id: "railgun" }] })).toBe(false);
    expect(isPilotProfile({ ...profile, bar: "fuelCell" })).toBe(false);
  });

  test("a profile kept before boosts is brought up with none found and a new pilot's bar, its hangar and career kept", async () => {
    const adapter = new MemoryAdapter();
    const { boosts, bar, ...older } = { ...newEconomyProfile(), level: 6, career: { ...newCareer(), xp: 120 } };

    expect([boosts, bar]).toEqual([{}, newBar()]);
    await adapter.set("pilot", { version: 2, data: older });

    const profile = await new PilotRepository(adapter).load();

    expect(isPilotProfile(profile)).toBe(true);
    expect(profile.level).toBe(6);
    expect(profile.career.xp).toBe(120);
    expect(profile.boosts).toEqual({});
    expect(profile.bar).toEqual(newBar());
  });

  test("the pilot link puts each core found in the hangar and the codex, and says so", () => {
    const simulation = createFlying();
    const hangar = new Hangar(newProfile());
    const career = new Career();
    const notices: VoyageNotice[] = [];
    const link = new PilotLink({ simulation, hangar, career, nameOf: (id) => id, notify: (notice) => notices.push(notice), refresh: () => undefined });

    link.attach();
    link.startRun();
    simulation.events.emit("boostFound", { boost: "solarSail", x: 0, y: 0 });

    expect(hangar.boostCharges("solarSail")).toBe(1);
    expect(career.hasFound(codexId("boosts", "solarSail"))).toBe(true);
    expect(notices).toContainEqual({ kind: "boostFound", boost: "solarSail", level: 1, charges: 1, isFirst: true, isLevelUp: false });
    // The find is announced, so the codex takes it quietly.
    expect(notices.some((notice) => notice.kind === "discovered" && notice.entry === codexId("boosts", "solarSail"))).toBe(false);
  });

  test("a slot sets off its boost and spends a charge only when the run takes it, and says why when it does not", () => {
    const simulation = createFlying();
    const hangar = new Hangar(newProfile());
    const { game, notices } = hostFor(simulation, hangar);

    simulation.start(EPOCH);
    hangar.findBoost("afterburner");
    hangar.findBoost("afterburner");

    expect(game.act({ kind: "slot", index: 2 })).toBe(true);
    expect(hangar.boostCharges("afterburner")).toBe(1);
    expect(simulation.state.boosts.map((active) => active.id)).toEqual(["afterburner"]);

    // Still cooling down: nothing spent, and the reason said.
    expect(game.act({ kind: "slot", index: 2 })).toBe(false);
    expect(hangar.boostCharges("afterburner")).toBe(1);
    expect(notices.at(-1)).toMatchObject({ kind: "slotRefused", reason: "cooling", slot: { kind: "boost", id: "afterburner" } });

    // An empty slot does nothing; a thing the ship does not need stays in the hold.
    expect(game.act({ kind: "slot", index: 3 })).toBe(false);
    expect(game.act({ kind: "slot", index: 1 })).toBe(false);
    expect(hangar.count("repairKit")).toBe(1);
    expect(notices.at(-1)).toMatchObject({ kind: "slotRefused", reason: "unneeded" });

    hangar.spendBoost("afterburner");
    simulation.step(60_000);
    expect(game.act({ kind: "slot", index: 2 })).toBe(false);
    expect(notices.at(-1)).toMatchObject({ kind: "slotRefused", reason: "empty" });

    expect(game.act({ kind: "setSlot", index: 3, slot: { kind: "item", id: "fuelCell" } })).toBe(true);
    expect(hangar.slot(0)).toBeNull();
    game.dispose();
  });
});
