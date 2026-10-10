import { HOME_WORLD, SystemBody } from "../domain/content";
import { airFromSurface, LandingWorld } from "../landing";

// A world as a landing reads it, in real units: its surface gravity, its real radius, and its air near the ground
// from the pressure, temperature and gas the source gives (a giant has no ground, so none). Whether the spot is
// water is learnt from the surface once it is seen.
export const landingWorldOf = (place: SystemBody, isSolar: boolean): LandingWorld => ({
  gravity: place.surfaceGravity,
  radius: place.radius * place.kmPerUnit * 1000,
  air: place.air && place.air.kind !== "giant" ? airFromSurface(place.air.pressureBar, place.air.temperatureC, place.air.molarMass, place.surfaceGravity) : null,
  isHome: isSolar && place.id === HOME_WORLD,
  isWater: false,
});
