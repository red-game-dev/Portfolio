// What an area's switch needs to know of each skill as the area opens, measured once per switch (never on scroll):
// the way back from its place to the middle of the tab picked (--from-x and --from-y, where a dealt card starts) and
// how far across the panel it stands in the way the switch runs (--x, 0 to 1, when the beam reaches it). Places are
// read from layout offsets, so a skill already moving is measured where it lands.

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
    at = at.offsetParent instanceof HTMLElement ? at.offsetParent : null;
  }

  return { x, y };
};

export const burstFrom = (from: Point, to: Point) => ({ x: Math.round(from.x - to.x), y: Math.round(from.y - to.y) });

// How far across a panel of `width` from `left` a point at `x` stands, 0 to 1, read in the way a switch runs.
export const acrossShare = (x: number, left: number, width: number, direction: 1 | -1): number => {
  const share = Math.min(1, Math.max(0, (x - left) / Math.max(width, 1)));

  return Number((direction === 1 ? share : 1 - share).toFixed(3));
};

export const aimBurst = (tab: HTMLElement, panel: HTMLElement, direction: 1 | -1 = 1) => {
  const tabBox = tab.getBoundingClientRect();
  const origin = { x: tabBox.left + window.scrollX + tabBox.width / 2, y: tabBox.top + window.scrollY + tabBox.height / 2 };
  const panelLeft = layoutCentreOf(panel).x - panel.offsetWidth / 2;

  panel.querySelectorAll<HTMLElement>("[data-switch-item]").forEach((item) => {
    const centre = layoutCentreOf(item);
    const { x, y } = burstFrom(origin, centre);

    item.style.setProperty("--from-x", `${x}px`);
    item.style.setProperty("--from-y", `${y}px`);
    item.style.setProperty("--x", String(acrossShare(centre.x, panelLeft, panel.offsetWidth, direction)));
  });
};
