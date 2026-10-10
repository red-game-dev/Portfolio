// One preference a reader can set: a choice of named options, or a switch that is on or off. Each says what it
// starts as.
export interface ChoiceSetting<V extends string = string> {
  kind: "choice";
  options: readonly V[];
  initial: V;
}

export interface ToggleSetting {
  kind: "toggle";
  initial: boolean;
}

export type Setting = ChoiceSetting | ToggleSetting;

// Every preference a host offers, by name.
export type Schema = Readonly<Record<string, Setting>>;

// The value each preference in a schema holds.
export type Values<S extends Schema> = { readonly [K in keyof S]: S[K] extends ChoiceSetting<infer V> ? V : S[K] extends ToggleSetting ? boolean : never };

// Where preferences are kept between visits: whatever was written, as it was written, or nothing.
export interface PreferenceStorage {
  read(): unknown;
  write(values: Readonly<Record<string, string | boolean>>): void;
}
