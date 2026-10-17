import { burstFrom, layoutCentreOf } from "@/components/SkillAreas/burst";

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

describe("the skills' burst", () => {
  it("finds a skill's middle from its layout offsets up the chain, so a transform on it changes nothing", () => {
    const page = box({ left: 100, top: 1000, width: 800, height: 600 });
    const skill = box({ left: 40, top: 20, width: 60, height: 24 }, page);

    expect(layoutCentreOf(skill)).toEqual({ x: 170, y: 1032 });
  });

  it("aims each skill from its place back to the tab", () => {
    expect(burstFrom({ x: 120, y: 980 }, { x: 170, y: 1032 })).toEqual({ x: -50, y: -52 });
  });
});
