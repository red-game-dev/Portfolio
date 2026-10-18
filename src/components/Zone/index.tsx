import { FC, ReactNode } from "react";

import type { ZoneId } from "@/config/zones";

interface ZoneProps {
  zone: ZoneId;
  children: ReactNode;
}

// A run of the journey's sections in one zone (ZONE_BOUNDARIES), which takes that zone's accent (globals.css) however
// far the reader has gone. Crossing into another zone then restyles only what follows the journey (FollowsJourney),
// never the sections up and down the page, which a slow phone would feel as a freeze at each crossing. It draws no box
// of its own, so the sections lay out as if it were not there.
export const Zone: FC<ZoneProps> = ({ zone, children }) => (
  <div data-zone={zone} style={{ display: "contents" }}>
    {children}
  </div>
);

// What lies outside every run and takes the zone the reader is in (the root's data-journey, set by the Journey), its
// accent animating across: the header, the page's end and footer, the journey's bars, trail and HUD. Only these are
// restyled at a crossing; the root itself takes nothing from the zone, or every element of the page would be. It draws
// no box of its own either.
export const FollowsJourney: FC<{ children: ReactNode }> = ({ children }) => (
  <div data-follows-journey="" style={{ display: "contents" }}>
    {children}
  </div>
);
