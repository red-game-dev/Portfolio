import type { VoyageSnapshot } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

export interface TelemetryRow {
  label: string;
  value: string;
  // Shown on narrow screens too; the rest only where there is room.
  isKey: boolean;
}

// Below this share of their integrity the sensors read nothing.
const SENSORS_DARK = 0.25;

const formatNumber = (value: number, digits = 0) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

const CLOCK = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

// A real distance: millions of km once it is that far, plain km below.
export const formatDistance = (content: FinaleVoyage, km: number): string => (km >= 1e6
  ? fill(content.units.millionKm, { value: formatNumber(km / 1e6, 1) })
  : fill(content.units.km, { value: formatNumber(km) }));

// The mission clock as a date and time in UTC.
export const formatClock = (content: FinaleVoyage, ms: number): string => fill(content.units.clock, { date: CLOCK.format(ms) });

// The readings worth showing right now, in real units: altitude only near a body, air only in it, sunlight only
// in the solar system, time dilation only where clocks are measurably slow. With the sensors gone, everything
// they measure reads no signal; the clock and the hull's own temperature still read.
export const telemetryRows = (content: FinaleVoyage, snapshot: VoyageSnapshot): TelemetryRow[] => {
  const { telemetry, waypoint, modules } = snapshot;
  const { telemetry: labels, units, stops } = content;
  const isDark = modules.sensors < SENSORS_DARK;
  const sense = (value: string) => (isDark ? labels.noSignal : value);
  const gravity = fill(units.gravity, { value: formatNumber(telemetry.gravity, telemetry.gravity < 0.1 ? 4 : 2) });
  const pulledBy = telemetry.dominant ? `, ${stops[telemetry.dominant] ?? telemetry.dominant}` : "";
  const rows: Array<TelemetryRow | null> = [
    { label: labels.clock, value: formatClock(content, telemetry.missionTime), isKey: false },
    { label: labels.gravity, value: sense(`${gravity}${pulledBy}`), isKey: true },
    telemetry.altitudeKm !== null && telemetry.altitudeKm < 500000
      ? { label: labels.altitude, value: sense(fill(units.altitude, { value: formatNumber(telemetry.altitudeKm) })), isKey: false }
      : null,
    { label: labels.speed, value: sense(fill(units.speed, { value: formatNumber(telemetry.speedKmS, 1) })), isKey: true },
    telemetry.au !== null ? { label: labels.sun, value: sense(fill(units.au, { value: formatNumber(telemetry.au, 2) })), isKey: false } : null,
    telemetry.pressureBar !== null
      ? { label: labels.air, value: sense(fill(units.pressure, { value: formatNumber(telemetry.pressureBar, telemetry.pressureBar < 0.01 ? 5 : 2) })), isKey: true }
      : null,
    { label: labels.temperature, value: fill(units.temperature, { value: formatNumber(telemetry.hullTemperatureC) }), isKey: true },
    { label: labels.outside, value: sense(fill(units.temperature, { value: formatNumber(telemetry.outsideC) })), isKey: false },
    telemetry.sunlight !== null ? { label: labels.sunlight, value: sense(fill(units.sunlight, { value: formatNumber(telemetry.sunlight) })), isKey: false } : null,
    { label: labels.radiation, value: sense(fill(units.radiation, { value: formatNumber(telemetry.radiation) })), isKey: false },
    telemetry.timeDilation > 1.005
      ? { label: labels.dilation, value: sense(fill(units.dilation, { value: formatNumber(telemetry.timeDilation, 2) })), isKey: true }
      : null,
    waypoint
      ? { label: labels.next, value: sense(`${waypoint.name ?? stops[waypoint.id] ?? waypoint.id}, ${formatDistance(content, waypoint.distanceKm)}`), isKey: true }
      : null,
  ];

  return rows.filter((row): row is TelemetryRow => row !== null);
};
