import { PortfolioData } from "@/types/portfolio";

// The CV recruiters and their screening software read: one column, plain text, two to three pages. Dense on
// purpose: every role keeps its results and its stack, so a keyword screen finds what a person would, and a test
// keeps every skill with years behind it on the page. Every line restates something the site or my full résumé
// says; the figures and skill years come from the rest of the content.
export const cvDocumentContent: Pick<PortfolioData, "cvDocument"> = {
  cvDocument: {
    headline: "Software Architect and Applied AI Engineer",
    summary: [
      `Software architect with 15+ years in the industry and 20+ writing software, since I was 7. I lead architecture for a 90+
      person delivery organisation at Conrad, took Chiliz's fan app for 1.5M+ users in 167 countries from critically unstable to
      the core its seven squads ship on, and have put machine learning into production since 2019.`,
      `Hands on as an architect, CTO and tech lead: brownfield migrations and greenfield products, from 0 to 1 and at scale, across
      e-commerce, payments, iGaming, Web3 and games. I build production software with AI agents, inside rules, context and checks
      I write, with a person reviewing every change. Offers from Google and AWS, declined to care for family; now free to relocate.`,
    ],
    highlightsLabel: "Highlights",
    highlights: [
      `Machine learning in production: PyTorch and TensorFlow models for KPMG's enterprise clients and in my own products, from
      training and fine tuning to serving: personalised suggestions for food delivery and taxi apps, social feed ranking, ads,
      vision and language.`,
      `Agentic engineering: production software built with Claude Code under written rules, typed content contracts and a test
      suite, with every change reviewed by a person.`,
      `Migrations: a storefront in 16 markets from AEM to a headless CMS, market by market; Chiliz's unstable app to a V2 core;
      legacy Backbone to Redux and RxJS at AuthenticGaming; brownfield client systems at KPMG; Polkadot parachains to a chain of
      our own on Substrate.`,
      "Scale: 200M+ active users on products at companies I worked for, up to 7M+ sessions a month on one platform.",
      `Leadership: architecture direction across 7 squads and 30+ engineers at Chiliz and a 90+ person organisation at Conrad;
      CTO of a team of 10+ at CoinOn.`,
      `Founder: 14 startups built, among them CoinOn (co-founder and CTO, an exchange with DeFi), a social network grown to 10M+
      registered users, and an MMORPG on a C/C++ engine of my own.`,
    ],
    experienceLabel: "Experience",
    roles: [
      {
        title: "Lead Software Architect / Enterprise Architect, Conrad Electronic Group",
        bullets: [
          `Lead architecture for a 90+ person delivery organisation, aligning engineering, QA, product, design and content up to CTO
          level, for a storefront in 16 markets at up to 7M+ sessions a month.`,
          `Lead the migration from Adobe Experience Manager to a Nuxt SSR and headless CMS stack: strategy for components, templates,
          content, redirects, sitemaps, SEO and accessibility, rolled out per market behind feature flags (OpenFeature, GO Feature
          Flag) and Istio, under monitoring and rollback.`,
          `Designed the CMS Adapter API, an anti corruption layer with a backend for frontend, versioned contracts and signed
          authentication, kept free of framework code.`,
          "Wrote 11 Architecture Decision Records, a 14 diagram C4 model, the migration roadmap, a numbered decision log and a handover guide.",
          "Led the use of AI tooling across the delivery organisation (Claude Code, Gemini Enterprise, MCP), with decisions recorded as ADRs.",
        ],
      },
      {
        title: "Senior Full Stack Engineer, HyperPlay Labs",
        bullets: [
          `Architected the web platform and the Electron desktop launcher, introduced the React Native app, and shaped key product
          and technical decisions across the developer portal and the game store.`,
          "Profiled and optimised Electron and mobile builds with native C/C++ modules and Lighthouse audits, cutting memory use and load times.",
          "Smart contract security audits, wallet and chain integrations across EVM chains, and code review across a multi stack " +
            "codebase in TypeScript, Rust and Solidity.",
          "High coverage automated tests across backend, frontend, mobile and desktop; a design system with Storybook interaction " +
            "tests; CLI tools and scaffolders for developer experience.",
        ],
      },
      {
        title: "Senior Frontend Engineer, reNFT Labs",
        bullets: [
          "Built NFT Marketplace V2 with the tech lead: a modular architecture, a Radix UI design system with Storybook interaction " +
            "tests, and Playwright end to end coverage.",
          "Owned the V2 landing page from 0 to 1, wired smart contract interactions with Wagmi and Ethers.js, and kept Lighthouse scores high.",
        ],
      },
      {
        title: "Founder & Architect, Gamified Social Network Platform",
        bullets: [
          `Payments, double entry ledgers, ads and real time feeds, every vendor behind an adapter and switchable by configuration;
          money paths tested through the real API at real volume.`,
          "Feed ranking and recommendations in PyTorch, and production software built with AI agents under written rules and human review.",
        ],
      },
      {
        title: "Co-founder & CTO, CoinOn",
        bullets: [
          "Owned the technology roadmap and the architecture from 0 to 1 across web, mobile, backend, blockchain and infrastructure, leading a team of 10+.",
          "Microservices, CI/CD with audit logs, permission controls and rollback, and disaster recovery and business continuity plans.",
          "Cross chain bridges and indexers across Solana, Polkadot and EVM chains, a chain of our own on Substrate, and smart contract safety.",
        ],
      },
      {
        title: "Mobile Core Engineer / Architect, Chiliz",
        bullets: [
          `Took a fan engagement app for 1.5M+ users in 167 countries from critically unstable to the core 7 squads and 30+
          engineers ship on, providing architecture direction and implementation standards across them.`,
          "Built the V2 core architecture (routing, error reporting, app lifecycle, RxJS state) and performance critical native modules in C/C++, Java and Kotlin.",
          "Introduced test driven development, reaching 95%+ test coverage on the frontend and mobile codebases, and mentored engineers.",
          "Production on chain integrations in React Native, shared modules in a monorepo, and a design system across platforms.",
        ],
      },
      {
        title: "Software Engineer / Technical Lead for Client Projects, KPMG",
        bullets: [
          `Built machine learning end to end in PyTorch and TensorFlow for clients, from training and fine tuning to serving in
          production: personalised suggestions for food delivery and taxi apps, social feed ranking, ads, vision and language.
          All went live.`,
          "Led architecture for brownfield migrations and greenfield builds across finance, iGaming and pharmatech, including regulated deposit and withdrawal flows.",
          "Coordinated engineers across client projects, set coding standards and architecture documentation, and presented technical direction onsite.",
        ],
      },
      {
        title: "Frontend Game Engineer, AuthenticGaming",
        bullets: [
          "A live casino game UI for every screen, credited by the CTO with the most innovative user experience in the industry; real time Node.js and WebSockets.",
          "Migrated legacy Backbone code to modular Redux and RxJS flows, and built tools that automated the onboarding of new casino operators.",
          "Built and presented a PixiJS bet table proof of concept that shaped the product plan.",
        ],
      },
      {
        title: "Founder, CEO & CTO, Gods of Zushin",
        bullets: [
          "An MMORPG on a custom C/C++ engine and servers for low latency multiplayer, with my own cryptography and compression, and Stripe and PayPal payments.",
          "Live patching, moderation and analytics tools, anti tamper accounts and inventory, and an in game economy balanced on player behaviour.",
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
      {
        label: "AI and machine learning",
        names: [
          "PyTorch", "TensorFlow", "Python", "Claude Code Max CLI", "Gemini Enterprise", "ChatGPT / GPT-4", "Strapi MCP",
          "Agentic Implementation with Human-in-the-loop Review", "Parallel Sub-agent Orchestration for Multi-source Audits",
        ],
      },
      {
        label: "Languages",
        names: [
          "TypeScript", "JavaScript", "C/C++", "C#, .NET", "Java", "Kotlin", "Swift", "Dart", "PHP", "SQL", "PL/pgSQL", "Bash", "Lua",
          "Solidity", "Rust", "HTML / CSS", "LESS / SASS", "ShaderLab",
        ],
      },
      {
        label: "Frontend",
        names: [
          "React", "Next.js", "Vue", "Nuxt / Nuxt 4", "State Management", "RxJS", "Tailwind CSS", "Radix UI", "Design Systems",
          "SSR / SSG", "Canvas", "WebGL", "PixiJS", "Backbone", "jQuery", "Webpack",
        ],
      },
      {
        label: "Backend and data",
        names: ["Node.js", "NestJS", "Laravel", "PostgreSQL", "Redis", "NoSQL", "Supabase", "Firebase", "GraphQL", "Socket.IO", "Boost", "ACE", "OpenSSL", "LINQ", "SSH"],
      },
      { label: "Mobile and desktop", names: ["React Native", "Flutter", "Ionic", "NativeScript", "Cordova", "Electron", "Fastlane", "Google Store & Apple Store"] },
      { label: "Web3", names: ["Ethers.js", "Wagmi (React)", "TheGraph", "Alchemy", "Solana", "Polkadot", "Substrate"] },
      {
        label: "Cloud and delivery",
        names: ["AWS", "GKE / Kubernetes", "Docker", "Cloudflare", "Vercel", "Railway", "Digital Ocean", "OVH Cloud", "CI/CD", "Sentry"],
      },
      {
        label: "Testing and quality",
        names: ["Automated Testing (unit, integration, end to end)", "TDD (Test Driven Development)", "Jest", "Playwright", "Storybook", "Code Review"],
      },
      { label: "Platforms and payments", names: ["Strapi", "Adobe Experience Manager (AEM)", "Shopify", "WordPress", "Stripe", "PayPal"] },
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
