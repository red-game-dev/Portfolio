import { AirData, AirModel } from "../domain/content";

// How high each kind of air reaches, as a share of the radius, and the pressure left at its top.
const AIR_TOP: Record<AirData["kind"], number> = { thin: 0.14, thick: 0.3, giant: 0.4 };
const TOP_PRESSURE_BAR = 0.02;

const kelvin = (celsius: number) => celsius + 273.15;

// A body's air in world units: its real pressure and temperatures, falling off to almost nothing at the top,
// with a density (against Earth's at sea level) from pressure over temperature.
export const airModel = (data: AirData, radius: number): AirModel => {
  const top = AIR_TOP[data.kind] * radius;
  const topPressure = Math.min(TOP_PRESSURE_BAR, data.pressureBar * 0.01);

  return {
    ...data,
    top,
    scaleHeight: top / Math.log(data.pressureBar / topPressure),
    surfaceDensity: data.pressureBar * (288 / kelvin(data.temperatureC)),
  };
};
