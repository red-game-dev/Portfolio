
import {
  faChessKnight,
  faCode,
  faCompassDrafting,
  faCrown,
  faCubes,
  faDragon,
  faRocket,
  faServer,
  faSitemap,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";

import { PortfolioData } from "@/types/portfolio";

// The characters I play, as an MMO roster.
export const rosterContent: Pick<PortfolioData, "roster"> = {
  roster: {
    asOf: "Oct 2026",
    labels: {
      level: "Level",
      years: "years in the role",
      since: "since",
      abilities: "Abilities",
      play: "Play as",
      playing: "Playing",
      hire: "Talk to me about this role",
    },
    characters: [
      {
        characterClass: "CEO",
        hero: "sovereign",
        icon: faCrown,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "TasteTravellers", from: "Feb 2018" },
          { company: "Own products", from: "2021" },
        ],
        stats: [
          { name: "Entrepreneur", value: 75 },
          { name: "Marketing", value: 50 },
        ],
        abilities: ["Product direction", "Paid acquisition", "Community building", "Monetisation"],
      },
      {
        characterClass: "CTO",
        hero: "archmage",
        titles: ["Chief Technology Officer", "Head of Engineering", "VP of Engineering"],
        icon: faChessKnight,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "CoinOn", from: "Nov 2021", to: "Jan 2022" },
          { company: "Own products", from: "2021" },
        ],
        stats: [
          { name: "Architecture", value: 95 },
          { name: "Platform Engineering", value: 85 },
        ],
        abilities: ["Technology roadmap", "Cybersecurity", "Infrastructure", "Executive team"],
      },
      {
        characterClass: "Product Owner",
        hero: "strategist",
        icon: faCompassDrafting,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "CoinOn", from: "Nov 2021", to: "Jan 2022" },
          { company: "Own products", from: "2021" },
        ],
        stats: [
          { name: "Strategic Decision-making", value: 90 },
          { name: "Executive Stakeholder Communication", value: 90 },
        ],
        abilities: ["Roadmaps", "Monetisation", "Stakeholder alignment", "Zero to one"],
      },
      {
        characterClass: "Architect",
        hero: "paladin",
        titles: ["Software Architect", "Lead Enterprise Architect", "Enterprise Architect"],
        icon: faSitemap,
        tenures: [
          { company: "KPMG", from: "Feb 2019", to: "Sep 2019" },
          { company: "Chiliz", from: "Nov 2019", to: "Nov 2022" },
          { company: "HyperPlay", from: "Oct 2023", to: "Nov 2025" },
          { company: "Conrad", from: "Nov 2025" },
          { company: "Own products", from: "2021" },
        ],
        stats: [
          { name: "Architecture", value: 95 },
          { name: "Enterprise Architecture", value: 90 },
        ],
        abilities: ["C4 and ADRs", "Adapters", "Migrations", "Scale design"],
      },
      {
        characterClass: "Product Engineer",
        hero: "artificer",
        icon: faRocket,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "reNFT", from: "Jan 2023", to: "Aug 2023" },
          { company: "HyperPlay", from: "Oct 2023", to: "Nov 2025" },
          { company: "Own products", from: "2021" },
        ],
        stats: [
          { name: "Frontend Engineer", value: 100 },
          { name: "Backend Engineer", value: 75 },
        ],
        abilities: ["End to end features", "Zero to one", "Design systems", "Shipping with AI agents"],
      },
      {
        characterClass: "Blockchain Engineer",
        hero: "runeKnight",
        icon: faCubes,
        tenures: [
          { company: "Chiliz", from: "Nov 2019", to: "Nov 2022" },
          { company: "CoinOn", from: "Nov 2021", to: "Jan 2022" },
          { company: "reNFT", from: "Jan 2023", to: "Aug 2023" },
          { company: "HyperPlay", from: "Oct 2023", to: "Nov 2025" },
          { company: "Own products", from: "2021" },
        ],
        stats: [
          { name: "Platform Engineering", value: 85 },
          { name: "Encryption & Compression", value: 80 },
        ],
        abilities: ["Smart contracts", "Attack vector defence", "Exchanges and tokens", "Wallets, indexers and bridges"],
        note: `I design against the known attack vectors: reentrancy, front running and MEV, oracle manipulation, signature replay, broken
        access control, unlimited approvals and flash loan abuse. No change ships without its security review.`,
      },
      {
        characterClass: "Tech Lead",
        hero: "captain",
        icon: faUsersGear,
        tenures: [
          { company: "KPMG", from: "Feb 2019", to: "Sep 2019" },
          { company: "Chiliz", from: "Nov 2019", to: "Nov 2022" },
        ],
        stats: [
          { name: "Tech Lead", value: 80 },
          { name: "Mentoring", value: 100 },
        ],
        abilities: ["Code review", "Delivery alignment", "Standards", "Mentoring"],
      },
      {
        characterClass: "Frontend Engineer",
        hero: "ranger",
        icon: faCode,
        tenures: [
          { company: "AuthenticGaming", from: "Jul 2017", to: "Jan 2019" },
          { company: "KPMG", from: "Feb 2019", to: "Sep 2019" },
          { company: "Chiliz", from: "Nov 2019", to: "Nov 2022" },
          { company: "reNFT", from: "Jan 2023", to: "Aug 2023" },
          { company: "HyperPlay", from: "Oct 2023", to: "Nov 2025" },
        ],
        stats: [{ name: "Frontend Engineer", value: 100 }],
        abilities: ["React", "Vue", "Canvas and WebGL", "Design systems"],
      },
      {
        characterClass: "Backend Engineer",
        hero: "warsmith",
        icon: faServer,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "KPMG", from: "Feb 2019", to: "Sep 2019" },
          { company: "CoinOn", from: "Nov 2021", to: "Jan 2022" },
          { company: "HyperPlay", from: "Oct 2023", to: "Nov 2025" },
          { company: "Own products", from: "2021" },
        ],
        stats: [{ name: "Backend Engineer", value: 75 }],
        abilities: ["Node.js and NestJS", "PostgreSQL", "Laravel", "Real time"],
      },
      {
        characterClass: "Game Engineer",
        hero: "battlemage",
        icon: faDragon,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "AuthenticGaming", from: "Jul 2017", to: "Jan 2019" },
        ],
        stats: [
          { name: "Game Engineer", value: 80 },
          { name: "Encryption & Compression", value: 80 },
        ],
        abilities: ["C/C++ engine", "Lua", "PixiJS", "Multiplayer"],
      },
    ],
  },
};
