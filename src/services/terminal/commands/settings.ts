import { PreferenceName } from "@/config/preferences";
import { Command, error, heading, output, system } from "@/packages/interaction/terminal";
import { formatValue } from "@/packages/settings/preferences";
import { fill } from "@/packages/text/format";
import { preferences } from "@/services/preferences/store";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";

// The reader's settings from the command line: list them, change one, put them back. They are the same store the
// page reads, so a change here shows there at once.
export const createSettingsCommands = ({ data }: CommandContext): Command[] => {
  const copy = data.preferences;
  const words = copy.terminal;
  const nameOf = (key: PreferenceName) => copy.items[key].name;
  const optionsOf = (key: PreferenceName) => {
    const setting = preferences.settingOf(key);

    return setting.kind === "toggle" ? "on, off" : setting.options.join(", ");
  };

  return [
    {
      name: "settings",
      aliases: ["preferences", "prefs"],
      group: GROUPS.settings,
      summary: words.settingsSummary,
      run: () => ({
        lines: [
          heading(words.listTitle),
          ...preferences.names.map((key) => output(fill(words.row, { key, name: nameOf(key), value: formatValue(preferences.get(key)), options: optionsOf(key) }))),
          system(words.usage),
        ],
      }),
    },
    {
      name: "set",
      group: GROUPS.settings,
      usage: "set <setting> <value>",
      summary: words.setSummary,
      run: ([key = "", value = ""]) => {
        if (!key || !value) {
          return { lines: [system(words.usage)] };
        }

        if (!preferences.isName(key)) {
          return { lines: [error(fill(words.unknown, { key }))] };
        }

        if (!preferences.set(key, value)) {
          return { lines: [error(fill(words.invalid, { name: nameOf(key), options: optionsOf(key) }))] };
        }

        return { lines: [output(fill(words.changed, { name: nameOf(key), value: formatValue(preferences.get(key)) }))] };
      },
    },
    {
      name: "reset",
      group: GROUPS.settings,
      usage: "reset [setting]",
      summary: words.resetSummary,
      run: ([key]) => {
        if (key === undefined) {
          preferences.reset();

          return { lines: [output(words.resetAll)] };
        }

        if (!preferences.isName(key)) {
          return { lines: [error(fill(words.unknown, { key }))] };
        }

        preferences.reset(key);

        return { lines: [output(fill(words.resetOne, { name: nameOf(key), value: formatValue(preferences.get(key)) }))] };
      },
    },
  ];
};
