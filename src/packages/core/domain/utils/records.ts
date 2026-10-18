// Records whose keys are a known set (a union of strings), read and built in their own types, with no assertion: the
// keys come back as that union, and a record built from a list of keys is checked to hold every one before it is
// handed back.

// The record's own keys, as the union they are typed by.
export const keysOf = <K extends string>(record: Readonly<Record<K, unknown>>): K[] => {
  const keys: K[] = [];

  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      keys.push(key);
    }
  }

  return keys;
};

// The record's own entries, each key in its union and its value in the record's type.
export const entriesOf = <K extends string, V>(record: Readonly<Record<K, V>>): Array<[K, V]> =>
  keysOf(record).map((key): [K, V] => [key, record[key]]);

const hasEvery = <K extends string, V>(record: Partial<Record<K, V>>, keys: readonly K[]): record is Record<K, V> =>
  keys.every((key) => Object.prototype.hasOwnProperty.call(record, key));

// A record with a value for every key in `keys`, made by `make`.
export const recordOf = <K extends string, V>(keys: readonly K[], make: (key: K) => V): Record<K, V> => {
  const built: Partial<Record<K, V>> = {};

  keys.forEach((key) => {
    built[key] = make(key);
  });

  if (!hasEvery(built, keys)) {
    throw new Error("recordOf: a key was left without a value");
  }

  return built;
};

// Whether a value is one of a list of strings, as that list's type.
export const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T => list.some((item) => item === value);
