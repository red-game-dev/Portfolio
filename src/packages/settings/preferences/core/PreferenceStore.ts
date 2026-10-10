import { PreferenceStorage, Schema, Setting, Values } from "../domain/types";
import { parseValue } from "../utils/parse";

type Listener<S extends Schema> = (values: Values<S>) => void;

// The defaults of a schema, every preference at what it starts as.
const initialValues = <S extends Schema>(schema: S): Record<string, string | boolean> =>
  Object.fromEntries(Object.entries(schema).map(([key, setting]) => [key, setting.initial]));

// A reader's preferences, kept to a schema: each read back from storage is checked against its setting (anything
// unknown, or no longer one of its values, falls back to what it starts as), each change is checked the same way
// before it is kept and written, and everyone listening hears of it. The values are a new frozen object after each
// change, so a reader of them can tell a change by identity.
export class PreferenceStore<S extends Schema> {
  private current: Values<S>;
  private readonly listeners = new Set<Listener<S>>();
  private isLoaded = false;

  constructor(private readonly schema: S, private readonly storage: PreferenceStorage) {
    this.current = this.checked(initialValues(schema));
  }

  public get values(): Values<S> {
    return this.current;
  }

  public get names(): ReadonlyArray<keyof S & string> {
    return Object.keys(this.schema);
  }

  public settingOf(key: keyof S & string): Setting {
    return this.schema[key];
  }

  // What was kept, read once: called after mount, so the server and the first render agree on the defaults.
  public load(): void {
    if (this.isLoaded) {
      return;
    }

    this.isLoaded = true;

    const stored = this.storage.read();
    const kept = typeof stored === "object" && stored !== null ? stored : {};
    const next = initialValues(this.schema);

    Object.entries(this.schema).forEach(([key, setting]) => {
      const value = parseValue(setting, Reflect.get(kept, key));

      if (value !== null) {
        next[key] = value;
      }
    });

    this.replace(next);
  }

  public get<K extends keyof S & string>(key: K): Values<S>[K] {
    return this.current[key];
  }

  // Sets a preference from a value or a typed word ("real", "on"); returns whether it was one of its values.
  public set(key: string, raw: unknown): boolean {
    const setting = Reflect.get(this.schema, key);

    if (!this.isSetting(setting)) {
      return false;
    }

    const value = parseValue(setting, raw);

    if (value === null) {
      return false;
    }

    if (Reflect.get(this.current, key) !== value) {
      this.replace({ ...this.current, [key]: value });
    }

    return true;
  }

  // Back to what it starts as: one preference, or every one.
  public reset(key?: keyof S & string): void {
    this.replace(key === undefined ? initialValues(this.schema) : { ...this.current, [key]: this.schema[key].initial });
  }

  public subscribe(listener: Listener<S>): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public isName(key: string): key is keyof S & string {
    return this.isSetting(Reflect.get(this.schema, key));
  }

  private isSetting(value: unknown): value is Setting {
    return typeof value === "object" && value !== null && "kind" in value;
  }

  private replace(next: Record<string, string | boolean>): void {
    const values = this.checked(next);

    this.current = values;
    this.storage.write(next);
    this.listeners.forEach((listener) => listener(values));
  }

  // Whether every preference of the schema holds one of its own values.
  private isComplete(values: unknown): values is Values<S> {
    return typeof values === "object" && values !== null &&
      Object.entries(this.schema).every(([key, setting]) => {
        const value: unknown = Reflect.get(values, key);

        return value !== null && parseValue(setting, value) === value;
      });
  }

  // A full set of values, frozen; every path here builds them from the schema, so an incomplete set is a bug.
  private checked(values: Record<string, string | boolean>): Values<S> {
    const frozen = Object.freeze({ ...values });

    if (!this.isComplete(frozen)) {
      throw new Error("Preferences must hold a value for every setting");
    }

    return frozen;
  }
}
