import type { VoyageSnapshot } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

export interface TelemetryRow {
  label: string;
  value: string;
}

const formatNumber = (value: number, digits = 0) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

// A real distance: millions of km once it is that far, plain km below.
export const formatDistance = (content: FinaleVoyage, km: number): string => (km >= 1e6
  ? fill(content.units.millionKm, { value: formatNumber(km / 1e6, 1) })
  : fill(content.units.km, { value: formatNumber(km) }));

// The readings worth showing right now, in real units: altitude only near a body, air only in it, time dilation
// only where clocks are measurably slow, the distance from the Sun only on the way out.
export const telemetryRows = (content: FinaleVoyage, snapshot: VoyageSnapshot): TelemetryRow[] => {
  const { telemetry, waypoint } = snapshot;
  const { telemetry: labels, units, stops } = content;
  const gravity = fill(units.gravity, { value: formatNumber(telemetry.gravity, telemetry.gravity < 0.1 ? 4 : 2) });
  const pulledBy = telemetry.dominant ? `, ${stops[telemetry.dominant] ?? telemetry.dominant}` : "";
  const rows: Array<TelemetryRow | null> = [
    { label: labels.gravity, value: `${gravity}${pulledBy}` },
    telemetry.altitudeKm !== null && telemetry.altitudeKm < 500000
      ? { label: labels.altitude, value: fill(units.altitude, { value: formatNumber(telemetry.altitudeKm) }) }
      : null,
    { label: labels.speed, value: fill(units.speed, { value: formatNumber(telemetry.speedKmS, 1) }) },
    telemetry.au !== null ? { label: labels.sun, value: fill(units.au, { value: formatNumber(telemetry.au, 2) }) } : null,
    telemetry.pressureBar !== null
      ? { label: labels.air, value: fill(units.pressure, { value: formatNumber(telemetry.pressureBar, telemetry.pressureBar < 0.01 ? 5 : 2) }) }
      : null,
    { label: labels.temperature, value: fill(units.temperature, { value: formatNumber(telemetry.hullTemperatureC) }) },
    telemetry.timeDilation > 1.005 ? { label: labels.dilation, value: fill(units.dilation, { value: formatNumber(telemetry.timeDilation, 2) }) } : null,
    waypoint ? { label: labels.next, value: `${stops[waypoint.id] ?? waypoint.id}, ${formatDistance(content, waypoint.distanceKm)}` } : null,
  ];

  return rows.filter((row): row is TelemetryRow => row !== null);
};
