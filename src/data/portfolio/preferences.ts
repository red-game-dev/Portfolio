import { PortfolioData } from "@/types/portfolio";

// The reader's settings: what each is called and does, and what the terminal says about them.
export const preferencesContent: Pick<PortfolioData, "preferences"> = {
  preferences: {
    title: "Settings",
    note: "Kept in this browser only. Change them here, or in the terminal: type settings.",
    items: {
      "landing-time": {
        name: "Landing time",
        description: "Real descents take minutes, and Huygens took over two hours to fall to Titan. Sped up plays every world forty times " +
          "faster, never longer than fifteen seconds; real time runs the clock as it is. The last 150 m flown by hand always run in real time.",
        options: { compressed: "Sped up", real: "Real time" },
      },
      "landing-control": {
        name: "Landing control",
        description: "Flown for you, as real guided landings are, or take the burn for the last 150 m, as Apollo's commanders did, and touch " +
          "down gently enough not to break the legs. Only a landing made on an engine can be flown by hand; parachutes come down by themselves.",
        options: { auto: "Flown for you", manual: "Fly it yourself" },
      },
      "space-drag": {
        name: "Space",
        description: "Felt: denser places slow you down, in the order real space has them. Voids are emptiest, then open space, " +
          "asteroid belts, nebulae and planetary rings. Real: space is far too empty to slow a ship, so how fast you go is up to your engines.",
        options: { felt: "Felt", real: "Real" },
      },
      "tilt-steering": {
        name: "Steer by tilting",
        description: "On a phone or tablet, tilt it the way you want to fly. The further you tilt, the harder you burn. " +
          "Hold it the way you like when you start: that is level.",
        options: { on: "On", off: "Off" },
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
