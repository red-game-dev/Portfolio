// localStorage can be missing or blocked (private windows, previews, a full quota), so every read and write
// is guarded: a read that fails finds nothing, a write that fails is simply not remembered.

// Values are stored as JSON; one written as a plain string before that still reads back as that string.
const parseStored = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

// What is stored under `key`, if anything valid is.
export const readStored = <T>(key: string, isValid: (value: unknown) => value is T): T | null => {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw === null ? null : parseStored(raw);

    return isValid(value) ? value : null;
  } catch {
    return null;
  }
};

// Whether it was remembered.
export const writeStored = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));

    return true;
  } catch {
    return false;
  }
};
