import type { GlobeLook, StarLook } from "@/packages/graphics/globe";

// How each body looks. Every one has a recipe the GPU paints by itself; the ones with real maps name them, and
// a host that hands the game those maps (`VoyageGame.setTexture`) gets the real surfaces: Earth with its clouds
// and city lights, the Moon, Mars, Mercury, Jupiter and Pluto. The rest are painted to match what spacecraft
// have seen of them.
export const BODY_LOOKS: Record<string, GlobeLook> = {
  mercury: {
    surface: { kind: "cratered", palette: ["#3e3a36", "#6e6862", "#9c958c", "#c9c2b8"], seed: 11, map: "mercury", centreLongitude: 180 },
  },
  venus: {
    surface: { kind: "haze", palette: ["#b88f4f", "#d9b679", "#ecd7a6", "#f8eed2"], seed: 12 },
    atmosphere: { colour: "#ffe6b0", thickness: 0.08, density: 0.95, sunset: "#ffb060" },
  },
  earth: {
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
  },
  moon: {
    surface: { kind: "cratered", palette: ["#4a4a4e", "#7d7d80", "#a9a9a6", "#d2d2cc"], seed: 14, map: "moon", centreLongitude: 0 },
  },
  mars: {
    surface: { kind: "desert", palette: ["#5a1e0c", "#9a3d17", "#c8693a", "#e8b08a"], seed: 15, caps: 0.12, map: "mars", centreLongitude: 0 },
    atmosphere: { colour: "#e8a07a", thickness: 0.035, density: 0.35, sunset: "#6fa0ff" },
  },
  jupiter: {
    surface: { kind: "gas", palette: ["#6b4a32", "#b08560", "#e6d2b0", "#f6eee0"], seed: 16, bands: 0.55, turbulence: 0.6, map: "jupiter", centreLongitude: 0 },
    atmosphere: { colour: "#f2d8b0", thickness: 0.03, density: 0.3 },
    rings: { inner: 1.32, outer: 3.2, colour: "#8a7a68", opacity: 0.08, seed: 1 },
  },
  io: { surface: { kind: "volcanic", palette: ["#3a2a10", "#c8a23c", "#e8d27a", "#ff7a2a"], seed: 17 } },
  europa: { surface: { kind: "icy", palette: ["#7a4a2a", "#c9b9a0", "#e8e2d6", "#f6f4ee"], seed: 18 } },
  ganymede: { surface: { kind: "cratered", palette: ["#4a4038", "#7d7266", "#a89c8e", "#d8d0c4"], seed: 19 } },
  callisto: { surface: { kind: "cratered", palette: ["#2c2620", "#4e443a", "#76695a", "#b8ab98"], seed: 20 } },
  saturn: {
    surface: { kind: "gas", palette: ["#9c8058", "#cdb48a", "#e8d6b0", "#f4ead2"], seed: 21, bands: 0.7, turbulence: 0.25 },
    atmosphere: { colour: "#f0dcb0", thickness: 0.03, density: 0.3 },
    rings: { inner: 1.28, outer: 2.35, colour: "#e6d6b6", opacity: 0.85, seed: 3 },
  },
  titan: {
    surface: { kind: "haze", palette: ["#7a4a14", "#b8782a", "#d9a04a", "#ecc070"], seed: 22 },
    atmosphere: { colour: "#e8a040", thickness: 0.12, density: 1, sunset: "#ff9030" },
  },
  uranus: {
    surface: { kind: "iceGiant", palette: ["#5fa8b8", "#86c8d4", "#a8dce4", "#d4f0f4"], seed: 23, bands: 0.2, turbulence: 0.15 },
    atmosphere: { colour: "#a8e8f0", thickness: 0.04, density: 0.5 },
    rings: { inner: 1.65, outer: 2.02, colour: "#4a5058", opacity: 0.35, seed: 5 },
  },
  neptune: {
    surface: { kind: "iceGiant", palette: ["#1b2f8a", "#2f56c8", "#4a7fe0", "#a9c4ff"], seed: 24, bands: 0.4, turbulence: 0.3 },
    atmosphere: { colour: "#7aa8ff", thickness: 0.04, density: 0.5 },
    rings: { inner: 1.7, outer: 2.56, colour: "#5a6070", opacity: 0.12, seed: 7 },
  },
  triton: { surface: { kind: "icy", palette: ["#8a6a6a", "#c9b0aa", "#e8dcd8", "#f8f0ee"], seed: 25 } },
  pluto: {
    surface: { kind: "icy", palette: ["#5a2a1a", "#a07858", "#d8c4b0", "#f0e6dc"], seed: 26, map: "pluto", centreLongitude: 180 },
    atmosphere: { colour: "#9ab8ff", thickness: 0.05, density: 0.15 },
  },
  charon: { surface: { kind: "cratered", palette: ["#3a3434", "#6a6262", "#948a88", "#bcb4b0"], seed: 27 } },
};

export const SUN_LOOK: StarLook = { temperatureK: 5772, granulation: 1, spots: 0.6, corona: 0.85, seed: 9 };

// Every map the looks above name, so a host knows which files to hand over.
export const TEXTURE_IDS: readonly string[] = Array.from(new Set(Object.values(BODY_LOOKS).flatMap(({ surface }) => [surface.map, surface.night, surface.clouds])
  .filter((id): id is string => typeof id === "string")));
