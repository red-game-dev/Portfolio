import { acrossShare, burstFrom, layoutCentreOf } from "@/components/SkillAreas/burst";
import { AREA_EFFECTS, isThemeEffect } from "@/components/SwitchStage/config";
import { portfolioData } from "@/data/resume";

const box = (offsets: { left: number; top: number; width: number; height: number }, parent: HTMLElement | null = null) => {
  const element = document.createElement("div");

  Object.defineProperties(element, {
    offsetLeft: { value: offsets.left },
    offsetTop: { value: offsets.top },
    offsetWidth: { value: offsets.width },
    offsetHeight: { value: offsets.height },
    offsetParent: { value: parent },
  });

  return element;
};

describe("the skill areas' switch", () => {
  it("finds a skill's middle from its layout offsets up the chain, so a transform on it changes nothing", () => {
    const page = box({ left: 100, top: 1000, width: 800, height: 600 });
    const skill = box({ left: 40, top: 20, width: 60, height: 24 }, page);

    expect(layoutCentreOf(skill)).toEqual({ x: 170, y: 1032 });
  });

  it("aims each skill from its place back to the tab", () => {
    expect(burstFrom({ x: 120, y: 980 }, { x: 170, y: 1032 })).toEqual({ x: -50, y: -52 });
  });

  it("reads how far across the panel a skill stands in the way the switch runs, for the beam to reach it then", () => {
    expect(acrossShare(150, 100, 200, 1)).toBe(0.25);
    expect(acrossShare(150, 100, 200, -1)).toBe(0.75);
    expect(acrossShare(50, 100, 200, 1)).toBe(0);
  });

  it("opens every area in the way of its universe, each universe its own way", () => {
    portfolioData.skillAreas.forEach((area) => expect(isThemeEffect(AREA_EFFECTS[area.universe])).toBe(true));
    expect(new Set(Object.values(AREA_EFFECTS)).size).toBe(Object.keys(AREA_EFFECTS).length);
  });
});
