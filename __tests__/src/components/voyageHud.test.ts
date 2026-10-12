import { hudLayout } from "@/components/Finale/Voyage/hud";

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
