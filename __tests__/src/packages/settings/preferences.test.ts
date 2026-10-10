import { formatValue, parseValue, PreferenceStorage, PreferenceStore } from "@/packages/settings/preferences";

const SCHEMA = {
  "landing-time": { kind: "choice", options: ["compressed", "real"], initial: "compressed" },
  "landing-control": { kind: "choice", options: ["auto", "manual"], initial: "auto" },
  "sound": { kind: "toggle", initial: false },
} as const;

const memory = (stored: unknown = null): PreferenceStorage & { written: unknown[] } => {
  const written: unknown[] = [];

  return { written, read: () => stored, write: (values) => void written.push(values) };
};

describe("settings/preferences", () => {
  test("reads typed words for choices and switches, in any case, and refuses anything else", () => {
    expect(parseValue(SCHEMA["landing-time"], "REAL")).toBe("real");
    expect(parseValue(SCHEMA["landing-time"], "slow")).toBeNull();
    expect(parseValue(SCHEMA.sound, "on")).toBe(true);
    expect(parseValue(SCHEMA.sound, "No")).toBe(false);
    expect(parseValue(SCHEMA.sound, true)).toBe(true);
    expect(parseValue(SCHEMA.sound, "maybe")).toBeNull();
    expect(formatValue(true)).toBe("on");
    expect(formatValue("manual")).toBe("manual");
  });

  test("starts at the defaults, and reads back only what still fits each setting once loaded", () => {
    const store = new PreferenceStore(SCHEMA, memory({ "landing-time": "real", "landing-control": "sideways", "sound": "on", "stale": "x" }));

    expect(store.values).toEqual({ "landing-time": "compressed", "landing-control": "auto", "sound": false });

    store.load();

    expect(store.values).toEqual({ "landing-time": "real", "landing-control": "auto", "sound": true });
  });

  test("sets, writes and tells listeners; a value that is not one of the setting's is refused and changes nothing", () => {
    const storage = memory();
    const store = new PreferenceStore(SCHEMA, storage);
    const heard: unknown[] = [];

    store.subscribe((values) => heard.push(values["landing-control"]));
    store.load();
    expect(store.set("landing-control", "Manual")).toBe(true);
    expect(store.get("landing-control")).toBe("manual");
    expect(store.set("landing-control", "upside down")).toBe(false);
    expect(store.set("nonsense", "on")).toBe(false);
    expect(heard[heard.length - 1]).toBe("manual");
    expect(storage.written[storage.written.length - 1]).toEqual({ "landing-time": "compressed", "landing-control": "manual", "sound": false });
  });

  test("a change makes a new frozen set of values; reset puts one or every setting back", () => {
    const store = new PreferenceStore(SCHEMA, memory());
    const before = store.values;

    store.set("sound", "on");
    expect(store.values).not.toBe(before);
    expect(Object.isFrozen(store.values)).toBe(true);

    store.set("landing-time", "real");
    store.reset("sound");
    expect(store.values).toEqual({ "landing-time": "real", "landing-control": "auto", "sound": false });

    store.reset();
    expect(store.values).toEqual({ "landing-time": "compressed", "landing-control": "auto", "sound": false });
    expect(store.isName("sound")).toBe(true);
    expect(store.isName("volume")).toBe(false);
  });
});
