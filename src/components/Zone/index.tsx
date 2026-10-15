import { FC, ReactNode } from "react";

import type { ZoneId } from "@/config/zones";

interface ZoneProps {
  zone: ZoneId;
  children: ReactNode;
}

// A run of the journey's sections in one zone (ZONE_BOUNDARIES), which takes that zone's accent (globals.css) however
// far the reader has gone. Crossing into another zone then restyles only what lies outside every run (the header,
// the trail, the game HUD), never the sections up and down the page, which a slow phone would feel as a freeze at
// each crossing. It draws no box of its own, so the sections lay out as if it were not there.
export const Zone: FC<ZoneProps> = ({ zone, children }) => (
  <div data-zone={zone} style={{ display: "contents" }}>
    {children}
  </div>
);
