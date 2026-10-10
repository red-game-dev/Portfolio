import { PortfolioData } from "@/types/portfolio";

const LINKEDIN_USERNAME = "redeemer-pace-685692b9";

type ProfileContent = Pick<PortfolioData,
  "intro"
  | "headline"
  | "cover"
  | "cv"
  | "fullResume"
  | "github"
  | "stackoverflow"
  | "typingsTitles"
  | "details"
  | "recommendations"
  | "socialMedia"
>;

// Who I am: the first screen, my details, the links and what people say about me.
export const profileContent: ProfileContent = {
  intro:
    "Hello! I’m <strong>Redeemer Pace</strong>. Let's get to know each other, shall we?",
  headline: {
    lines: [
      "Software architect and founder. Game engines, payments and ledgers, a blockchain, AI in production and platforms for millions.",
      "Open to architect, engineering leadership, product, blockchain and applied AI roles, forward deployed included, full time or B2B.",
    ],
    availability: "Maltese citizen, EU work rights, open to relocation, available now.",
    cvLabel: "Download CV",
    emailLabel: "Email me",
    audiencesLabel: "Hire me for",
    audiences: [
      { audience: "payments", label: "Payments" },
      { audience: "ai", label: "AI engineering" },
      { audience: "architecture", label: "Architecture" },
    ],
    roles: [
      { label: "Software Architect", target: "for-architecture" },
      { label: "Enterprise Architect", target: "for-enterprise-architecture" },
      { label: "AI engineering", target: "for-ai-engineering" },
      { label: "Payments", target: "for-payments" },
      { label: "Head of Engineering", target: "for-leadership" },
      { label: "VP of Engineering", target: "for-leadership" },
      { label: "Technical leadership", target: "for-leadership" },
      { label: "Product Engineer", target: "for-product-engineering" },
      { label: "Blockchain Engineer", target: "for-web3" },
      { label: "Full stack", target: "for-full-stack" },
      { label: "Web3", target: "for-web3" },
      { label: "Games and real time", target: "for-games" },
    ],
    industriesLabel: "Industries I know",
    industries: [
      { industry: "ecommerce", label: "E-commerce" },
      { industry: "fintech", label: "Fintech and payments" },
      { industry: "igaming", label: "iGaming" },
      { industry: "gamePublishing", label: "Game publishing" },
      { industry: "web3", label: "Web3 and blockchain" },
      { industry: "sports", label: "Sports and fan engagement" },
      { industry: "social", label: "Social platforms" },
      { industry: "pharmatech", label: "Pharmatech" },
      { industry: "consulting", label: "Enterprise consulting" },
      { industry: "travel", label: "Travel and content" },
    ],
  },
  cover: "/images/cover-picture.webp",
  cv: "/cv/redeemer-pace-cv.pdf",
  // The longer version, every role in full, for readers who want everything after the short CV.
  fullResume: { url: "/cv/redeemer-pace-full-resume.pdf", label: "Full résumé (14 pages)" },
  github: [
    {
      name: "Me",
      link: "https://github.com/red-game-dev",
    },
    {
      name: "GOZ",
      link: "https://github.com/AMW-Game-Entertainment",
    },
    {
      name: "SN",
      link: "https://github.com/animemixedworldgithub",
    },
  ],
  stackoverflow: "https://stackoverflow.com/users/15786039/ired-game-dev",
  typingsTitles: [
    "Your next <strong>Software Architect</strong>",
    "Your next <strong>Game Developer</strong>",
    "Your next <strong>Backend Engineer</strong>",
    "Your next <strong>Architect who ships with AI agents</strong>",
    "Your next <strong>Frontend Engineer</strong>",
    "Your next <strong>Game Consultant</strong>",
    "Your next <strong>App Developer</strong>",
    "Your next <strong>Software Engineer</strong>",
    "Your next <strong>Tech Consultant</strong>",
    "Your next <strong>Business Consultant</strong>",
    "Your next <strong>Marketing Consultant</strong>",
  ],
  details: {
    name: "Redeemer Pace",
    intro: "Architect. Builder. Founder.",
    hook: "I build game engines, payment systems, a blockchain, platforms for millions and companies of my own.",
    paragraphs: [
      `I am a software architect with 20+ years writing software, since I was 7, and 15+ years in the industry, most of them leading.
      I have built 14 startups, and products at the companies I have worked for reach 200M+ active users. I design systems that are
      not tied to a vendor or a framework, and I stay hands on while I do it.`,
      `Today I lead architecture at Conrad for a 90+ person delivery organisation, on a storefront in 16 markets at up to 7M+ sessions
      a month. Before that I took Chiliz's fan app for 1.5M+ users in 167 countries from critically unstable to the core its seven
      squads ship on.`,
      `As a founder I grew a social network for anime and gaming fans to 10M+ registered users, ran Gods of Zushin, an MMORPG on a
      C/C++ engine of my own, as a live business, and co-founded CoinOn as CTO, a Web3 platform taken from zero to web, mobile and its
      own chain. I also built a gamified social platform on payments, double entry ledgers and an ads engine with its own auction.`,
      `I have worked across e-commerce, payments, iGaming, game publishing and Web3, on the engineering side and on the business side.
      I have put machine learning into production since 2019, at KPMG and in my own products, and today I build with AI agents inside
      rules, context and checks I write, with a person reviewing every change. That mix is why I can be useful to a CTO in the morning
      and to a marketing team in the afternoon.`,
      `I am looking for an architect, head or VP of engineering, product engineering, blockchain or AI engineering role where the
      problems are hard and the standards are high.`,
    ],
    proof: [
      { id: "coding", value: "20+", label: "years writing software, since I was 7" },
      { id: "industry", value: "15+", label: "years in the industry, from my first company in 2010" },
      { id: "startups", value: "14", label: "startups built" },
      { id: "reach", value: "200M+", label: "active users on products at companies I worked for" },
      { id: "countries", value: "1.5M+", label: "users in 167 countries on one platform" },
      { id: "sessions", value: "7M+", label: "sessions a month at peak on another" },
    ],
    facts: [
      "Maltese citizen with EU work rights",
      "Offers from Google and AWS, declined to care for family",
      "Open to relocation",
      "Remote, hybrid or on site",
      "Speaks Maltese, English and Italian",
      "Available now",
    ],
    location: "Remote (worldwide), Hybrid & On-Site (Switzerland, Europe in general, US)",
    jobType:
      "B2B (C2C, Individual Freelance) / Full-Time / Part-Time / Temporary",
    phone: "+356 79323059",
    email: "red.pace.dev@gmail.com",
    image: "/images/profile.webp",
    portrait: { decoding: "Decoding", upscaling: "Upscaling", enhancing: "Enhancing with AI" },
    contactTime: "Anytime in any timezone",
  },
  recommendations: [
    {
      quote: `The breadth of his knowledge about software, systems and architecture is excellent and has shown to be valuable beyond the
      scope of front end work.`,
      role: "Lead Front End Developer",
      company: "reNFT",
      date: "August 2023",
    },
    {
      quote: "Redeemer is a solver of problems at heart and an absolute pleasure to work with.",
      role: "Lead Front End Developer",
      company: "reNFT",
      date: "August 2023",
    },
    {
      quote: `He had a crucial role in the development of the game UI for the desktop and mobile application enabling AG to deliver the
      most innovative User Experience in the industry.`,
      role: "CTO",
      company: "Authentic Gaming",
      date: "January 2019",
    },
    {
      quote: "Redeemer demonstrated to understand the business requirements fully and to implement the solution as per the needs of the technical team.",
      role: "CTO",
      company: "Authentic Gaming",
      date: "January 2019",
    },
    {
      quote: "Redeemer's efficiency and thrive to grab multiple projects and give them the perfect 'bang', is outstanding.",
      role: "Head of Frontend",
      company: "Authentic Gaming",
      date: "January 2019",
    },
    {
      quote: "As a software engineer, Redeemer would be a true asset to that position and it comes with my heartfelt recommendation.",
      role: "Head of Frontend",
      company: "Authentic Gaming",
      date: "January 2019",
    },
  ],
  socialMedia: {
    byUsername: {
      twitter: "@red_game_dev",
      instagram: "adventure.redmt",
      facebook: "traveller.redmt",
      linkedIn: LINKEDIN_USERNAME,
    },
    byProjectsUsername: {
      gameYt: "@godsofzushin",
    },
  },
};
