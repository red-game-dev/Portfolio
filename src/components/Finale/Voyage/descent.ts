import type { DescentView } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// A height: kilometres from one up, metres below.
const formatHeight = (content: FinaleVoyage, metres: number): string => (metres >= 1000
  ? fill(content.units.km, { value: formatNumber(metres / 1000, metres < 10000 ? 1 : 0) })
  : fill(content.units.metres, { value: formatNumber(metres) }));

const formatSpeed = (content: FinaleVoyage, speed: number): string => fill(content.units.metresPerSecond, { value: formatNumber(speed, speed < 10 ? 1 : 0) });

// The way down, line by line for the card: how high, how fast and how fast falling, the load once the crew would
// feel it, and how fast the clock is running.
export const descentRows = (content: FinaleVoyage, view: DescentView): string[] => {
  const { descent } = content;
  const rows = [
    fill(descent.altitude, { value: formatHeight(content, view.altitude) }),
    fill(descent.speed, { value: formatSpeed(content, view.speed) }),
    fill(descent.fall, { value: formatSpeed(content, view.fall) }),
  ];

  if (view.load >= 0.1) {
    rows.push(fill(descent.load, { value: formatNumber(view.load, 1, true) }));
  }

  rows.push(view.pace > 1 ? fill(descent.pace, { pace: formatNumber(view.pace) }) : descent.realTime);

  return rows;
};

// What the pilot can do on this way down: their hand on the burn (and how much is left), which lands it even under
// fire; get away when the ground is firing; the guidance flying with the pilot to take over at the low gate; the
// guidance flying; or nothing to fly where there is no engine.
export const descentHint = (content: FinaleVoyage, view: DescentView, isManual: boolean): string[] => {
  const { descent } = content;

  if (view.isPilot) {
    return [fill(descent.pilot, { safe: formatNumber(view.safeSpeed) }), fill(descent.reserve, { seconds: view.reserve })];
  }

  if (view.isUnderFire) {
    return [descent.underFire];
  }

  if (!isManual) {
    return [descent.flown];
  }

  return [view.canFly ? descent.takeOver : descent.unflown];
};

// How it is coming down: home's own way for a crew, or the way this kind of world is landed on.
export const descentMethod = (content: FinaleVoyage, view: DescentView, isHome: boolean): string =>
  (isHome ? content.descent.home : content.descent.methods[view.method]);
