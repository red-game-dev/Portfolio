import { PortfolioData } from "@/types/portfolio";

// The reader's settings: what each is called and does, and what the terminal says about them.
export const preferencesContent: Pick<PortfolioData, "preferences"> = {
  preferences: {
    title: "Settings",
    note: "Kept in this browser only. Change them here, or in the terminal: type settings.",
    items: {
      "landing-time": {
        name: "Landing time",
        description: "Real descents take minutes, and Huygens took over two hours to fall to Titan. Sped up keeps how long each world takes against " +
          "the others; real time runs the clock as it is.",
        options: { compressed: "Sped up", real: "Real time" },
      },
      "landing-control": {
        name: "Landing control",
        description: "Flown for you, as a real guided landing is, or fly the landing burn yourself and touch down slowly enough not to crash.",
        options: { auto: "Flown for you", manual: "Fly it yourself" },
      },
    },
    terminal: {
      settingsSummary: "See your settings",
      setSummary: "Change a setting",
      resetSummary: "Put settings back",
      listTitle: "Your settings, kept in this browser:",
      row: "{key}: {value} ({name}; can be {options})",
      changed: "{name} is now {value}.",
      unknown: "There is no setting called {key}. Type settings to see them.",
      invalid: "{name} can be {options}.",
      usage: "Usage: set <setting> <value>, for example: set landing-control manual",
      resetAll: "Every setting is back to its default.",
      resetOne: "{name} is back to {value}.",
    },
  },
};
