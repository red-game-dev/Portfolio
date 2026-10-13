import { PortfolioData } from "@/types/portfolio";

// The accessibility statement, its own page at /accessibility/, linked from the foot of the site. Every line says only
// what is true of the site now; what is not yet there is listed as a limit.
export const accessibilityContent: Pick<PortfolioData, "accessibility"> = {
  accessibility: {
    title: "Accessibility",
    description: "How this site works for everyone: the standard it aims for, what is done, what is not yet, and how to tell me about a problem.",
    intro: "I want this site to work for everyone who visits it, whatever device, browser or assistive technology they use.",
    standard: "I aim for the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, the level the European standard EN 301 549 points to.",
    status: "The site partly meets WCAG 2.2 level AA: the pages are built and tested against it, and the gaps I know of are listed below.",
    doneTitle: "What the site does",
    done: [
      "Every control on the page works from a keyboard, with a visible focus indicator, and focus stays clear of the fixed bars.",
      "A skip link at the top goes straight to the content, and links within the page take focus with them.",
      "Drawings, diagrams and canvases have a text alternative, apart from the games listed below, and screen readers hear what changes, " +
        "such as filter results and the launch countdown.",
      "Text and controls meet the contrast WCAG asks for.",
      "The switch in the header (in the menu on a phone) stops the page's animations, the backdrop, the typing, the falling code, the " +
        "live table and the launch among them, and the site follows your device's reduced motion setting.",
      "The invite to play at the end waits for your answer, with no countdown.",
      "The single key shortcuts that open the terminal (/ and the backtick) can be turned off below.",
    ],
    limitsTitle: "What does not fully meet it yet",
    limits: [
      "The voyage at the end is a real time space game drawn on a canvas. It can be played with a keyboard, a pointer, a touch screen or a " +
        "controller, and its moments are read out, but its map and flight are visual and have no full text equivalent.",
      "Inside the voyage, some keyboard and screen reader details are still being fixed: keys that act while you type, focus when its cards " +
        "close, and alternatives to pinching and dragging.",
      "Bug Raid, the arcade game in the game world, is drawn on a canvas: it plays from the keyboard and its score and end are read out, but " +
        "play itself is visual.",
      "At very high zoom in a small window, the fixed header and the game bars take much of the screen.",
    ],
    settingsTitle: "Your settings",
    settingsNote: "Kept in this browser only.",
    testingTitle: "How I test it",
    testing: "With automated checks (Lighthouse), from the keyboard alone, and by reviewing the code against each WCAG 2.2 criterion.",
    reportTitle: "Something in your way?",
    report: "Email me at {email} with the page and what you were trying to do, and I will fix it.",
    reviewed: "Last reviewed on 13 October 2026.",
    back: "Back to the site",
    link: "Accessibility",
  },
};
