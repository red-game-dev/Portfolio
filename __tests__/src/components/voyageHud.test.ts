import { boxesKey, coveredBoxes, hudLayout } from "@/components/Finale/Voyage/hud";

describe("hudLayout", () => {
  it("keeps the full HUD on a screen with room, unless compact is asked for", () => {
    expect(hudLayout("auto", false, false)).toEqual({ canCompact: false, isCompact: false });
    expect(hudLayout("compact", false, false)).toEqual({ canCompact: true, isCompact: true });
  });

  it("is compact by itself on a small screen, unless full is asked for", () => {
    expect(hudLayout("auto", true, false)).toEqual({ canCompact: true, isCompact: true });
    expect(hudLayout("full", true, false)).toEqual({ canCompact: false, isCompact: false });
  });

  it("opens in full from its info button wherever it can be compact", () => {
    expect(hudLayout("auto", true, true)).toEqual({ canCompact: true, isCompact: false });
    expect(hudLayout("compact", false, true)).toEqual({ canCompact: true, isCompact: false });
    expect(hudLayout("full", false, true)).toEqual({ canCompact: false, isCompact: false });
  });
});

describe("coveredBoxes", () => {
  const stage = { left: 10, top: 20, right: 400, bottom: 864, width: 390, height: 844 };

  it("gives each panel shown as a box from the stage's top left, and leaves out those not shown", () => {
    const bar = { left: 340, top: 285, right: 390, bottom: 600, width: 50, height: 315 };
    const hidden = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };

    expect(coveredBoxes(stage, [bar, hidden])).toEqual([{ left: 330, top: 265, right: 380, bottom: 580 }]);
  });

  it("keys the boxes by their whole pixels, so a box is handed on again only when it moves", () => {
    const box = { left: 330.2, top: 265, right: 380, bottom: 580 };

    expect(boxesKey([box])).toBe(boxesKey([{ ...box, left: 329.9 }]));
    expect(boxesKey([box])).not.toBe(boxesKey([{ ...box, top: 300 }]));
  });
});
