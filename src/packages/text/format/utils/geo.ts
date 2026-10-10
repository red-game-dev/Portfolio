import { formatNumber } from "./numbers";

// A place on a world as "28.6° N, 80.6° W": degrees north or south, then east or west, to a tenth.
export const formatLatLon = (latitude: number, longitude: number): string =>
  `${formatNumber(Math.abs(latitude), 1, true)}° ${latitude < 0 ? "S" : "N"}, ${formatNumber(Math.abs(longitude), 1, true)}° ${longitude < 0 ? "W" : "E"}`;
