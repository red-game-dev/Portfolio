import { wrap } from "@/packages/math/clamp";

// A whole number padded to two digits, as clocks write hours, minutes and seconds.
export const twoDigits = (value: number): string => String(Math.floor(Math.abs(value))).padStart(2, "0");

// A length of time as a clock shows it: "4:07", or with hours, "00:04:07" as a launch broadcast counts it.
export const formatDuration = (seconds: number, { withHours = false }: { withHours?: boolean } = {}): string => {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);

  return withHours ? `${twoDigits(whole / 3600)}:${twoDigits(minutes % 60)}:${twoDigits(whole % 60)}` : `${minutes}:${twoDigits(whole % 60)}`;
};

// A time of day given in hours, "16:20" (wrapping past midnight).
export const formatHours = (hours: number): string => {
  const minutes = Math.floor(wrap(hours, 24) * 60);

  return `${twoDigits(minutes / 60)}:${twoDigits(minutes % 60)}`;
};

// The time of day somewhere, "23:24", on that place's own clock (an IANA zone such as "America/New_York"); empty
// for a zone the browser does not know.
export const formatLocalTime = (timeZone: string, at: Date | number = Date.now()): string => {
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).format(at);
  } catch {
    return "";
  }
};

// A date and time, "9 Oct 2026, 12:00", on a zone's clock (UTC unless told otherwise).
export const formatDateTime = (at: Date | number, timeZone = "UTC"): string => {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .format(at);
  } catch {
    return "";
  }
};

// The calendar day in UTC as "2026-10-09", the same everywhere on Earth at that moment.
export const utcDay = (at: Date | number): string => {
  const date = new Date(at);

  return `${date.getUTCFullYear()}-${twoDigits(date.getUTCMonth() + 1)}-${twoDigits(date.getUTCDate())}`;
};
