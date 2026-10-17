// Where each skill bursts from as an area opens: the way back from its place to the middle of the tab picked,
// measured once per switch (never on scroll) and written as --from-x and --from-y on the skill, which the switch's
// burst starts from. Places are read from layout offsets, so a skill already moving is measured where it lands.

interface Point {
  x: number;
  y: number;
}

// An element's middle in the page from its layout offsets, so a transform on it does not move the answer.
export const layoutCentreOf = (element: HTMLElement): Point => {
  let x = element.offsetWidth / 2;
  let y = element.offsetHeight / 2;
  let at: HTMLElement | null = element;

  while (at) {
    x += at.offsetLeft;
    y += at.offsetTop;
    at = at.offsetParent as HTMLElement | null;
  }

  return { x, y };
};

export const burstFrom = (from: Point, to: Point) => ({ x: Math.round(from.x - to.x), y: Math.round(from.y - to.y) });

export const aimBurst = (tab: HTMLElement, panel: HTMLElement) => {
  const tabBox = tab.getBoundingClientRect();
  const origin = { x: tabBox.left + window.scrollX + tabBox.width / 2, y: tabBox.top + window.scrollY + tabBox.height / 2 };

  panel.querySelectorAll<HTMLElement>("[data-switch-item]").forEach((item) => {
    const { x, y } = burstFrom(origin, layoutCentreOf(item));

    item.style.setProperty("--from-x", `${x}px`);
    item.style.setProperty("--from-y", `${y}px`);
  });
};
