import { Setting } from "../domain/types";

const ON = new Set(["on", "true", "yes", "1"]);
const OFF = new Set(["off", "false", "no", "0"]);

// A value typed or stored for a setting, as the setting holds it, or null when it is not one of its values: an
// option of a choice (in any case), or on and off (or yes and no, true and false) for a switch.
export const parseValue = (setting: Setting, raw: unknown): string | boolean | null => {
  if (setting.kind === "toggle") {
    if (typeof raw === "boolean") {
      return raw;
    }

    const word = typeof raw === "string" ? raw.trim().toLowerCase() : "";

    return ON.has(word) ? true : OFF.has(word) ? false : null;
  }

  if (typeof raw !== "string") {
    return null;
  }

  const word = raw.trim().toLowerCase();

  return setting.options.find((option) => option.toLowerCase() === word) ?? null;
};

// A value as it is written for a reader: the option itself, or on and off.
export const formatValue = (value: string | boolean): string => (typeof value === "boolean" ? (value ? "on" : "off") : value);
