import { GlobeLook } from "../domain/types";

// Earth from space: the Blue Marble by day, its city lights by night and its clouds drifting over both (the maps'
// ids, which the host hands over with `setTexture`), sea that shows the Sun's glint, and a blue limb going orange
// at sunset. Until the maps arrive, a terran recipe in Earth's colours stands in.
export const EARTH_LOOK: GlobeLook = {
  surface: {
    kind: "terran",
    palette: ["#0b2a5e", "#1f5fa8", "#3d7a45", "#c9b88a"],
    seed: 13,
    sea: 0.62,
    caps: 0.18,
    map: "earth-day",
    night: "earth-night",
    clouds: "earth-clouds",
    centreLongitude: 0,
    glint: true,
  },
  atmosphere: { colour: "#6fb2ff", thickness: 0.07, density: 0.9, sunset: "#ff7a3a" },
  clouds: 0.85,
  cloudDrift: 0.004,
};
