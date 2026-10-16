import { blueprintLabels } from "@/data/blueprints/labels";
import { lensContent } from "@/data/lens";
import { PortfolioData } from "@/types/portfolio";

// The words of the page's own furniture: the views, the menu, the carousels and the blueprints.
export const navigationContent: Pick<PortfolioData, "lens" | "blueprintLabels" | "menu" | "carouselLabels"> = {
  lens: lensContent,
  blueprintLabels,
  menu: {
    label: "Journey",
    stops: {
      who: "Who I am",
      offer: "Offer",
      history: "History",
      ai: "AI",
      web3: "Web3",
      payments: "Payments",
      engineering: "Engineering",
      igaming: "iGaming",
      game: "Game world",
      beyond: "Beyond",
    },
    parts: {
      pos: "POS",
      offline: "Offline",
      gateway: "Gateway",
      cardPayment: "Card payment",
      payouts: "Payouts",
      skills: "Skills",
      caseStudies: "Case studies",
      projects: "Projects",
      recommendations: "Recommendations",
      arena: "Arena",
    },
    partsLabel: "Inside {stop}",
    skip: "Skip to content",
    title: "Where to?",
    kicker: "Stop {n} of {total}: {zone}",
    open: "Open the menu",
    close: "Close the menu",
    here: "You are here",
    zones: { matrix: "Matrix", ai: "AI", chain: "Chain", casino: "Casino", mmo: "Game world", beyond: "Beyond" },
    cv: "Download CV",
    email: "Email me",
    linkedIn: "LinkedIn",
    motion: "Keep the page still",
  },
  carouselLabels: {
    previous: "Previous",
    next: "Next",
    position: "{from} to {to} of {count}",
    single: "{from} of {count}",
  },
};
