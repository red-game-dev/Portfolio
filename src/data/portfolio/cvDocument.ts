import { PortfolioData } from "@/types/portfolio";

// The CV recruiters and their screening software read: two pages, one column, plain text. Every line restates
// something the page says in full; the figures and skill years come from the rest of the content.
export const cvDocumentContent: Pick<PortfolioData, "cvDocument"> = {
  cvDocument: {
    headline: "Software Architect and Applied AI Engineer",
    summary: [
      `Software architect with 15+ years in the industry and 20+ writing software, since I was 7. I lead architecture for a 90+
      person delivery organisation at Conrad, took Chiliz's fan app for 1.5M+ users in 167 countries from critically unstable to
      the core its seven squads ship on, and have put machine learning into production since 2019.`,
      `I build production software with AI agents, inside rules, context and checks I write, with a person reviewing every change.
      Offers from Google and AWS, declined to care for family; now free to relocate.`,
    ],
    highlightsLabel: "Highlights",
    highlights: [
      `Machine learning in production: PyTorch and TensorFlow models for KPMG's enterprise clients and in my own products, from
      training and fine tuning to serving: personalised suggestions for food delivery and taxi apps, social feed ranking, ads,
      vision and language.`,
      `Agentic engineering: production software built with Claude Code under written rules, typed content contracts and a test
      suite, with every change reviewed by a person.`,
      "Scale: 200M+ active users on products at companies I worked for, up to 7M+ sessions a month on one platform.",
      `Founder: 14 startups built, among them CoinOn (co-founder and CTO, an exchange with DeFi), a social network grown to 10M+
      registered users, and an MMORPG on a C/C++ engine of my own.`,
    ],
    experienceLabel: "Experience",
    roles: [
      {
        title: "Lead Software Architect / Enterprise Architect, Conrad Electronic Group",
        bullets: [
          "Architecture for a 90+ person delivery organisation: a storefront in 16 markets, up to 7M+ sessions a month, working up to CTO level.",
          `Designed the CMS Adapter API, an anti corruption layer with a backend for frontend, versioned contracts and signed
          authentication, and wrote 11 Architecture Decision Records and a full C4 model.`,
          "Per market rollout behind feature flags (OpenFeature, GO Feature Flag) and Istio, so each market migrates on its own under monitoring and rollback.",
        ],
      },
      {
        title: "Senior Full Stack Engineer, HyperPlay Labs",
        bullets: [
          "Architected the web platform and the Electron desktop launcher, introduced the React Native app, and wrote native C/C++ modules for performance.",
          "Smart contract security audits and code review across a multi stack codebase.",
        ],
      },
      {
        title: "Senior Frontend Engineer, reNFT Labs",
        bullets: ["NFT Marketplace V2: modular architecture, a Radix design system with Storybook interaction tests, and Playwright end to end coverage."],
      },
      {
        title: "Founder & Architect, Gamified Social Network Platform",
        bullets: [
          `Payments, ledgers, ads and real time, every vendor behind an adapter and switchable by configuration; money paths tested
          through the real API at real volume; feed ranking and recommendations in PyTorch.`,
        ],
      },
      {
        title: "Co-founder & CTO, CoinOn",
        bullets: ["Architecture from 0 to 1 for exchange and DeFi volume, a team of 10+, and smart contract safety."],
      },
      {
        title: "Mobile Core Engineer / Architect, Chiliz",
        bullets: [
          `Took a fan engagement app for 1.5M+ users in 167 countries from critically unstable to the core 7 squads and 30+
          engineers ship on.`,
          "Built the V2 core architecture and performance critical native modules in C/C++, Java and Kotlin.",
        ],
      },
      {
        title: "Software Engineer / Technical Lead for Client Projects, KPMG",
        bullets: [
          `Built machine learning end to end in PyTorch and TensorFlow for clients, from training and fine tuning to serving in
          production: personalised suggestions for food delivery and taxi apps, social feed ranking, ads, vision and language.
          All went live.`,
          "Architecture for migrations and new builds across finance, iGaming and pharmatech, including regulated deposit and withdrawal flows.",
        ],
      },
      {
        title: "Frontend Game Engineer, AuthenticGaming",
        bullets: [
          "A live casino game UI for every screen, credited by the CTO with the most innovative user experience in the industry; real time Node.js and WebSockets.",
        ],
      },
      {
        title: "Founder, CEO & CTO, Gods of Zushin",
        bullets: [
          "An MMORPG on a custom C/C++ engine and servers for low latency multiplayer, with my own cryptography and compression, and Stripe and PayPal payments.",
        ],
      },
      {
        title: "Founder, CEO & CTO, AMW Social Network",
        bullets: ["A social network grown to 10M+ registered and 3M+ active users, on PHP and JavaScript frameworks of my own and servers per region."],
      },
    ],
    moreVentures: "14 startups built in total; every one is on redgame.dev.",
    skillsLabel: "Skills, with years of use",
    skills: [
      { label: "AI and machine learning", names: ["PyTorch", "TensorFlow", "Python", "ChatGPT / GPT-4"] },
      { label: "Languages", names: ["TypeScript", "JavaScript", "C/C++", "C#, .NET", "Rust", "Solidity", "Kotlin", "SQL"] },
      { label: "Platforms", names: ["Node.js", "NestJS", "React", "Next.js", "Vue", "React Native", "PostgreSQL", "Redis"] },
      { label: "Cloud and delivery", names: ["AWS", "GCP", "Cloudflare", "Docker", "GKE / Kubernetes", "CI/CD", "Code Review"] },
    ],
    educationLabel: "Education",
    education: [
      "BSc (Hons) Multimedia Software Development, MCAST, 2015 to 2017",
      "Extended Diploma and Diploma in Computer Software Engineering, MCAST, 2011 to 2015",
    ],
    languagesLabel: "Languages",
    languages: "Maltese, English, Italian",
    yearsFormat: "{years} yrs",
    printLabel: "Download as PDF",
  },
};
