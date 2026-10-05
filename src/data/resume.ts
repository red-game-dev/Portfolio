import {
  faArrowRightArrowLeft,
  faBooks,
  faBoxArchive,
  faCastle,
  faChartCandlestick,
  faChessRook,
  faCompass,
  faDice,
  faDungeon,
  faPlaneDeparture,
  faStore,
  faTowerObservation,
  faTruckFast,
  faUsers,
  faBrainCircuit,
  faBullhorn,
  faChessKnight,
  faCode,
  faCog,
  faCompassDrafting,
  faCrown,
  faCreditCard,
  faCubes,
  faDragon,
  faFileLines,
  faGamepadModern,
  faGaugeHigh,
  faLayerGroup,
  faPlane,
  faRobot,
  faServer,
  faShieldCheck,
  faShieldHalved,
  faSitemap,
  faUserCheck,
  faUsersGear,
  faWandMagicSparkles
} from "@fortawesome/pro-duotone-svg-icons";

import { PortfolioAiUsage } from "@/types/ai-usage";
import { CaseStudy, CaseStudyFilters, PlatformDiagrams } from "@/types/case-studies";
import { CodeReviewContent } from "@/types/code-review";
import { Detail } from "@/types/details";
import { IGamingContent, Web3Content } from "@/types/domains";
import { ForgeContent, TalentsContent } from "@/types/forge";
import { ArenaContent, BossLabels, Duels, FinaleContent, HudLabels } from "@/types/game";
import { Github } from "@/types/general";
import { Headline } from "@/types/headline";
import { HistoryLabels } from "@/types/history";
import { ProjectDetail, ProjectMapContent } from "@/types/projects";
import { Recommendation } from "@/types/recommendations";
import { Resume } from "@/types/resume";
import { Roster } from "@/types/roster";
import { SectionIntros } from "@/types/sections-intros";
import { ServiceActions, ServiceGroup } from "@/types/services";
import { Skill, SkillArea } from "@/types/skills";
import { TerminalContent } from "@/types/terminal";


export interface PortfolioData {
  intro: string;
  headline: Headline;
  terminal: TerminalContent;
  cover: string;
  cv: string;
  typingsTitles: string[];
  details: Detail;
  github: Github[];
  stackoverflow: string;
  sections: {
    [x: string]: SectionIntros;
  };
  serviceGroups: ServiceGroup[];
  serviceActions: ServiceActions;
  education: Resume[];
  experience: Resume[];
  historyLabels: HistoryLabels;
  skills: {
    design: Skill[];
    language: Skill[];
    tech: Skill[];
    tools: Skill[];
    frontend: Skill[];
    testing: Skill[];
    integrations: Skill[];
    observability: Skill[];
    ai: Skill[];
    expertise: Skill[];
    teamplayer: Skill[];
  };
  skillAreas: SkillArea[];
  roster: Roster;
  forge: ForgeContent;
  talents: TalentsContent;
  projects: ProjectDetail[];
  projectMap: ProjectMapContent;
  caseStudies: CaseStudy[];
  caseStudyFilters: CaseStudyFilters;
  duels: Duels;
  bossLabels: BossLabels;
  hud: HudLabels;
  arena: ArenaContent;
  finale: FinaleContent;
  platformDiagrams: PlatformDiagrams;
  codeReview: CodeReviewContent;
  web3: Web3Content;
  igaming: IGamingContent;
  recommendations: Recommendation[];
  aiUsage: PortfolioAiUsage;
  socialMedia: {
    byUsername: {
      twitter: string;
      instagram: string;
      facebook: string;
      linkedIn: string;
    };
    byProjectsUsername: {
      gameYt: string;
    };
  };
}

const LINKEDIN_USERNAME = "redeemer-pace-685692b9";

export const portfolioData: PortfolioData = {
  intro:
    "Hello! I’m <strong>Redeemer Pace</strong>. Let's get to know each other, shall we?",
  headline: {
    lines: [
      "Software architect who ships with AI agents. Payments, ledgers and platform architecture.",
      "Open to architect, lead and AI engineering roles, full time or B2B.",
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
      { label: "Architecture", target: "for-architecture" },
      { label: "AI engineering", target: "for-ai-engineering" },
      { label: "Payments", target: "for-payments" },
      { label: "Technical leadership", target: "for-leadership" },
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
  terminal: {
    prompt: "visitor@redgame.dev:~$",
    welcome: [
      "Welcome to redgame.dev. Type help to see what I can show you, or tap a command below.",
      "Or ask me to do something: red create app, red fix my app, red migrate app, red enable ai in my company, red hire as cto.",
      "Press ` anywhere on the page to come back to this prompt.",
    ],
    suggestions: ["help", "red create app", "red fix my app", "red enable ai in my company", "red hire as architect", "whoami", "experience"],
    helpTitle: "Commands",
    unknownCommand: "command not found: {name}. Type help to see what I can show you.",
    inputLabel: "Terminal command",
    shortcutHint: "Press ` from anywhere",
    red: {
      summary: "Ask me to do something for you",
      usage: "red <create app | fix my app | migrate app | enable ai in my company | hire as <role>>",
      questTitle: "Quest accepted",
      hireTitle: "Character selected",
      rolesHeading: "Roles I can play",
      unknownIntent: "I do not know how to \"{input}\" yet. Try one of these:",
      unknownRole: "No role called \"{role}\". Try one of these:",
      hireSubject: "Hiring: {role}",
      scanDone: "done",
      opening: "Opening the quest...",
      labels: {
        services: "What I would do",
        proof: "Where I have done it",
        abilities: "Abilities",
        guilds: "Guilds",
        recommendations: "What people say",
        level: "Level",
        email: "Email me about it",
        linkedIn: "LinkedIn",
        cv: "Download my CV",
        caseStudies: "See the boss fights",
        close: "Close",
      },
      intents: [
        {
          phrase: "create app",
          aliases: ["create an app", "create my app", "build app", "build an app", "build my app", "new app"],
          title: "Zero to one",
          pitch: "From an idea to a product people use, built so no vendor or framework locks you in later.",
          scan: [
            "Reading the brief",
            "Picking a stack you can swap pieces of later",
            "Drawing the architecture and the first release",
            "Putting payments, auth and analytics behind adapters",
          ],
          services: ["Full Stack Product Engineering", "Software Architecture & Technical Leadership", "Product, Growth & Marketing Leadership"],
          cases: ["No vendor lock-in, by design", "Frameworks at the edges"],
          subject: "Building a new product",
        },
        {
          phrase: "fix my app",
          aliases: ["fix app", "fix an app", "fix my website", "rescue my app", "fix my ai app"],
          title: "Rescue mission",
          pitch: "Find what is actually broken, fix it, and leave tests behind so it stays fixed.",
          scan: [
            "Profiling the slow paths",
            "Reading the error trail",
            "Checking the AI generated parts twice",
            "Writing the regression tests before the fix",
          ],
          services: ["AI-Generated App Rescue & Hardening", "Performance Engineering", "Architecture & Security Review"],
          cases: ["A consent flow no API test could see", "A budget anyone could drain", "Designed for enterprise volume"],
          subject: "Fixing my app",
        },
        {
          phrase: "migrate app",
          aliases: ["migrate my app", "migrate", "migration", "migrate platform", "migrate my platform"],
          title: "The great migration",
          pitch: "Move platforms without a big bang: the old and the new side by side, switched market by market.",
          scan: [
            "Mapping what the old platform really does",
            "Putting both platforms behind one adapter",
            "Planning the switch per market, with a way back",
            "Counting licence, hosting and infrastructure for both",
          ],
          services: ["CMS & Platform Migration", "Software Architecture & Technical Leadership"],
          cases: ["A migration that pays for itself", "Infrastructure that can be switched"],
          subject: "Migrating our platform",
        },
        {
          phrase: "enable ai in my company",
          aliases: ["enable ai", "enable ai in my team", "ai in my company", "bring ai to my company", "enable ai in our company"],
          title: "AI enablement",
          pitch: "Agents your teams can trust: clear rules, a person reviewing every change, and a token budget that holds.",
          scan: [
            "Finding where AI already helps and where it hurts",
            "Writing the rules agents work under",
            "Setting the review gates and the token budget",
            "Showing the teams the workflow on their own code",
          ],
          services: ["Enterprise AI Enablement & Agent Workflows", "LLM Integration", "AI-Generated App Rescue & Hardening"],
          cases: ["Decisions that survive long agent sessions"],
          subject: "AI enablement for our company",
        },
      ],
    },
  },
  cover: "/images/cover-picture.webp",
  cv: "/cv/redeemer-pace-cv.pdf",
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
    "Your next <strong>Architect who ships with AI agents</strong>",
    "Your next <strong>Frontend Engineer</strong>",
    "Your next <strong>Backend Engineer</strong>",
    "Your next <strong>Architect</strong>",
    "Your next <strong>Game Developer</strong>",
    "Your next <strong>Game Consultant</strong>",
    "Your next <strong>App Developer</strong>",
    "Your next <strong>Software Engineer</strong>",
    "Your next <strong>Tech Consultant</strong>",
    "Your next <strong>Business Consultant</strong>",
    "Your next <strong>Marketing Consultant</strong>",
  ],
  sections: {
    terminal: {
      title: "Ask the Terminal",
      description: [
        "Prefer the command line? Everything on this page is one command away. Start with help.",
      ],
    },
    history: {
      title: "My History",
      description: [
        "Employment runs on the main line. The companies I founded run beside it on their own branch, because I have always built alongside the day job.",
      ],
    },
    services: {
      title: "What can I offer?",
      description: [
        "What I take on, grouped by area. Each card is work I have done for real, and each one has a direct line to me.",
      ],
    },
    design: {
      title: "Design Skills",
      description: [
        "Design may not be my main expertise, but I've handled numerous designs throughout my career.",
      ],
    },
    language: {
      title: "Language Skills",
      description: [
        "Most of the time, I communicate primarily in English, sometimes even more than in my mother tongue.",
      ],
    },
    tech: {
      title: "Programming Languages & Frameworks Skills",
      description: [
        "Have an overview of my expertise in tech. Are there any skills that interest you?",
      ],
    },
    tools: {
      title: "Tools Skills",
      description: [
        "I generally use a variety of tools. Some I use less often, and some more, depending on the current task.",
      ],
    },
    frontend: {
      title: "Frontend Ecosystem",
      description: [
        "The tooling and patterns I reach for when building and governing a frontend at scale, rather than a single app.",
      ],
    },
    testing: {
      title: "Testing & Quality",
      description: [
        "Quality is not a phase at the end. These are the practices I introduce and keep alive across a codebase.",
      ],
    },
    integrations: {
      title: "Enterprise Integrations & Platforms",
      description: [
        "Third-party platform boundaries and integrations I have designed or architected across Conrad and prior roles.",
      ],
    },
    observability: {
      title: "Observability & Analytics",
      description: [
        "Knowing what production is actually doing, and giving the business the numbers it needs to decide.",
      ],
    },
    ai: {
      title: "AI Tools & Enablement",
      description: [
        `AI is part of how I architect and deliver, not a side experiment. Here's what I use and how far I take it,
        from parallel-agent research to documenting AI-assisted decisions for a whole delivery organisation.`,
      ],
    },
    aiUsage: {
      title: "How I use AI day to day",
      description: [
        `I built machine learning models before LLMs and used AI coding tools before ChatGPT, and I have built integrations and
        internal tooling on the GPT, Claude and Gemini APIs for content, classification, data extraction and agent workflows, across
        my own products, client work and Conrad. Today AI is part of almost every task I work on, from writing code to preparing a
        stakeholder update. Here is what that looks like in numbers, the rules I work by, and how I got here.`,
      ],
    },
    expertise: {
      title: "Expertise",
      description: [
        "I have expertise in various roles; each provides a snapshot of my overall knowledge.",
      ],
    },
    skillAreas: {
      title: "More Skills by Area",
      description: [
        `Areas I build in beyond the skills in the forge. Each comes from several roles, ventures and client projects, my own platform
        being one of them, so they are listed rather than rated.`,
      ],
    },
    teamplayer: {
      title: "Team Player",
      description: [
        "While skills are important, being a team player is essential for success of the team. We're together in this and we solve things together.",
      ],
    },
    caseStudies: {
      title: "Boss Fights",
      description: [
        `Real problems from across my roles, client work and my own platform. Each boss loses health as you read how it was beaten,
        and drops the rule I kept.`,
      ],
    },
    web3: {
      title: "On Chain",
      description: ["Web3 from fan tokens at scale to a chain of my own. Each block below is somewhere it shipped, confirmed as you read it."],
    },
    igaming: {
      title: "Live Table",
      description: ["iGaming from the live casino floor to regulated platforms for clients. The cards are dealt as you arrive."],
    },
    codeReview: {
      title: "Code Review and Open Source",
      description: ["The work behind the work: reading other people's code closely, in teams and in the open."],
    },
    platform: {
      title: "The Platform at a Glance",
      description: ["Two views of my own platform, unnamed: where vendors and hosts plug in, and how money moves through it."],
    },
    arena: {
      title: "Bug Raid",
      description: ["A break from reading. Squash the bugs before they reach production. Your best score stays in this browser."],
    },
    duels: {
      title: "Human vs Agent",
      description: [
        "PvP, honestly: every round here happened. An agent proposed something, I overruled it, and the better fix shipped.",
      ],
    },
    forge: {
      title: "Skills",
      description: [
        `No self ratings. Each skill's rarity is earned from how long I have used it in real roles, projects and study, measured from
        their dates, and every card says where.`,
      ],
    },
    talents: {
      title: "Talents",
      description: ["The skills that do not fit in a stack: how I work with people."],
    },
    roster: {
      title: "Characters I Play",
      description: [
        `Every role I have held, as a character in my own party. Level is the years in that role, measured from real dates.
        Stats are my own scores.`,
      ],
    },
    projects: {
      title: "Projects & Achievements",
      description: [
        "Every project is a region on the map, laid out in the order I explored them. Pick one to open its map: what I built there, the loot, and where to see it.",
      ],
    },
    recommendations: {
      title: "Recommendations",
      description: [
        "I have recommendation letters from KPMG, Authentic Gaming, reNFT and more, and I can share them on request. A few lines from them:",
      ],
    },
  },
  details: {
    name: "Redeemer Pace",
    intro: "Architect. Builder. Founder.",
    hook: `I started programming at 7 and never stopped. More than twenty years later I have built game engines, payment systems, a
    blockchain and platforms used by millions, and founded companies of my own along the way.`,
    paragraphs: [
      `I am a software architect with 12+ years in the industry, about 7 of them leading as architect, tech lead and CTO. I design
      systems that are not tied to a vendor or a framework, and I stay hands on while I do it.`,
      `I build with AI agents. I write the rules, the context and the checks they work within, and a person reviews every change. The
      "How I use AI" section shows what that looks like day to day.`,
      `I have worked across e-commerce, payments, iGaming, game publishing and Web3, on the engineering side and on the business side.
      That is why I can be useful to a CTO in the morning and to a marketing team in the afternoon.`,
      "I am looking for an architect, technical leadership or AI engineering role where the problems are hard and the standards are high.",
    ],
    proof: [
      { value: "12+", label: "years in the industry" },
      { value: "7", label: "years leading as architect, tech lead and CTO" },
      { value: "5M+", label: "monthly users on the largest platform" },
      { value: "298", label: "pull requests merged, 520 reviewed" },
      { value: "8", label: "ventures on GitHub" },
    ],
    facts: [
      "Maltese citizen with EU work rights",
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
  serviceActions: {
    email: "Email me about this",
    linkedIn: "LinkedIn",
  },
  serviceGroups: [
    {
      label: "Architecture & Platforms",
      services: [
        {
          title: "Software Architecture & Technical Leadership",
          icon: faSitemap,
          description: `I take ownership of the architecture and stay hands on while doing it. I work across engineering, product, QA
          and stakeholders up to CTO level, and I design so that a vendor, a framework or a cloud can be changed without a rewrite.`,
          points: [
            "Target architecture, trade offs and a migration path",
            "C4 diagrams, decision records and a numbered decision log",
            "Adapter contracts for every external vendor, with business logic kept free of framework code",
            "Infrastructure behind adapters, with a written cut over plan that protects data",
            "Technical direction across several squads, with mentoring and review",
            "A clean handover guide at the end",
          ],
          emailSubject: "Software architecture",
        },
        {
          title: "Payments & Ledger Architecture",
          icon: faCreditCard,
          description: "I design and build the money side of a product so that it adds up, survives retries and passes review.",
          points: [
            "Payment gateway that is not tied to one provider",
            "Double entry ledgers with reconciliation",
            "Payouts, multi currency and tax per region",
            "Holds and wallet adjustments above a threshold need a second admin's approval",
            "Idempotency and signed webhooks end to end",
            "KYC, AML and PCI scope designed in from the start",
          ],
          emailSubject: "Payments and ledgers",
        },
        {
          title: "CMS & Platform Migration",
          icon: faArrowRightArrowLeft,
          description: "I plan and lead migrations off legacy platforms, from the first audit to the rollout per market.",
          points: [
            "Content and component audit, with redirects, forms and translations counted",
            "Content model and CMS evaluation",
            "An adapter so old and new run side by side behind a feature flag",
            "A working proof of concept before commitment",
            "Rollout plan per market with rollback",
            "A business case that shows what the move saves, licence and running cost included",
          ],
          emailSubject: "Platform migration",
        },
        {
          title: "Architecture & Security Review",
          icon: faShieldHalved,
          description: "I review a codebase or a set of pull requests and return findings against the real code with a fix plan.",
          points: [
            "Findings shown on the exact lines, with numbered fix steps",
            "Authorisation, billing integrity and data exposure checks",
            "Supply chain and dependency review",
            "A definition of done the re-review is checked against",
          ],
          emailSubject: "Architecture review",
        },
      ],
    },
    {
      label: "AI",
      services: [
        {
          title: "Enterprise AI Enablement & Agent Workflows",
          icon: faBrainCircuit,
          description: `I help an engineering organisation adopt AI agents safely and get real speed from them, from the policy down
          to the repository.`,
          points: [
            "Tool evaluation, including MCP options and data privacy",
            "Rules for what agents may access, per environment, read only where it should be",
            "Project instructions, skills, commands and subagents written for your codebase",
            "Human review, security checks and verification on the real surface built into the workflow",
            "Decision registers so long sessions lose nothing",
            "Cost and context control so usage stays affordable",
          ],
          emailSubject: "AI enablement",
        },
        {
          title: "LLM Integration",
          icon: faWandMagicSparkles,
          description: "I build features and internal tools on the GPT, Claude and Gemini APIs, with the guardrails a real product needs.",
          points: [
            "Content generation, summaries and translation",
            "Classification and moderation behind a provider interface, so the model can be swapped",
            "Data extraction and analysis over documents and logs",
            "Tool calling and agent workflows that act on your systems",
            "Prompt standards, output checks and cost limits",
          ],
          emailSubject: "LLM integration",
        },
        {
          title: "AI-Generated App Rescue & Hardening",
          icon: faCog,
          description: `Shipped fast with AI and now it is buggy, insecure, leaking data, or actively under attack?
          I audit the codebase, close the holes, and get it stable enough to trust in production. Urgent help?`,
          emailSubject: "AI app rescue",
        },
      ],
    },
    {
      label: "Engineering",
      services: [
        {
          title: "Full Stack Product Engineering",
          icon: faLayerGroup,
          description: "I build features end to end across web, mobile and desktop, and take them to production.",
          points: [
            "React, Next.js, Vue and Nuxt on the front",
            "Node.js with NestJS, or Laravel, on the back",
            "React Native, Flutter and Electron apps",
            "Tests at the seams, including end to end",
            "Zero to one builds as well as existing codebases",
          ],
          emailSubject: "Product engineering",
        },
        {
          title: "Performance Engineering",
          icon: faGaugeHigh,
          description: "I find and remove what makes a product slow, in the browser and on the server.",
          points: [
            "Profiling of rendering, canvas and heavy client code",
            "Query and index review, pagination and caching rules",
            "Lighthouse and real device checks before and after",
            "Native modules where the web is not enough",
          ],
          emailSubject: "Performance",
        },
        {
          title: "Web3 Platform Engineering",
          icon: faCubes,
          description: "I build and review products that touch chains, wallets and contracts.",
          points: [
            "Wallet connections and contract interactions on EVM chains",
            "Marketplaces, launchers and token platforms",
            "Smart contract review for attack paths",
            "Experience from parachains to a chain of our own",
          ],
          emailSubject: "Web3",
        },
        {
          title: "Games & Real Time Systems",
          icon: faGamepadModern,
          description: "I design and build game and live systems where latency and scale decide the experience.",
          points: [
            "Game UI in PixiJS, WebGL and canvas",
            "Real time back ends over WebSockets and server sent events",
            "Custom engine work in C/C++ and Lua",
            "Monetisation with in game purchases and subscriptions",
          ],
          emailSubject: "Games and real time",
        },
      ],
    },
    {
      label: "Product & Growth",
      services: [
        {
          title: "Product, Growth & Marketing Leadership",
          icon: faBullhorn,
          description: `I have founded and run my own companies, so I can sit on the business side of the table as well as the technical
          one. That mix is what a CPTO role needs: one person who understands both worlds.`,
          points: [
            "Product direction, roadmap and monetisation from zero to launch",
            "Paid acquisition on Meta, Google, TikTok and other networks",
            "Community building and content across social and streaming platforms",
            "Founder and executive experience across 12+ startups, as CEO, CTO and on the marketing side",
            `I have also built an ads engine with its own auction, bidding and attribution, so I know advertising from the buyer's
            side and the builder's side`,
          ],
          emailSubject: "Product and growth",
        },
        {
          title: "TasteTravellers Collaborations",
          icon: faPlane,
          description: "",
          emailSubject: "TasteTravellers collaboration",
        },
      ],
    },
  ],
  historyLabels: {
    experience: "Experience",
    education: "Education",
    main: "Employment",
    ventures: "Companies I founded",
    role: "Role",
    venture: "Venture",
    present: "Present",
    to: "to",
    showMore: "Show {count} more",
    showLess: "Show less",
    industryFilter: "Industries I know",
    allIndustries: "All",
    industryMatches: "{count} roles in {industry}",
  },
  experience: [
    {
      title: "Lead Software Architect / Enterprise Architect, Conrad Electronic Group",
      industries: ["ecommerce", "fintech", "consulting"],
      from: "Nov 2025",
      outcome: "Roughly 5M+ monthly users, working with 90+ people up to CTO level",
      description: [
        "Conrad Electronic is a European electronics retailer operating across 16 markets, DACH-led.",
        `Leading software architecture across a 90+ person delivery organisation for the migration from Adobe Experience Manager
        to a Nuxt SSR + headless CMS stack, reporting to the Head of Engineering (A&R / SEFE / PDP).`,
        "Sitting on architecture governance across product, marketing, DevOps, content, and engineering teams.",
      ],
      bullets: [
        `Designed and built the CMS Adapter API, an anti-corruption layer with handler registry, BFF pattern, versioned response contract,
        HMAC-signed authentication, and versioned preview tokens`,
        `Authored 11 numbered Architecture Decision Records covering adapter architecture, versioning, cache invalidation, BFF dispatcher,
        feature-flag integration, authentication, media handling, editor plugin, email templating, and trunk-based Strapi config`,
        `Kept the CMS adapter framework free by construction: 69 TypeScript files with zero Vue or Nuxt imports, one typed contract,
        Strapi, AEM and backend for frontend providers chosen by feature flag, and a block registry that uses TypeScript exhaustiveness
        so no block type ships unregistered`,
        `Built the full C4 set, 14 diagrams across system landscape (customer, authoring and storefront views), context, container,
        component, deployment and dynamic, as draw.io sources with automated Confluence export, plus a C4 model guide for the team`,
        "Wrote the migration timeline and roadmap, a numbered decision log and a handover guide alongside the diagrams",
        "Per-country feature-flag rollout via Istio VirtualService so individual markets migrate independently under monitoring and rollback",
        "Three-layer feature-flag architecture on OpenFeature + GO Feature Flag",
        "Provider-agnostic switching between AEM and Strapi through a single environment flag (NUXT_PUBLIC_CMS_PROVIDER)",
        "Designed and built the Conrad CMS Editor plugin for the Strapi admin (cross-locale copy, focal-point picker, diff preview, git-diff-style readouts)",
        "Real production-grade preview surface driven by Strapi admin (viewport matrix, audience matrix, market matrix, per-block Render As)",
        "Evaluated 30 CMS platforms against scored criteria for vendor selection",
        `Led the architectural use and evaluation of AI tooling (Claude Code Max CLI, Gemini Enterprise, Strapi MCP, Figma AI) across the delivery
        organisation, including the ADR-driven documentation pattern for AI-assisted decisions`,
        `Third-party integration boundary mapping across 8 external systems (Zendesk, RWS TMS, SendGrid via PHP, Cliplister DAM, OCI Procurement,
        Adobe Target, Insider, Kameleoon)`,
        `Analytics integration design (GA4, server-side GTM, Usercentrics, BigQuery + Looker Studio consumption for pilot-country and
        rollback decisions)`,
      ],
      techStack: [
        "AEM",
        "Strapi v5",
        "Nuxt 4",
        "Vue.js",
        "TypeScript",
        "Node.js",
        "Cloudflare Workers",
        "Varnish",
        "Istio",
        "GKE",
        "Helm",
        "Aiven Postgres",
        "OpenFeature",
        "GO Feature Flag",
        "Kameleoon",
        "Insider",
        "Cidaas OIDC",
        "SendGrid",
        "Adobe Target",
        "Zendesk",
        "SAP Ariba",
        "Oracle OCI",
        "Cliplister",
        "RWS TMS",
        "PIM (Elasticsearch)",
        "Grafana / Faro",
        "OpenTelemetry",
        "Pyroscope",
        "Datadog",
        "GA4",
        "SGTM",
        "Usercentrics",
        "BigQuery",
        "Looker Studio",
        "Claude Code",
        "Gemini Enterprise",
        "Git",
        "Design Systems",
        "SSR / SSG",
        "Micro-frontends",
        "Playwright",
        "Automated Testing",
        "Code Review",
        "CI/CD",
        "C4 model",
        "TDD",
        "Figma",
        "SASS",
      ],
    },
    {
      title: "Senior Full Stack Engineer, HyperPlay Labs",
      industries: ["gamePublishing", "web3"],
      from: "Oct 2023",
      to: "Nov 2025",
      description: [
        `HyperPlay is the world's first Web3 game launcher, pioneering how decentralized games are discovered,
        played, and integrated with crypto ecosystems.`,
        "Scope: Product Architecture, Web3 Platform Delivery, Electron, Mobile, and Developer Experience.",
      ],
      bullets: [
        "Built scalable architectures for both the web platform and Electron based desktop app, ensuring maintainability and high performance.",
        "Introduced and architected the mobile app using React Native, enabling a consistent cross platform user experience. English",
        "Implemented and optimized scalable features across the main website, game store, developer portal, and launcher client.",
        "Maximized performance using Lighthouse audits and native C/C++ modules, particularly for mobile and desktop builds.",
        "Contributed to product innovation, shaping new directions and collaborating with stakeholders to drive core feature growth.",
        "Led and participated in code reviews across a multistack environment to uphold quality and maintainability.",
        "Conducted smart contract security audits, identifying potential vector attacks and improving overall Web3 security posture.",
        "Wrote high coverage automated tests across stacks (backend, frontend, mobile, desktop), ensuring regression safety and reliability.",
        "Built components using an internal design system, complete with Storybook documentation and interaction testing.",
        "Delivered 0 to 1 product initiatives, building new marketing facing and core platform features from scratch.",
        "Actively contributed across multiple languages and frameworks, including Node.js, Rust, and Solidity.",
        "Worked with Web3 integrations, managing wallet connections and blockchain interactions across EVM compatible chains",
        "Established DX (Developer Experience) improvements, including CLI tools, scaffolders, and internal documentation.",
        "Led performance profiling and optimization for Electron and mobile environments, reducing memory usage and load times.",
        "Collaborated with community developers, integrating their feedback into the roadmap and open source contributions.",
        "Contributed to product architecture and key technical decisions across the web platform, developer portal, Electron launcher, and mobile direction.",
        "Supported migration and modernization work across frontend, desktop, backend, and Web3 systems, improving maintainability and long-term scalability.",
        `Worked closely with product and engineering stakeholders to turn early product ideas into technical plans, architecture
          decisions, and production-ready features.`,
      ],
      techStack: [
        "Next.js (App Router, SSR)",
        "React",
        "React Native",
        "Node.js",
        "Electron",
        "PostgreSQL",
        "GraphQL",
        "Rust",
        "Solidity",
        "C/C++",
        "SASS",
        "AWS",
        "Microservices",
        "Vercel Enterprise",
        "TypeScript",
        "Git",
        "Storybook",
        "Design Systems",
        "Automated Testing",
        "Code Review",
        "TDD",
        "Figma",
        "Jest",
        "The Graph Protocol",
        "Alchemy",
        "Wagmi",
        "Ethers.js",
        "Docker",
        "Android Studio",
        "XCode",
        "ChatGPT",
      ],
    },
    {
      title: "Senior Frontend Engineer, reNFT Labs",
      industries: ["web3"],
      from: "Jan 2023",
      to: "Aug 2023",
      description: [
        "An interesting company that offers NFT rentals, integrating with various industries like gaming.",
        "Scope: Frontend Architecture, Product Collaboration, Web3 Marketplace, and Technical Decisions.",
      ],
      bullets: [
        "Developed NFT Marketplace V2 in close collaboration with the Tech Lead, ensuring a scalable, modular architecture.",
        "Architected and implemented performance optimized solutions, achieving high Lighthouse scores and following best practices for frontend performance.",
        "Built reusable UI components using Radix UI, collaborating effectively with the Design team to maintain consistent design language.",
        "Maintained a comprehensive Storybook with interaction tests to ensure UI components remain robust and well documented.",
        "Contributed to architectural and stack level decisions across both backend and frontend technologies.",
        "Implemented scalable new features on both the landing page and marketplace, adapting to evolving product priorities.",
        "Wrote end to end Playwright tests with high test coverage, ensuring critical workflows remained bug free across releases.",
        "Handled iterative improvements and issue fixes, helping prioritize tasks based on user and business impact.",
        `Delivered the V2 reNFT landing page, which laid the foundation before the rebranding to 021. This was done under the
          supervision of the Tech Lead, while I owned the implementation and delivery from 0 to 1.`,
        "Refactored major parts of the codebase, simplifying complex logic and improving maintainability.",
        "Introduced frontend interactions using Wagmi and Ethers to communicate with smart contracts.",
        `Contributed beyond frontend implementation, supporting product-related issues, software architecture, systems thinking,
          technical decisions, and team alignment.`,
        "Worked closely with technical leadership to build consensus around frontend architecture, product decisions, and implementation direction.",
        `Supported the transition from earlier product architecture into a more scalable V2 marketplace and landing page
          foundation, contributing to modernization, performance, testing, and maintainability.`,
      ],
      techStack: [
        "React",
        "Next.js (SSR)",
        "Radix UI",
        "Wagmi",
        "GraphQL",
        "Alchemy",
        "The Graph Protocol",
        "Azrael",
        "Sylvester",
        "Solana",
        "Solidity",
        "Git",
        "Playwright",
        "Storybook",
        "Automated Testing",
        "TypeScript",
        "TDD",
        "Figma",
        "Jest",
        "Ethers.js",
        "ChatGPT",
      ],
    },
    {
      title: "Founder & Architect, Gamified Social Network Platform",
      industries: ["fintech", "sports", "social"],
      isVenture: true,
      from: "2021",
      outcome: "Payments, ledgers, ads and real time, with every vendor and host switchable by configuration",
      description: [
        "A gamified social network platform of my own: payments, double entry ledgers, an ads engine with its own auction, and real time feeds.",
        'I architect it and ship it with AI agents, inside the context, rules, checks and reviews described in the "How I use AI" section.',
      ],
      bullets: [
        `Every external vendor and host sits behind an adapter, so a provider can be added, run in parallel and switched by
        configuration, with a written cut over procedure for anything that holds data`,
        "Designed for enterprise volume: keyset pagination against declared indexes, bounded scans and batched fan out",
        "Plain TypeScript core, with framework code confined to adapters and entry points",
        "Lean dependencies: most domain packages run on a handful of libraries, and the cross cutting machinery is written in house",
        "Money paths tested through the real API on synthetic data at real volume, with every money moving step behind an explicit flag",
        "Acts as an OIDC provider for client apps, with consent and a separate user identifier per app",
        "Agent setup: skills adapted from an open source collection and extended, a design review subagent and decision registers",
      ],
      techStack: [
        "TypeScript",
        "NestJS",
        "Next.js",
        "PostgreSQL",
        "Supabase",
        "Drizzle",
        "Redis",
        "Stripe",
        "Cloudflare R2",
        "Railway",
        "Vercel",
        "Sentry",
        "Playwright",
        "Vitest",
        "Git",
        "TDD",
        "Automated Testing",
        "Code Review",
        "CI/CD",
        "Zustand",
        "Radix UI",
        "Storybook",
        "C4 model",
        "Figma",
        "Docker",
      ],
    },
    {
      title: "Founder, CEO at TasteTravellers",
      industries: ["travel"],
      from: "Feb 2018",
      description: [
        "Our popular travel page & community",
        `We focus on bringing authentic travel experiences to their audience and 
        we're engaged in creating and sharing high-quality content related to food, drinks, travel destinations, and accommodations.`,
      ],
      isVenture: true,
      bullets: [
        "Built the brand across a Facebook page and group, Instagram, YouTube and an online store.",
        "Content creation and curation, photography and visual storytelling for food, drink and travel destinations.",
        "Community engagement and audience growth, advertising on a budget across social platforms.",
        "E-commerce management for the TasteTravellers store on Shopify.",
        "Collaborations and partnerships with travel related companies, promoted to the community.",
      ],
      techStack: [
        "Shopify",
      ],
    },
    {
      title: "Founder, CEO & CTO, Gods of Zushin",
      industries: ["gamePublishing"],
      from: "Apr 2015",
      description: [
        "An achievement on its own with over 5 years in production environment.",
        "A Game MMORPG project developed during studies to enhance my knowledge in various of areas, which can be discuss.",
      ],
      isVenture: true,
      bullets: [
        "Led the project end to end for over five years, overseeing game design, development, infrastructure, and operations.",
        `Designed and built a custom high performance game engine, capable of handling large-scale queries and low-latency
          multiplayer interactions, still in active use today.`,
        "Developed custom cryptographic and data compression solutions, improving security and performance in client server communication.",
        "Architected scalable client and server infrastructure, focusing on optimization, modularity, and minimal latency across game sessions.",
        "Implemented integrated payment systems, including Stripe and PayPal, enabling monetization through in game purchases and subscriptions.",
        "Managed and coordinated contributors across development, game design, community management, marketing, operations, and monetization.",
        "Executed marketing strategies on Facebook, YouTube, Twitch, Reddit, Instagram, and others to grow the community and drive engagement.",
        "Built internal tools for game moderation, analytics dashboards, and live patching systems.",
        "Designed in game economy and balancing systems based on player behavior and feedback.",
        "Implemented account and inventory systems using custom encryption and anti tamper techniques.",
        "Produced in game 2D and 3D assets, with modeling in Autodesk Maya and texture design in Adobe Illustrator.",
        "Maintained platform operations on Cloudflare, Google Cloud, and DigitalOcean, ensuring uptime and global accessibility.",
      ],
      techStack: [
        "C/C++",
        "C#",
        "Lua",
        "Python",
        "Node.js",
        "PHP (Laravel)",
        "Vue.js",
        "SQL",
        "Cryptography & Compression",
        "Stripe",
        "PayPal",
        "DigitalOcean",
        "Cloudflare",
        "Maya",
        "Illustrator",
        "Git",
      ],
    },
    {
      title: "Mobile Core Engineer / Architect, Chiliz",
      industries: ["web3", "sports"],
      from: "Nov 2019",
      outcome: "Around 2M users, 7 product squads and 30+ engineers",
      to: "Nov 2022",
      description: [
        `A blockchain and sports company building a gamified fan engagement platform with real-time rewards,
        NFT integrations, and immersive mobile and web experiences.`,
        `My official title was Mobile Core Engineer, but the practical scope expanded into architecture and
        technical leadership: architecture direction, implementation standards, delivery alignment, and core
        platform decisions across 7 product squads and 30+ engineers.`,
        "Introduced Test Driven Development org-wide, reaching 95%+ coverage on the frontend and mobile codebases.",
      ],
      bullets: [
        "Joined as a Mobile and Frontend Engineer, quickly expanding into Tech Lead and Architecture roles due to early stage startup needs and team dynamics.",
        `Built the V2 Core Architecture ("Epics Rx") from scratch, implementing routing, Sentry integration, app lifecycle
          handling (e.g., back press), and RxJS based state orchestration.`,
        `Architected the new V2 App foundation, introducing structure, modularization, and maintainability across mobile and web
          platforms in close collaboration with Tech Leads.`,
        "Inherited a critically unstable app, rapidly diagnosed root issues, and delivered fixes that restored reliability and performance.",
        `Played a central architecture and technical leadership role across 7 product squads / 30+ engineers, supporting key
          technical decisions, implementation standards, delivery alignment, architectural direction, and collaboration between
          Product Owners, Designers, Frontend Engineers, Backend Engineers, and QA.`,
        "Delivered new features and resolved bugs across the mobile app, marketing website, and back office, covering the full product stack.",
        "Led implementation of performance critical mobile modules using native C/C++, Java, Kotlin, enhancing speed and responsiveness significantly.",
        "Maximized performance and bundle efficiency using Lighthouse audits, lazy loading strategies, and optimized module resolution.",
        "Introduced Test Driven Development (TDD) processes, resulting in 95%+ test coverage on frontend/mobile codebases.",
        "Mentored junior and midlevel engineers, fostering growth across frontend and mobile teams.",
        "Refactored critical legacy code, eliminating redundancy and enforcing SOLID principles, atomic design, and separation of concerns.",
        "Served as a key technical liaison for the CPO and stakeholders, managing feature scoping, technical estimations, and delivery pipelines.",
        "Provided architectural consultancy for both product scalability and developer workflows, including tooling recommendations for engineers, marketing, and PMs.",
        "Contributed to the monorepo strategy and shared modules for better code reuse between mobile/web.",
        "Built internal component libraries and unified design system across platforms.",
        "Led developer onboarding and documented architectural patterns for scaling team growth.",
        "Delivered POCs and production-grade on-chain integrations for the mobile app using React Native.",
        `Made and supported key architecture decisions for the V2 mobile app foundation, core modules, shared patterns, state
          orchestration, routing, error handling, and maintainability.`,
        "Aligned engineers, product owners, designers, and QA around implementation direction, delivery priorities, technical tradeoffs, and release quality.",
        "Provided architecture guidance beyond mobile, contributing to web, back office, shared modules, developer workflows, and cross-platform consistency.",
        `Supported migration from unstable legacy app structures into a more maintainable V2 architecture with clearer ownership,
          testing, modularization, and performance practices.`,
      ],
      techStack: [
        "NativeScript",
        "Vue.js",
        "Webpack",
        "RxJS",
        "Redux Observables",
        "React",
        "React Native",
        "Jest",
        "Ionic",
        "Flutter",
        "Java/Kotlin",
        "Swift",
        "C/C++",
        "Solidity",
        "Git",
        "TDD",
        "Automated Testing",
        "Design Systems",
        "Sentry",
        "Android Studio",
        "XCode",
        "TypeScript",
        "Code Review",
        "Figma",
        "SASS",
        "Ethers.js",
      ],
    },
    {
      title: "Chief Technology Officer, CoinOn",
      industries: ["web3"],
      from: "Nov 2021",
      to: "Jan 2022",
      description: [
        "Delivered a full scale solution of website, mobile app and a blockchain infrastructure.",
      ],
      bullets: [
        "Defined and executed the technology roadmap, aligning engineering goals with the company’s long term vision and product milestones.",
        "Led the architecture from 0 to 1, building the entire stack from the ground up with scalability, security, and performance at its core.",
        `Managed and coordinated a cross-functional team of 10+ people across engineering, product, design, blockchain, and
          delivery, focusing on execution, mentorship, technical quality, and product outcomes.`,
        "Oversaw IT infrastructure and operations, ensuring high availability, data integrity, and efficient resource utilization.",
        "Conducted deep technical R&D to guide product innovation, platform capabilities, and blockchain integrations.",
        "Led initiatives on cybersecurity and smart contract safety, focusing on blockchain specific threat vectors and prevention strategies.",
        "Established analytics pipelines, internal KPIs, and budgeting tools to drive data informed decisions and product iteration.",
        "Directed compliance research and implementation, working on technical alignment with evolving crypto regulatory frameworks.",
        "Built disaster recovery and business continuity plans, essential for operational resilience in blockchain based environments.",
        "Handled intellectual property (IP) strategy, protecting product innovation and core technology.",
        "Acted as a key technical voice across the executive team, collaborating directly with the CEO, CPO, CSO, and CDO to align on product, strategy, and growth.",
        "Deployed secure CI/CD pipelines with audit logs, permission controls, and rollback strategies.",
        "Introduced microservice architecture with distributed backend services for modular and scalable feature development.",
        "Championed immersive UX, leveraging PixiJS for game like frontends to engage Web3 native users.",
        "Developed SDKs and APIs for 3rd party integrations and partner ecosystems.",
        "Enabled cross chain interoperability using custom bridges and indexers across Solana, Polkadot, and EVM compatible chains.",
        "Drove strategic partnerships, using technical insights to attract collaborators and investors aligned with CoinOn’s vision.",
      ],
      techStack: [
        "Flutter",
        "Node.js",
        "Next.js (SSR)",
        "Vue.js / Nuxt",
        "Rust (Substrate)",
        "Kotlin",
        "Swift",
        "NativeScript",
        "C/C++",
        "Solidity",
        "Solana",
        "Polkadot (parachains)",
        "PixiJS",
        "AWS",
        "Vercel",
        "Git",
        "CI/CD",
        "TypeScript",
        "TDD",
        "Automated Testing",
        "Figma",
        "Jest",
        "GraphQL",
        "The Graph Protocol",
        "Alchemy",
        "Ethers.js",
        "Docker",
        "Android Studio",
        "XCode",
      ],
    },
    {
      title: "Software Engineer / Technical Lead for Client Projects, KPMG",
      industries: ["fintech", "igaming", "gamePublishing", "pharmatech", "consulting"],
      from: "Feb 2019",
      to: "Sep 2019",
      description: [
        "Being hired by KPMG is one big achievement on its own, as it is one of the big 4 firm in auditing.",
        `KPMG placed me with clients as a consultant, in a software architect and hands on engineering role, including pharmatech
        and iGaming clients.`,
        `For clients I also built machine learning models in TensorFlow for suggestions and recommendations, ads, and social media
        feed ranking, and they went live.`,
      ],
      bullets: [
        `Contributed to and led architecture decisions across multiple brownfield migrations and greenfield projects for KPMG
          clients across finance, iGaming, Web3, game publishing, and enterprise software.`,
        `Developed and delivered full stack features across frontend, backend, and core software, taking ownership from
          requirements and architecture through implementation, testing, deployment, and client delivery.`,
        "Worked with multiple industries daily, often adapting rapidly to sector specific constraints and requirements.",
        `Performed onsite development, technical presentations, and stakeholder collaboration, aligning client requirements,
          product goals, design direction, engineering feasibility, and infrastructure constraints.`,
        `Handled key architecture and technical decisions for multiple client projects, including brownfield migration and
          modernization, greenfield systems from early planning to delivery, early-stage Web3 initiatives, iGaming platforms
          requiring compliance, scalability and real-time performance, and game publishing tools for content delivery, user
          management and interactive experiences.`,
        `Delivered end-to-end systems from 0 to 1, defining project scope, architecture, implementation plans, technical
          standards, and delivery milestones together with clients, designers, product owners, and engineering teams.`,
        "Integrated new features and resolved critical bugs based on client feedback and evolving project goals.",
        `Managed and coordinated multiple engineers to achieve project goals, including task breakdown, implementation guidance,
          code reviews, mentoring, technical evaluations, and delivery alignment.`,
        `Introduced coding standards, architecture documentation, and delivery guidelines for client projects, improving
          onboarding, consistency, maintainability, and long-term project handover.`,
        "Delivered PixiJS based immersive interfaces for clients in game publishing and iGaming and interactive media.",
        "Worked closely with client QA and DevOps teams to ensure CI/CD readiness across projects.",
        "Migrated and modernized multiple brownfield client projects, improving maintainability, scalability, performance, and delivery quality.",
        "Helped define greenfield project foundations, including architecture, stack choices, technical standards, development workflows, and delivery planning.",
        "Handled key technical decisions for KPMG clients, balancing business needs, product requirements, engineering complexity, UX direction, and delivery timelines.",
        "Collaborated closely with designers and product owners to translate product goals, user flows, and design requirements into practical technical solutions.",
        "Presented technical direction onsite when required, supporting client alignment, delivery confidence, and stakeholder decision-making.",
        "Coordinated engineers across multiple client projects to ensure delivery goals were met without sacrificing code quality, maintainability, or scalability.",
        "Worked on regulated deposit and withdrawal flows for iGaming clients under Malta licensing",
      ],
      techStack: [
        "TensorFlow",
        "PHP (Laravel)",
        "Vue.js",
        "Angular",
        "React",
        "Node.js",
        "PixiJS",
        "Native Canvas",
        "C# (ASP.NET)",
        "C/C++",
        "Git",
        "Code Review",
        "CI/CD",
        "TypeScript",
        "TDD",
        "Automated Testing",
        "Unity",
        "Unreal Engine",
        "Figma",
        "Jest",
        "SASS",
      ],
    },
    {
      title: "Frontend Game Engineer, AuthenticGaming",
      industries: ["igaming"],
      from: "Jul 2017",
      to: "Jan 2019",
      description: [
        `One of the companies that given me a lot of experiences throughout the years. 
        This company is an iGaming Company, which was my first experience in iGaming.`,
      ],
      bullets: [
        `Went beyond the role of a Frontend Engineer, actively contributing to real time backend logic using Node.js and
          WebSockets to support live game data and streaming interactions.`,
        `Developed internal operator tools that streamlined and automated the onboarding and integration of new casino operators,
          reducing manual effort and scaling client support.`,
        "Contributed to the design and development of a new architecture, improving code maintainability and scalability across the frontend stack.",
        `Built and presented a POC Bet Table using PIXI.js, showcasing an interactive, canvas based experience to the broader
          engineering team and the CTO contributing to future product planning.`,
        `Shipped features and enhancements across the core game application, marketing website, and back office tools, addressing
          both user facing needs and internal operations.`,
        "Resolved bugs and technical debt across systems, improving platform stability and game reliability.",
        "Refactored legacy Backbone code into modular Redux based flows to modernize the frontend",
        "Provided technical input for WebSocket based scalability and client side state synchronization.",
        "Collaborated closely with QA and game designers to ensure UX alignment and feature quality.",
        "Implemented game performance profiling tools to detect bottlenecks in canvas rendering.",
        "Played a crucial role in the development of game UI for desktop and mobile experiences, supporting live casino product delivery.",
        "Implemented the new AG mobile application while learning and applying new frontend and mobile technologies.",
        "Took ownership of multiple projects, balancing business requirements, technical team needs, and delivery quality.",
        "Worked closely with managers, CTO-level stakeholders, QA, and designers to deliver product-facing casino game experiences.",
        `Contributed to modernization and migration from legacy frontend patterns into more maintainable Redux / RxJS-based
          flows, improving scalability and developer experience.`,
      ],
      techStack: [
        "React",
        "Redux",
        "Redux Observables",
        "RxJS",
        "Backbone.js",
        "HTML5 Canvas",
        "PixiJS",
        "Node.js (WebSockets)",
        "MongoDB",
        "Kafka",
        "SignalR",
        "Git",
        "TypeScript",
        "TDD",
        "Automated Testing",
        "Jest",
      ],
    },
  ],
  education: [
    {
      title: "Online Courses",
      // Open ended and self paced, so it would credit every listed skill from 2017 to today.
      countsForSkills: false,
      description: [
        "These courses have helped me enhance further knowledge for both practical and theoretical",
      ],
      techStack: ["Python", "Architecture", "Leadership", "Vue.js", "Angular", "React", "Laravel", "React Native", "Ionic", "NativeScript",
        "AI", "Solidity", "Substrate", "Rust", "Solana"],
      from: "Sep 2017",
    },
    {
      title:
        "Bachelor of Science (Honours) in Multimedia Software Development, MCAST",
      description: [],
      techStack: ["C#", "Blender", "Game Development", "Photoshop", "Web Development", "PHP", "Maths", "2D Animation with After Effects",
        "Object Oriented Programming", "Data Structures & Algorithms", "Software Test Automation", "UX Design"],
      from: "Sep 2015",
      to: "Jun 2017",
    },
    {
      title: "Extended Diploma Computer Software Engineering, MCAST",
      description: [],
      techStack: ["C#", "Blender", "Photoshop", "Web Development", "PHP", "Maths", "2D Animation with After Effects", "SQL", "Networking"],
      from: "Sep 2013",
      to: "Jun 2015",
    },
    {
      title: "Diploma Computer Software Engineering, MCAST",
      description: [],
      techStack: ["C#", "Blender", "Photoshop", "Web Development", "PHP", "Maths", "2D Animation with After Effects", "SQL", "Networking"],
      from: "Sep 2011",
      to: "Jun 2013",
    },
    {
      title: "Foundation in Computing, MCAST",
      description: [],
      techStack: ["C#", "Computer Systems", "Web Development", "Maths"],
      from: "Sep 2010",
      to: "Jun 2011",
    },
  ],
  skills: {
    design: [
      {
        name: "Photoshop",
        score: 80,
      },
      {
        name: "Illustrator",
        score: 60,
      },
      {
        name: "Adobe XD",
        score: 40,
      },
      {
        name: "InVision",
        score: 50,
      },
      {
        name: "Figma",
        score: 80,
      },
      {
        name: "Blender",
        score: 40,
      },
      {
        name: "Maya",
        score: 40,
      },
    ],
    language: [
      {
        name: "Maltese",
        score: 100,
      },
      {
        name: "English",
        score: 90,
      },
      {
        name: "Italian",
        score: 70,
      },
    ],
    tech: [
      {
        name: "Vue",
        score: 95,
      },
      {
        name: "Nuxt / Nuxt 4",
        score: 90,
      },
      {
        name: "Strapi v5",
        score: 90,
      },
      {
        name: "React",
        score: 90,
      },
      {
        name: "Angular",
        score: 40,
      },
      {
        name: "JQuery",
        score: 99,
      },
      {
        name: "WebGL",
        score: 80,
      },
      {
        name: "Typescript",
        score: 95,
      },
      {
        name: "Javascript",
        score: 90,
      },
      {
        name: "NodeJS",
        score: 85,
      },
      {
        name: "Flutter",
        score: 50,
      },
      {
        name: "React Native",
        score: 70,
      },
      {
        name: "Ionic",
        score: 20,
      },
      {
        name: "Cordova",
        score: 20,
      },
      {
        name: "NativeScript",
        score: 80,
      },
      {
        name: "C/C++",
        score: 70,
      },
      {
        name: "Python",
        score: 70,
      },
      {
        name: "Lua",
        score: 50,
      },
      {
        name: "PHP",
        score: 90,
      },
      {
        name: "Laravel",
        score: 60,
      },
      {
        name: "Symfony",
        score: 40,
      },
      {
        name: "SQL",
        score: 95,
      },
      {
        name: "NoSQL",
        score: 90,
      },
      {
        name: "HTML / CSS",
        score: 90,
      },
      {
        name: "LESS / SASS",
        score: 70,
      },
      {
        name: "Bash",
        score: 80,
      },
      {
        name: "Electron",
        score: 40,
      },
      {
        name: "Golang",
        score: 10,
      },
      {
        name: "Rust",
        score: 40,
      },
      {
        name: "C#, .NET",
        score: 59,
      },
      {
        name: "Kotlin",
        score: 40,
      },
      {
        name: "Java",
        score: 40,
      },
      {
        name: "Swift",
        score: 20,
      },
      {
        name: "Ruby on Rails",
        score: 70,
      },
      {
        name: "Linq",
        score: 30,
      },
      {
        name: "Solidity",
        score: 50,
      },
      {
        name: "Solana",
        score: 30,
      },
      {
        name: "RxJS",
        score: 90,
      },
      {
        name: "Ethers.js",
        score: 60,
      },
      {
        name: "Wagmi (React)",
        score: 70,
      },
      {
        name: "State Management",
        score: 90,
      },
      {
        name: "Firebase",
        score: 70,
      },
      {
        name: "NextJs",
        score: 90,
      },
      {
        name: "Graphql",
        score: 70,
      },
      {
        name: "Gatsby",
        score: 40,
      },
      {
        name: "Backbone",
        score: 60,
      },
      {
        name: "Kafka",
        score: 50,
      },
      {
        name: "SignalR",
        score: 50,
      },
      {
        name: "SocketIo",
        score: 90,
      },
      {
        name: "Ssh",
        score: 90,
      },
      {
        name: "OpenSSL",
        score: 60,
      },
      {
        name: "Canvas",
        score: 90,
      },
      {
        name: "PixiJs",
        score: 40,
      },
      {
        name: "Ramda",
        score: 60,
      },
      {
        name: "TheGraph",
        score: 50,
      },
      {
        name: "Alchemy",
        score: 60,
      },
    ],
    tools: [
      {
        name: "Git",
        score: 95,
      },
      {
        name: "Adobe Experience Manager (AEM)",
        score: 75,
      },
      {
        name: "Cloudflare Workers",
        score: 85,
      },
      {
        name: "Varnish",
        score: 75,
      },
      {
        name: "Istio",
        score: 70,
      },
      {
        name: "GKE / Kubernetes",
        score: 75,
      },
      {
        name: "Helm",
        score: 65,
      },
      {
        name: "Aiven Postgres",
        score: 60,
      },
      {
        name: "OpenFeature",
        score: 75,
      },
      {
        name: "GO Feature Flag",
        score: 75,
      },
      {
        name: "draw.io / C4 model",
        score: 90,
      },
      {
        name: "Unity",
        score: 70,
      },
      {
        name: "Unreal Engine",
        score: 30,
      },
      {
        name: "Sky Engine",
        score: 5,
      },
      {
        name: "Visual Studio 2003-2022",
        score: 99,
      },
      {
        name: "VS Code",
        score: 90,
      },
      {
        name: "JetBrains Tools",
        score: 70,
      },
      {
        name: "Android Studio",
        score: 50,
      },
      {
        name: "XCode",
        score: 20,
      },
      {
        name: "SVN",
        score: 90,
      },
      {
        name: "Cloudflare",
        score: 90,
      },
      {
        name: "AWS",
        score: 30,
      },
      {
        name: "GCP",
        score: 70,
      },
      {
        name: "Digital Ocean",
        score: 90,
      },
      {
        name: "OVH Cloud",
        score: 90,
      },
      {
        name: "Vercel",
        score: 70,
      },
      {
        name: "Fastlane",
        score: 30,
      },
      {
        name: "Google Store & Apple Store",
        score: 90,
      },
      {
        name: "Docker",
        score: 90,
      },
      {
        name: "Wordpress",
        score: 67,
      },
      {
        name: "Shopify",
        score: 50,
      },
      {
        name: "CI/CD",
        score: 85,
      },
    ],
    expertise: [
      {
        name: "Frontend Engineer",
        score: 100,
      },
      {
        name: "Backend Engineer",
        score: 75,
      },
      {
        name: "Tech Lead",
        score: 80,
      },
      {
        name: "Engineer Manager",
        score: 30,
      },
      {
        name: "Game Engineer",
        score: 80,
      },
      {
        name: "Tech Consultancy",
        score: 75,
      },
      {
        name: "Architecture",
        score: 95,
      },
      {
        name: "Enterprise Architecture",
        score: 90,
      },
      {
        name: "Platform Engineering",
        score: 85,
      },
      {
        name: "AI Enablement / AI-Assisted Engineering",
        score: 95,
      },
      {
        name: "Marketing",
        score: 50,
      },
      {
        name: "Entrepreneur",
        score: 75,
      },
      {
        name: "Designing",
        score: 40,
      },
      {
        name: "Algorithms",
        score: 65,
      },
      {
        name: "Encryption & Compression",
        score: 80,
      },
    ],
    teamplayer: [
      {
        name: "Team work",
        score: 100,
      },
      {
        name: "Face to Face Communication",
        score: 100,
      },
      {
        name: "Remote Communication",
        score: 100,
      },
      {
        name: "Mentoring",
        score: 100,
      },
      {
        name: "Managing",
        score: 95,
      },
      {
        name: "Company Culture Follower",
        score: 100,
      },
      {
        name: "Contribute Ideas",
        score: 100,
      },
      {
        name: "Executive Stakeholder Communication",
        score: 90,
      },
      {
        name: "Written Documentation & Architecture Communication",
        score: 90,
      },
      {
        name: "Cross-functional Collaboration",
        score: 90,
      },
      {
        name: "Strategic Decision-making",
        score: 90,
      },
      {
        name: "Async / Documentation-first Working",
        score: 90,
      },
    ],
    frontend: [
      {
        name: "SSR / SSG",
        score: 90,
      },
      {
        name: "Design Systems",
        score: 90,
      },
      {
        name: "pnpm",
        score: 90,
      },
      {
        name: "Micro-frontends",
        score: 85,
      },
      {
        name: "Tailwind v4",
        score: 85,
      },
      {
        name: "Radix UI",
        score: 85,
      },
      {
        name: "shadcn-vue / shadcn-ui",
        score: 75,
      },
      {
        name: "Turborepo",
        score: 70,
      },
      {
        name: "NX",
        score: 70,
      },
    ],
    testing: [
      {
        name: "Playwright",
        score: 90,
      },
      {
        name: "Storybook",
        score: 90,
      },
      {
        name: "Jest",
        score: 90,
      },
      {
        name: "TDD (Test Driven Development)",
        score: 90,
      },
      {
        name: "Automated Testing (unit, integration, end to end)",
        score: 90,
      },
      {
        name: "Code Review",
        score: 95,
      },
    ],
    integrations: [
      {
        name: "Insider (CDP & personalisation)",
        score: 80,
      },
      {
        name: "SendGrid",
        score: 80,
      },
      {
        name: "Kameleoon (A/B testing)",
        score: 75,
      },
      {
        name: "Cidaas OIDC",
        score: 75,
      },
      {
        name: "Adobe Target",
        score: 70,
      },
      {
        name: "SAP (customer master data)",
        score: 65,
      },
      {
        name: "SAP Ariba (procurement punch-out)",
        score: 65,
      },
      {
        name: "PIM (Elasticsearch)",
        score: 65,
      },
      {
        name: "Oracle OCI Procurement",
        score: 60,
      },
      {
        name: "Zendesk",
        score: 60,
      },
      {
        name: "Cliplister DAM",
        score: 55,
      },
      {
        name: "RWS TMS (translation management)",
        score: 55,
      },
    ],
    observability: [
      {
        name: "Google Analytics 4",
        score: 85,
      },
      {
        name: "Grafana / Grafana Faro",
        score: 80,
      },
      {
        name: "OpenTelemetry",
        score: 75,
      },
      {
        name: "Server-side GTM",
        score: 75,
      },
      {
        name: "Usercentrics",
        score: 75,
      },
      {
        name: "Looker Studio",
        score: 75,
      },
      {
        name: "Datadog",
        score: 70,
      },
      {
        name: "BigQuery",
        score: 70,
      },
      {
        name: "Pyroscope",
        score: 60,
      },
      {
        name: "Sentry",
        score: 80,
      },
    ],
    ai: [
      {
        name: "Claude Code Max CLI",
        score: 95,
      },
      {
        name: "Architecture + Codebase Analysis Workflows",
        score: 95,
      },
      {
        name: "Agentic Implementation with Human-in-the-loop Review",
        score: 95,
      },
      {
        name: "ADR-driven Documentation for AI-assisted Decisions",
        score: 90,
      },
      {
        name: "Parallel Sub-agent Orchestration for Multi-source Audits",
        score: 85,
      },
      {
        name: "Gemini Enterprise",
        score: 85,
      },
      {
        name: "ChatGPT / GPT-4",
        score: 80,
      },
      {
        name: "Strapi MCP",
        score: 70,
      },
      {
        name: "Figma AI",
        score: 60,
      },
    ],
  },
  forge: {
    refining: "Refining",
    tracked: "{duration}, {places}",
    years: "yrs",
    months: "mos",
    untracked: "Hands on",
    rarity: { legendary: "Legendary", epic: "Epic", rare: "Rare", common: "Common" },
    legendYears: "Rarity by years of real use",
  },
  talents: {
    talentsLabel: "Passive talents",
    languagesLabel: "Languages",
    languages: [
      { name: "Maltese", level: "Native" },
      { name: "English", level: "Fluent" },
      { name: "Italian", level: "Fluent" },
    ],
  },
  roster: {
    asOf: "Oct 2026",
    labels: {
      level: "Level",
      years: "years in the role",
      since: "since",
      guilds: "Guilds",
      abilities: "Abilities",
      play: "Play as",
      playing: "Playing",
    },
    characters: [
      {
        characterClass: "CEO",
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
        icon: faChessKnight,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "CoinOn", from: "Nov 2021", to: "Jan 2022" },
        ],
        stats: [
          { name: "Architecture", value: 95 },
          { name: "Platform Engineering", value: 85 },
        ],
        abilities: ["Technology roadmap", "Cybersecurity", "Infrastructure", "Executive team"],
      },
      {
        characterClass: "Product Owner",
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
        characterClass: "Tech Lead",
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
        icon: faServer,
        tenures: [
          { company: "Gods of Zushin", from: "Apr 2015" },
          { company: "CoinOn", from: "Nov 2021", to: "Jan 2022" },
          { company: "HyperPlay", from: "Oct 2023", to: "Nov 2025" },
          { company: "Own products", from: "2021" },
        ],
        stats: [{ name: "Backend Engineer", value: 75 }],
        abilities: ["Node.js and NestJS", "PostgreSQL", "Laravel", "Real time"],
      },
      {
        characterClass: "Game Engineer",
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
  skillAreas: [
    {
      label: "Payments & Fintech",
      items: [
        "Stripe, including Connect payouts",
        "PayPal",
        "Subscriptions",
        "Payment provider abstraction and routing",
        "Double entry ledgers",
        "Idempotency",
        "Signed and verified webhooks",
        "Reconciliation",
        "Multi currency and FX",
        "Tax",
      ],
    },
    {
      label: "Auth & Security",
      items: [
        "OAuth 2",
        "Running an OIDC provider",
        "JWT",
        "Two factor (TOTP)",
        "Role based access control",
        "CSP and security headers",
        "Security audits and hardening",
        "Secrets handling",
      ],
    },
    {
      label: "Compliance & Web Standards",
      items: [
        "PCI scope (SAQ-A)",
        "KYC and AML",
        "GDPR",
        "PSD2",
        "DSA ad transparency",
        "Cookie consent",
        "SEO",
        "Accessibility and WCAG",
        "Internationalisation across 32 locales",
        "PWA and service workers",
      ],
    },
    {
      label: "Observability",
      items: [
        "Structured logging with Pino",
        "StatsD metrics",
        "Session replay",
        "Lighthouse and Lighthouse CI",
      ],
    },
    {
      label: "CI/CD & Release",
      items: [
        "GitHub Actions",
        "GitLab CI",
        "Git hooks with Husky",
        "Changesets",
        "Chromatic",
        "Docker Compose",
        "Supply chain scanning in CI",
      ],
    },
    {
      label: "Backend & Data",
      items: [
        "NestJS",
        "Express",
        "AdonisJS",
        "PostgreSQL",
        "Redis",
        "Supabase",
        "gRPC",
        "OpenAPI",
        "MariaDB and T-SQL",
      ],
    },
    {
      label: "AI & Machine Learning",
      items: [
        "TensorFlow",
        "Recommendation, ads and feed ranking models",
        "LLM APIs (GPT, Claude, Gemini)",
        "MCP, custom and published servers",
        "Agent skills, subagents and slash commands",
      ],
    },
  ],
  projectMap: {
    kinds: { game: "Games", web3: "Web3 & trading", product: "Products", community: "Communities & media", archive: "Archive" },
    statuses: { live: "Live", ongoing: "Ongoing", archived: "Archived", openSource: "Open source", private: "Private" },
    labels: {
      filter: "Show regions",
      all: "All",
      questLog: "Quest log",
      loot: "Loot",
      visit: "Visit",
      code: "View the code",
      previous: "Previous region",
      next: "Next region",
      close: "Close map",
      period: "{from} to {to}",
      present: "now",
      regions: "Regions",
      hint: "Pick a region to open its map. The line is the route I took, oldest first.",
    },
  },
  projects: [
    {
      icon: faCastle,
      kind: "game",
      status: "ongoing",
      image: "/images/chapter5-cover.webp",
      title: "Gods of Zushin",
      category: "MMORPG",
      intro: `My own MMORPG, started during my studies and still patched today: a custom engine, its own client and server, payments,
      and a community grown with paid campaigns.`,
      responsibilities: [
        "Architected the custom game engine and the client and server infrastructure for low latency multiplayer",
        "Wrote custom cryptography and compression for client and server traffic, with anti tamper account and inventory systems",
        "Added Stripe and PayPal for in game purchases and subscriptions, and a branded merchandise store",
        "Grew the community with campaigns on Facebook, YouTube, Twitch, Reddit and Instagram",
        "Built moderation tools, analytics dashboards and live patching",
        "Led moderators, event coordinators, testers and developers as CEO and CTO",
      ],
      techStack: ["C/C++", "Lua", "Python", "VueJS", "PHP Laravel", "C#", "Electron (Old Launcher)", "Cloudflare", "DigitalOcean", "AWS", "Shopify"],
      link: "https://goz.fun",
      from: "Apr 2015",
    },
    {
      icon: faChessRook,
      kind: "game",
      status: "archived",
      image: "/images/chapter3.webp",
      title: "GOZ Chapter 3",
      category: "Launch campaign",
      intro: "A conversion focused landing page that built interest and collected sign ups before the third chapter launched.",
      responsibilities: [
        "Designed and built the pre release landing page",
        "Ran the paid social campaigns that pointed at it",
        "Tracked sign ups and conversion in analytics",
      ],
      techStack: ["ReactJS", "Static Site"],
      link: "https://chapter3.goz.fun",
      from: "Apr 2018",
      to: "Apr 2018",
    },
    {
      icon: faTowerObservation,
      kind: "game",
      status: "archived",
      image: "/images/chapter4.webp",
      title: "GOZ Chapter 4",
      category: "Launch campaign",
      intro: "The landing page and campaign for the fourth chapter, built on what the third one taught about conversion.",
      responsibilities: [
        "Designed and built the pre release landing page",
        "Ran the paid social campaigns that pointed at it",
        "Tracked sign ups and conversion in analytics",
      ],
      techStack: ["ReactJS", "Static Site"],
      link: "https://chapter4.goz.fun",
      from: "Apr 2019",
      to: "Apr 2019",
    },
    {
      icon: faUsers,
      kind: "community",
      status: "archived",
      image: "/images/socialnetwork-amw.webp",
      title: "AMW - Social Network & Game",
      category: "Social network",
      intro: `A social network for anime, manga, cosplay and gaming fans, started when I began studying at MCAST and rebuilt from
      scratch in 2015, where taking part levelled up your own RPG character.`,
      responsibilities: [
        "Profiles, forums, chat rooms and publishing for artwork, fan fiction and cosplay",
        "A points economy that levelled up customisable RPG characters",
        "An auction house for virtual items and a self serve ads system",
        "Custom engines in C++ and Lua, with custom cryptography and compression",
        "Grew and ran the community and its moderators as CEO and CTO",
      ],
      techStack: ["PHP", "My Own Frameworks (PHP, JS)", "JS (JQuery, Backbone)", "Python", "WebGL & Canvas", "HTML", "CSS", "Cloudflare",
        "DigitalOcean", "AWS"],
      link: "https://drive.google.com/drive/folders/1jN-Xhfiro3UJppRLVehG8UIytjFJVVtl?usp=share_link",
      from: "Sep 2010",
      to: "Apr 2019",
    },
    {
      icon: faPlaneDeparture,
      kind: "community",
      status: "live",
      image: "/images/tastetravellers-cover.webp",
      title: "TasteTravellers",
      category: "Travel media",
      intro: "A travel media brand across Facebook, Instagram and YouTube, with its own store.",
      responsibilities: [
        "Content, photography and visual storytelling",
        "Community growth across the page, the group and the channels",
        "The store and its products",
        "Campaigns for partner travel companies, on a budget",
      ],
      techStack: ["Shopify"],
      link: "https://www.facebook.com/tastetravellersmt",
      from: "Feb 2018",
    },
    {
      icon: faDice,
      kind: "game",
      status: "openSource",
      title: "Bet Table",
      category: "Live casino proof of concept",
      intro: "A canvas bet table proof of concept from my live casino years, presented to the engineering team and the CTO.",
      responsibilities: [
        "An interactive bet table drawn on canvas",
        "Presented to the engineering team and the CTO to shape future product planning",
      ],
      techStack: ["JavaScript", "HTML5 Canvas", "PixiJS"],
      repo: "https://github.com/red-game-dev/Bet-Table",
      from: "Mar 2018",
      to: "Nov 2018",
    },
    {
      icon: faDungeon,
      kind: "game",
      status: "openSource",
      title: "Text Based Dungeon RPG",
      category: "Game",
      intro: "A small dungeon RPG played entirely in text, written in C++.",
      responsibilities: [
        "A dungeon crawler played in the terminal",
        "Plain C++ with a Makefile build",
      ],
      techStack: ["C/C++"],
      repo: "https://github.com/red-game-dev/TextBasedDungeonRPG",
      from: "Sep 2020",
      to: "Sep 2020",
    },
    {
      icon: faGamepadModern,
      kind: "game",
      status: "private",
      title: "Engine Prototypes",
      category: "Unity and Unreal Engine",
      intro: "Personal game prototypes in Unity and Unreal Engine, built alongside my roles since 2019.",
      responsibilities: [
        "Prototypes and experiments in Unity and Unreal Engine",
        "Picked up again whenever an idea needs a real engine",
      ],
      techStack: ["Unity", "Unreal Engine"],
      from: "Nov 2019",
    },
    {
      icon: faCubes,
      kind: "web3",
      status: "openSource",
      title: "Arc Chain",
      category: "Blockchain experiment",
      intro: "An early public experiment with a Substrate NFT pallet, in Rust, from January 2022.",
      responsibilities: [
        "The Substrate node template with one NFT pallet added",
        "Development chain setup with Nix",
      ],
      techStack: ["Rust (Substrate)", "Nix"],
      repo: "https://github.com/red-game-dev/Arc-Chain",
      from: "Jan 2022",
      to: "Jan 2022",
    },
    {
      icon: faStore,
      kind: "product",
      status: "private",
      title: "B2B Marketplace",
      category: "E-commerce platform",
      intro: "A business to business marketplace with multiple vendors: catalogue, cart and checkout.",
      responsibilities: [
        "A multi vendor catalogue",
        "Cart and checkout",
        "A Next.js front end on a NestJS API",
      ],
      techStack: ["Next.js", "NestJS", "TypeScript"],
      from: "Feb 2025",
      to: "May 2025",
    },
    {
      icon: faChartCandlestick,
      kind: "web3",
      status: "private",
      title: "Grid Strategy",
      category: "Trading tools",
      intro: "Tooling for grid trading strategies.",
      responsibilities: [
        "Grid strategy logic for automated trading",
      ],
      techStack: ["TypeScript"],
      from: "May 2025",
      to: "Jun 2025",
    },
    {
      icon: faBooks,
      kind: "product",
      status: "openSource",
      title: "The Game Library",
      category: "Gaming platform showcase",
      intro: "A crypto gaming platform showcase built around UX and accessibility: search, filter and browse over 2,000 mock games.",
      responsibilities: [
        "A custom design system with four themes",
        "WCAG AAA contrast and full keyboard navigation",
        "Session timeout and cookie consent components for EU compliance",
        "Over 36 documented Storybook stories",
      ],
      techStack: ["Next.js", "React", "TypeScript", "Design Systems", "Storybook"],
      repo: "https://github.com/red-game-dev/the-game-library",
      from: "Aug 2025",
      to: "Aug 2025",
    },
    {
      icon: faTruckFast,
      kind: "product",
      status: "openSource",
      title: "Freight Delay Notifications",
      category: "Logistics service",
      intro: "A service that watches freight routes for traffic delays and tells customers before they ask, with AI written messages.",
      responsibilities: [
        "Temporal workflows that fetch traffic, check a delay threshold, write the message with an LLM and send it",
        "An adapter for every provider, with fallbacks: Google Maps then Mapbox, SendGrid email and Twilio SMS",
        "A Next.js dashboard with a live traffic map and workflow monitoring",
        "Workers on Railway with versioned, zero downtime deployments, and the app on Vercel",
        "Unit, integration and Storybook component tests",
      ],
      techStack: ["Next.js", "TypeScript", "Temporal", "PostgreSQL", "Supabase", "React Query", "OpenAI", "SendGrid", "Twilio", "Railway",
        "Vercel", "Storybook", "Automated Testing"],
      link: "https://the-freight-delay-notification.vercel.app",
      repo: "https://github.com/red-game-dev/the-freight-delay-notification",
      from: "Sep 2025",
      to: "Oct 2025",
    },
    {
      icon: faCompass,
      kind: "product",
      status: "live",
      image: "/images/portfolio.webp",
      title: "This Portfolio",
      category: "Interactive portfolio",
      intro: `This site: a journey from the Matrix to an MMO, built on its own framework free packages for effects, games, a terminal
      and career insights.`,
      responsibilities: [
        "Canvas engines for the backdrop, the binary rain, the photo reveal and Bug Raid on one shared frame loop",
        "Packages with domain, service, mapper and validator layers, kept free of React so they can be extracted",
        "A terminal, a skill forge computed from real dates, and boss fights, duels and a HUD over the content",
      ],
      techStack: ["NextJS", "React", "TypeScript", "Styled Components", "Tailwind", "Canvas"],
      link: "https://redgame.dev",
      repo: "https://github.com/red-game-dev/Portfolio",
      from: "Nov 2022",
    },
    {
      icon: faBoxArchive,
      kind: "archive",
      status: "ongoing",
      image: "/images/otherprojects.webp",
      title: "The Archive",
      countsForSkills: false,
      category: "Older projects",
      intro: `Everything else, from my first projects years before college to the experiments I still add today: open source
      utilities, game experiments and prototypes across many industries.`,
      responsibilities: [
        "Projects from every phase, starting about six years before college",
        "Still growing: new experiments land here alongside my roles",
      ],
      techStack: ["ReactJS", "Unity", "Angular", "C/C++", "PHP", "NodeJS", "Flutter", "Python"],
      link: "https://drive.google.com/drive/folders/0B1gPxpJpFGW5SGhXeS1pTzA4Tmc?resourcekey=0-amvzxbZpCBhf7bV-GVUmTg&usp=share_link",
      from: "2003",
    },
  ],
  caseStudyFilters: {
    label: "Show case studies for",
    allLabel: "Everything",
  },
  bossLabels: { boss: "Boss", hp: "HP", defeated: "Defeated", loot: "Loot" },
  hud: { pick: "Pick a character", level: "Level", xp: "XP", bosses: "Bosses defeated" },
  finale: {
    kicker: "Run complete",
    title: "Wow! You made it to the end.",
    screen: ["THANKS FOR", "PLAYING"],
    screenLabel: "Thanks for playing",
    summaryTitle: "Your run",
    stats: {
      zones: "Zones crossed",
      bosses: "Bosses defeated",
      duels: "Duels won",
      character: "Character",
      raid: "Bug Raid best",
      time: "Time on this run",
    },
    none: "None picked",
    notPlayed: "Not played",
    rankLabel: "Rank",
    objectives: "{done} of {total} objectives",
    ranks: [
      { min: 0, name: "Explorer" },
      { min: 2, name: "Adventurer" },
      { min: 4, name: "Champion" },
      { min: 5, name: "Legend" },
    ],
    finalQuest: "Final quest: start a conversation",
    contactNote: "How did you find the journey? The best time to reach me is after 4:30 PM CET on business days.",
    emailLabel: "Email me",
    emailSubject: "I finished your portfolio run",
    emailBody: "Rank {rank}. Bosses {bosses}, duels {duels}.",
    linkedInLabel: "LinkedIn",
    cvLabel: "Download my CV",
    restartLabel: "New game+",
  },
  arena: {
    boardLabel: "Bug Raid game board",
    hint: "Click or tap a bug to squash it, or use the arrow keys to aim and Space to squash. Regressions take two hits and flaky bugs jump.",
    ready: "Bugs are heading for production.",
    start: "Start the raid",
    again: "Play again",
    resume: "Resume",
    paused: "Paused while off screen",
    over: "Production is down",
    newBest: "New best",
    score: "Score",
    lives: "Lives",
    wave: "Wave",
    best: "Best",
    production: "production",
  },
  duels: {
    agentLabel: "Agent",
    humanLabel: "Me",
    resultLabel: "Shipped",
    verdict: "Overruled",
    scoreLabel: "Rounds won",
    scoreOf: "of",
    roundLabel: "Round",
    versusLabel: "VS",
    koLabel: "K.O.",
    rounds: [
      {
        agent: "A payer can change their country to unlock instant statutory refunds.",
        human: "The country locks once set. The real gap is that it is never checked against the payment.",
        result: "A jurisdiction snapshot on every charge.",
      },
      {
        agent: "These two auth secrets match no code. Delete them from both hosting projects.",
        human: "Demo and production still run the old provider. Deleting them takes production down.",
        result: 'Live secrets kept, and "no longer used" now means on every deployed branch.',
      },
      {
        agent: "Nine domain services can use the shared base class directly.",
        human: "Each domain gets a subclass of its own, and the generator stops emitting the shortcut.",
        result: "Nine services wrapped and the generator template fixed.",
      },
      {
        agent: "Post the review with the page's finding numbers.",
        human: "Comment on the exact lines instead.",
        result: "43 line comments, and three fix samples calling helpers that do not exist caught before posting.",
      },
    ],
  },
  web3: {
    statement: "From fan tokens at scale, to a chain of my own, to lending, trading and wallet interfaces.",
    validatorsLabel: "Where it shipped",
    validators: ["Chiliz", "CoinOn", "reNFT", "HyperPlay"],
    blockLabel: "Block",
    previousLabel: "prev",
    pendingLabel: "Pending",
    confirmedLabel: "Confirmed",
    capabilities: [
      {
        name: "Tokenisation and fan tokens",
        detail: "Fan tokens and fan engagement for around 2M users, with on chain integrations in the mobile app.",
        places: ["Chiliz"],
      },
      {
        name: "A chain of my own, with bridges",
        detail: "A chain in Rust on Substrate after Polkadot parachains, with bridges and indexers across Solana, Polkadot and EVM chains.",
        places: ["CoinOn"],
      },
      {
        name: "Stablecoins",
        detail: "Stablecoin work as CTO, for clients, and on my own platform.",
        places: ["CoinOn", "Client work", "Own platform"],
      },
      {
        name: "DeFi and trading",
        detail: `DEX and AMM, lending and staking, and a front end for configuring and deploying grid trading strategies on an on chain
        order book, with MetaMask and WalletConnect.`,
        places: [],
      },
      {
        name: "NFT lending and marketplaces",
        detail: "The NFT lending protocol and its marketplace V2, built with Wagmi and Ethers.",
        places: ["reNFT"],
      },
      {
        name: "Web3 game distribution",
        detail: "A Web3 game launcher with wallet connections across EVM chains.",
        places: ["HyperPlay"],
      },
      {
        name: "Wallets and account flows",
        detail: "A wallet platform on Polygon: wallet sign in, NFT and token balances, ERC-721 and ERC-1155 transfers by username.",
        places: ["Own project"],
      },
      {
        name: "Indexing and chain data",
        detail: "Chain data through The Graph subgraphs and Alchemy.",
        places: ["reNFT", "CoinOn", "HyperPlay"],
      },
      {
        name: "Contract security review",
        detail: "Solidity reviews and smart contract security audits, looking for attack vectors before they ship.",
        places: ["HyperPlay", "CoinOn"],
      },
      {
        name: "Token economy design",
        detail: "An off chain credit and coin economy: an append only ledger, a bonding curve, coin launch and trading.",
        places: ["Own platform"],
      },
    ],
  },
  igaming: {
    statement: "Live casino from the inside: game UI and real time at a live casino provider, and regulated platforms for clients.",
    liveLabel: "Live",
    proofLabel: "Dealt at",
    proof: ["Authentic Gaming", "KPMG"],
    cards: [
      {
        name: "Live casino UI",
        detail: "Game UI for desktop and mobile live casino tables, and the mobile app.",
        places: ["Authentic Gaming"],
      },
      {
        name: "Real time",
        detail: "Node.js and WebSockets for live game data and streaming, with client side state kept in sync.",
        places: ["Authentic Gaming"],
      },
      {
        name: "Operator integration",
        detail: "Internal tools that automated onboarding and integration of new casino operators.",
        places: ["Authentic Gaming"],
      },
      {
        name: "Tables on canvas",
        detail: "A PixiJS bet table proof of concept, presented to the engineering team and the CTO.",
        places: ["Authentic Gaming"],
        link: { label: "View the code", url: "https://github.com/red-game-dev/Bet-Table" },
      },
      {
        name: "Canvas performance",
        detail: "Profiling tools that found the bottlenecks in canvas rendering.",
        places: ["Authentic Gaming"],
      },
      {
        name: "Regulated platforms",
        detail: "iGaming clients needing compliance, scale and real time performance, including regulated deposit and withdrawal flows under Malta licensing.",
        places: ["KPMG"],
      },
    ],
    quote: {
      text: "As a software engineer, Redeemer would be a true asset to that position and it comes with my heartfelt recommendation.",
      source: "Head of Frontend, Authentic Gaming",
    },
  },
  codeReview: {
    scope: "On my main GitHub account alone, counted on 5 October 2026. I have other accounts, so these are floors.",
    squaresLabel: "{count} squares, one per pull request",
    totals: [
      { value: 298, label: "pull requests merged", detail: "of 331 authored" },
      { value: 520, label: "pull requests reviewed" },
    ],
    highlights: [
      {
        name: "HyperPlay",
        detail: "An open source game launcher and its UI library",
        counts: [{ value: 240, label: "reviews" }, { value: 50, label: "authored" }],
        points: [],
      },
      {
        name: "fetchff",
        detail: "An open source HTTP client library my own platform depends on",
        counts: [{ value: 35, label: "reviews" }, { value: 1, label: "authored and merged" }],
        quote: "I review the library my own platform depends on instead of forking it.",
        points: [
          "Its security hardening release",
          "Retry with jitter, limited to idempotent methods",
          "Cache revalidation with ETags",
          "Request aborting",
          "React Native support",
        ],
      },
    ],
  },
  platformDiagrams: {
    adapters: {
      title: "Every vendor behind an adapter",
      core: "Domain core in plain TypeScript",
      contracts: "37 adapter contracts",
      seams: [
        { name: "Payments", detail: "Stripe gateway, tax and FX providers" },
        { name: "Storage & media", detail: "Cloudflare R2, Supabase, scanning" },
        { name: "Database", detail: "Drizzle, Supabase, SQL, IndexedDB" },
        { name: "Auth", detail: "OAuth, OIDC, passwordless" },
        { name: "Notifications", detail: "Email, SMS and push" },
        { name: "CMS", detail: "Strapi, Contentful, Sanity, Storyblok" },
        { name: "Ads", detail: "Own network, external slots" },
        { name: "Moderation", detail: "Four provider adapters" },
        { name: "Real time", detail: "SSE, WebSocket, Redis backplane" },
        { name: "Feature flags", detail: "API, database, file, memory, Redis" },
        { name: "Hosts", detail: "Deploy targets, env vars, source control" },
        { name: "Frameworks", detail: "NestJS and Next.js adapters" },
      ],
      caption: "Every vendor and host sits behind an adapter, so a provider can be added, run in parallel and switched by configuration.",
    },
    moneyFlow: {
      title: "How money moves",
      steps: [
        { name: "Checkout", detail: "A jurisdiction snapshot is written on every charge" },
        { name: "Gateway adapter", detail: "Provider agnostic, Stripe today" },
        { name: "Signed webhook", detail: "Verified before anything moves" },
        { name: "Idempotent handler", detail: "One effect per event, however often it arrives" },
        { name: "Double entry ledger", detail: "Every movement balanced" },
        { name: "Reconciliation", detail: "The ledger checked against the provider" },
        { name: "Payout", detail: "Holds above a threshold need a second admin's approval" },
      ],
      inputs: [
        { name: "Tax providers", detail: "Per region, behind one contract" },
        { name: "Exchange rates", detail: "Provider based FX for multi currency" },
      ],
      caption: "Money paths are tested through the real API, on synthetic data at real volume.",
    },
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
      quote: "As a software engineer, Redeemer would be a true asset to that position and it comes with my heartfelt recommendation.",
      role: "Head of Frontend",
      company: "Authentic Gaming",
      date: "January 2019",
    },
  ],
  caseStudies: [
    {
      area: "Architecture & cost",
      title: "A migration that pays for itself",
      summary: [
        "Built the business case and the architecture to cut an enterprise platform's yearly licence and running cost by about 80%, infrastructure included.",
      ],
      points: [
        "A target architecture with the old and new platforms side by side behind one adapter, switched per market by a feature flag",
        "A working proof of concept before commitment, so the case rests on running software instead of slides",
        "Licence, hosting and infrastructure counted for both the old and the new stack",
      ],
      tags: ["Business case", "Migration", "Adapters"],
      audiences: ["architecture"],
      loot: "A business case that rests on a working proof of concept",
    },
    {
      area: "Architecture",
      title: "No vendor lock-in, by design",
      summary: ["I design so a vendor can be replaced without rewriting the product."],
      points: [
        `At Conrad: one typed CMS adapter contract with Strapi, AEM and a backend for frontend provider behind it, chosen by a feature
        flag, so adding a provider does not change consumer code`,
        `On my own platform: 37 adapter contracts across payments, storage, auth, notifications, CMS, real time and infrastructure,
        so a provider can be added, run in parallel and switched by configuration`,
        `A written cut over procedure: add the provider, run both, switch, retire, with expand and contract for anything that holds
        state so no data is lost in the move`,
      ],
      tags: ["Adapters", "Feature flags", "Expand and contract"],
      audiences: ["architecture"],
      industries: ["ecommerce", "social"],
      loot: "Any vendor or host can be swapped by configuration",
    },
    {
      area: "Architecture",
      title: "Frameworks at the edges",
      summary: [
        `Frameworks change faster than business rules, so the rules do not depend on them. The same principle holds in two unrelated
        codebases.`,
      ],
      points: [
        "On my own platform, only 6 of about 1,600 domain, engine, service and package files import React, Next.js or NestJS",
        "Framework code lives in named places: NestJS and Next.js adapters, and separate backend, frontend, headless and PWA entry points",
        "React hooks bind to framework free services and carry as little logic as possible",
        "At Conrad the CMS adapter is 69 TypeScript files with zero Vue or Nuxt imports",
      ],
      tags: ["Plain TypeScript core", "Adapters", "A binding per runtime"],
      audiences: ["architecture"],
      industries: ["ecommerce", "social"],
      loot: "Business rules that outlive the framework",
    },
    {
      area: "Architecture",
      title: "Designed for enterprise volume",
      summary: [
        `A query that is fine against 200 rows is an outage against 20 million, so every change is written for volume, not for the
        row count on staging.`,
      ],
      points: [
        "Keyset pagination against declared indexes, filtering in SQL, bounded scans, and one query for N ids instead of N queries",
        "Fan out is batched and bounded, and append only tables have a retention purge that is actually wired",
        `Cache discipline: what lives in Redis and what stays in Postgres, expiry and stampede protection, behaviour when Redis is
        down, and never caching an authorisation decision`,
        "Twenty engines on one registry base, so a new provider, bid strategy, moderation source or flag backend is a registration, not a rewrite",
        "Offline first on the client: an outbox for queued writes, declared read caches and IndexedDB behind the database adapter",
      ],
      tags: ["Keyset pagination", "Redis", "Offline first"],
      audiences: ["architecture", "payments"],
      industries: ["fintech", "social"],
      loot: "Write for twenty million rows, not two hundred",
    },
    {
      area: "Architecture",
      title: "Infrastructure that can be switched",
      summary: ["Hosts are vendors too, so they sit behind adapters like everything else."],
      points: [
        "An infrastructure package with adapters for deploy targets, environment variables and source control",
        `One CLI where supporting a new host means adding an adapter, designed through 84 recorded decisions covering provisioning,
        moving between hosts with a cost comparison, build runners and secrets`,
        "All 14 hosting service environments moved off config files onto recorded settings",
        "The same cut over procedure as any vendor: add the host, run both, switch, retire",
      ],
      tags: ["Adapters", "CLI", "Decision records"],
      audiences: ["architecture"],
      loot: "Hosts are vendors too",
    },
    {
      area: "Architecture",
      title: "Lean dependencies, written in house where it counts",
      summary: ["Every library is a long term cost and a supply chain risk, so the platform keeps them few."],
      points: [
        "Most domain packages run on a handful of third party libraries: payments on 8, auth on 5, CMS on 2, and infrastructure and the SDK on none",
        `The cross cutting machinery is written in house: event bus, job scheduler over Postgres, idempotency at three layers, the
        registry engine, real time transports, offline outbox, feature flags and the infrastructure CLI, with no message broker or
        queue library`,
        "What does get in passes a blocklist that fails the install, a supply chain scan in CI and a line by line lockfile review",
      ],
      tags: ["Supply chain", "Dependencies", "In house engines"],
      audiences: ["architecture"],
      loot: "Every dependency earns its place",
    },
    {
      area: "Payments & compliance",
      title: "A refund rule the schema did not show",
      summary: [
        `In a refunds review the agent flagged that a payer could change their country to unlock instant statutory refunds. I knew
        the country locks once set, so the finding was re-scoped to the real gap: the country is self declared at onboarding and
        never checked against the payment.`,
      ],
      points: [
        "The fix: a jurisdiction snapshot written on every charge at checkout",
        "The rule kept since: check a cheat path against the write path's guards, not the schema",
      ],
      tags: ["Refunds", "Jurisdiction", "Code review"],
      audiences: ["payments", "ai"],
      industries: ["fintech"],
      loot: "Check a cheat path against the write path's guards",
    },
    {
      area: "Payments & compliance",
      title: "Jurisdiction agnostic money paths",
      summary: ["Tax, refund and compliance rules resolve per jurisdiction instead of being hardcoded for one market."],
      points: [
        "Tax runs through providers behind one contract, from Stripe Tax to manual and zero rate",
        "Exchange rates come from providers too, so multi currency is a configuration, not a rewrite",
        "Each charge records the jurisdiction it was taken under, so later rules apply to the facts at the time",
        "Compliance per jurisdiction is one of the gates every feature passes in my engineering discipline skill",
      ],
      tags: ["Tax", "Multi currency and FX", "KYC and AML"],
      audiences: ["payments"],
      industries: ["fintech"],
      loot: "Every charge remembers the rules it was taken under",
    },
    {
      area: "Payments",
      title: "Ledgers and money paths tested the way users hit them",
      summary: ["Money movement is the one part of a product that cannot be wrong, so it is tested through the real surface."],
      points: [
        "Double entry ledgers with idempotent writes and reconciliation",
        "Every test action goes through the real API or UI; the database only verifies the effect",
        "600+ staging scripts run the money paths on synthetic data at real volumes, with every money moving step behind an explicit flag",
        "A suspected bug is confirmed through the endpoint, never through the schema",
      ],
      tags: ["Double entry", "Idempotency", "Reconciliation"],
      audiences: ["payments"],
      industries: ["fintech"],
      loot: "Confirm money bugs through the endpoint",
    },
    {
      area: "Payments & security",
      title: "A budget anyone could drain",
      summary: [
        `Ad impressions were billed on an idempotency key the client supplied, with nothing binding it to the server, so any signed
        in user could drain a campaign's budget.`,
      ],
      points: [
        "The fix: the server mints a signed, single use token that lives about 90 seconds, and billing accepts only that",
        "The first fix silently broke the seven day conversion window, so a second, longer lived token restored it",
        "Billing was reordered so the only step that can refuse a charge runs first",
      ],
      tags: ["Idempotency", "Signed tokens", "Ads billing"],
      audiences: ["payments"],
      industries: ["fintech", "social"],
      loot: "The step that can refuse runs first",
    },
    {
      area: "Identity & security",
      title: "A consent flow no API test could see",
      summary: ["I had an opt in end to end test given a real fixture instead of leaving it skipped."],
      points: [
        `On the deployed build it showed three breaks in a "sign in with" consent flow that API tests could not see, because they
        call the provider with a token instead of a browser`,
        `Two more edge cases were fixed at once instead of deferred: a fresh sign in request that looped, and a guest identity that
        could reach consent, including through a direct API call`,
        "The API now refuses to start without the secret that gives each client app its own user identifier, so two apps cannot link the same person",
      ],
      tags: ["OIDC", "End to end tests", "Playwright"],
      audiences: ["architecture", "ai"],
      loot: "Test identity flows in a real browser",
    },
    {
      area: "Agent workflow",
      title: "Decisions that survive long agent sessions",
      summary: ["Long agent sessions lose context. Decisions should not."],
      points: [
        "Every open choice comes to me as a multiple choice question with a recommendation and trade offs, and my answer is recorded as a numbered decision",
        "Registers are private published pages, regenerated from data files at every landing, and agents search them before asking me anything",
        "One register holds 84 infrastructure decisions; one branch's register passed 800",
        "Review pages work the same way: findings against the real code, numbered fix steps, and a definition of done the re-review checks",
      ],
      tags: ["Decision records", "Context engineering", "Code review"],
      audiences: ["ai"],
      loot: "Every open choice becomes a numbered decision",
    },
  ],
  aiUsage: {
    screen: {
      message: ["33,000+ prompts", "on one machine", "Feb to Oct 2026"],
      label: "At least 33,000 prompts to my main coding agent on one machine alone, February to October 2026.",
    },
    mix: {
      title: "AI is in the loop on all of it",
      description: [
        "Where 33,000+ prompts went, on one machine, February to October 2026.",
      ],
      tasks: [
        { name: "Feature implementation and coding", count: 7916 },
        { name: "Code review, PRs and git", count: 3428 },
        { name: "Debugging and fixing", count: 3085 },
        { name: "Docs, stakeholder updates and decks", count: 2847 },
        { name: "Deploys, infrastructure and migrations", count: 2248 },
        { name: "Data, analytics and research", count: 1791 },
        { name: "Testing and verification", count: 1486 },
        { name: "Architecture and planning", count: 1368 },
        { name: "Security and compliance", count: 1087 },
      ],
      notes: [
        `Counts come from sorting prompt text by keyword, so they are approximate floors. A prompt can count in more than one row,
        so the rows do not add up to the total.`,
        `About half of all prompts are short steering turns like "continue" or "recheck", which sit outside these rows. It is one
        machine only, and ChatGPT carries much of my architecture research and stakeholder writing, which is not counted here.`,
        `The mix moves with the work: architecture and consulting lean towards docs and stakeholder updates, and a verification
        heavy branch leans towards testing on the deployed build.`,
      ],
    },
    budget: {
      title: "Tokens as a budget",
      description: [
        `I treat tokens as a budget. About 96% of the input in my agent sessions is served from cache, small models do the searching
        while large models make the decisions, and agent runs are capped and resumed instead of relaunched.`,
      ],
      figures: [
        { value: "96%", label: "of input tokens served from the prompt cache" },
        { value: "53M+", label: "output tokens" },
        { value: "8", label: "models across three tiers" },
      ],
      tiersTitle: "Output by model tier, roughly: the right model per task, mostly the largest",
      shareLabel: "{name}, about {share}%",
      tiers: [
        { name: "Largest tier", share: 85, detail: "Design, review and long implementation work" },
        { name: "Middle tier", share: 8 },
        { name: "Newer top model", share: 5 },
        { name: "Smallest tier", share: 2, detail: "Search, gathering and audits" },
      ],
      practicesTitle: "How the budget holds",
      practices: [
        "Large models for design and review judgement, small models at low effort for search, gathering and audits",
        "Multi agent runs capped at about five agents and run one at a time, after one 59 agent run used a whole session quota",
        "A stopped agent is resumed, not relaunched, so it does not read everything again",
        "No builds or type checks after every edit and none inside subagents: verification runs once, before a push",
        "Trimmed transcripts, digests and search, so old context costs nothing until it is needed",
        "Skills and commands, so the agent does not spend tokens rediscovering the codebase every session",
      ],
      notes: [
        `Measured on one machine, February to 1 August 2026. Cached input is billed at a fraction of fresh input, which makes the
        cache the biggest cost lever in long agent sessions.`,
        "At Conrad I work on AI enablement under budget constraints across teams and departments.",
      ],
    },
    areas: {
      title: "Subjects I use it on",
      description: [
        "The same prompts sorted by subject instead of by kind of work. Subjects overlap, so these do not add up to anything.",
      ],
      groups: [
        {
          label: "Over a thousand prompts each",
          items: [
            "Database and migrations",
            "Testing, unit to end to end",
            "Ads and feed ranking",
            "UI and design systems",
            "CMS and content modelling",
            "Stakeholder docs and decks",
            "Authentication and identity",
            "CI/CD and hosting",
          ],
        },
        {
          label: "Hundreds of prompts each",
          items: [
            "Data analysis and audits",
            "Architecture and design docs",
            "KYC, AML, tax and legal compliance",
            "Ledgers, wallets and treasury",
            "Payments and subscriptions",
            "Performance and optimisation",
            "Analytics and tracking",
            "Caching and CDN",
            "Blockchain",
            "Cost and vendor evaluation",
            "Translations across locales",
            "Observability",
            "Mobile and offline",
            "Security hardening",
            "Real time streams",
            "Developer platform and SDK design",
            "SEO",
          ],
        },
      ],
      notes: [
        `Performance profiling and optimisation, especially for canvas and other compute heavy apps, has no row in the task split
        above: it is usually phrased as a bug, a test or a refactor, so a keyword split cannot isolate it.`,
        "Canvas and game work barely shows here because most of it happened on my other PC, which is not counted.",
      ],
    },
    agents: {
      title: "How I work with agents",
      description: [
        "Every change goes through the same four stages, and each stage has rules the agent cannot skip.",
      ],
      stages: [
        {
          name: "Context",
          icon: faFileLines,
          principles: [
            {
              title: "The contract matters more than the prompt",
              description: `Each repo has a context file with hard rules, reference docs the agent reads first,
              a memory of one fact per file and a handoff note per session.`,
            },
            {
              title: "Confidentiality first",
              description: `I check a tool's confidentiality model before it touches company code. Every tool an agent gets is scoped
              to read or write, secrets are checked by name only, and no sensitive data goes to the model.`,
            },
            {
              title: "Context that outlives the session",
              description: `I wrote tooling that trims multi gigabyte transcripts without deleting them, builds a digest and topic index
              per archived session, searches across all of them, and serves that history through a read only MCP server with its
              own evals.`,
            },
          ],
        },
        {
          name: "Agent",
          icon: faRobot,
          principles: [
            {
              title: "Production is a deliberate step",
              description: `Staging and production are separate connections I choose explicitly. Subagents never write to production,
              and migrations are applied only on my go and proven afterwards.`,
            },
            {
              title: "Synthetic data at real volume",
              description: "Money and customer paths run on synthetic data at production volumes, so scale problems show up before release.",
            },
            {
              title: "Agents with limits",
              description: `Subagents research and edit but never build or commit; the main session builds once. Parallel runs are capped
              at about five agents, after one large run used a whole session quota.`,
            },
          ],
        },
        {
          name: "Checks",
          icon: faShieldCheck,
          principles: [
            {
              title: "Dependencies are screened",
              description: "Every install passes a supply chain blocklist, and a match fails the install.",
            },
            {
              title: "Proof before acceptance",
              description: `Work is accepted on evidence from the deployed build, such as Playwright runs and API responses, with test
              data created through the real API instead of seeded.`,
            },
          ],
        },
        {
          name: "Human review",
          icon: faUserCheck,
          principles: [
            {
              title: "A person reviews every change",
              description: "Nothing merges without a human review, and features nobody asked for come back out.",
            },
            {
              title: "Decisions are written down",
              description: `Every open choice comes to me as a question with a recommendation and trade offs, and my answer is recorded
              as a numbered decision. One branch holds over 800 of them.`,
            },
          ],
        },
      ],
      examples: {
        title: "Caught in review",
        items: [
          {
            title: "A pattern violation in the generator",
            description: `Nine domain services used a shared base class directly instead of a subclass of their own. Each was wrapped in
            its own class, and the code generator template that kept emitting the violation was fixed too.`,
          },
          {
            title: "Live secrets marked as unused",
            description: `Repo instructions called two secrets dead and said to delete them. They were still live on the demo and
            production deploys. "No longer used" now means on every deployed branch.`,
          },
          {
            title: "One listener, registered twice",
            description: `A review page showed that a new pull request had absorbed an older open one. Merging both would have
            registered the same listener twice.`,
          },
        ],
      },
      footer: `The same setup serves engineers with reviews, migrations, tests and deploys,
      and it serves product and analysis stakeholders too.`,
    },
    timeline: {
      title: "How I got here",
      milestones: [
        {
          period: "Up to 2019",
          title: "Machine learning before LLMs",
          description: `From personal TensorFlow experiments to shipped models for the clients KPMG placed me with as a consultant:
          suggestions and recommendations, ads, and social media feed ranking.`,
        },
        {
          period: "Before ChatGPT",
          title: "Tabnine",
          description: "Code completion with Tabnine gave me an early, realistic sense of what AI assistance could and could not do.",
        },
        {
          period: "Early 2023",
          title: "ChatGPT at reNFT",
          description: `I started using ChatGPT seriously for frontend and backend work, from authentication and API design to serverless
          architecture. I wrote a small CLI that built a short context file for a project (architecture, directory layout, key files),
          choosing what went into it with company safety and privacy in mind. The rest was manual: paste the context, adjust,
          create the files by hand.`,
        },
        {
          period: "Later in 2023",
          title: "Cursor, Claude and Gemini",
          description: "I picked each one up as it appeared and have kept current since.",
        },
        {
          period: "Oct 2023 to Nov 2025",
          title: "HyperPlay",
          description: "AI across frontend, backend, Electron and mobile work.",
        },
        {
          period: "Feb 2025",
          title: "Project instruction sets",
          description: `I started writing detailed instructions for AI assisted development: architecture constraints, security
          requirements and conventions, so the model works inside the project instead of guessing at it.`,
        },
        {
          period: "Nov 2025 to present",
          title: "Conrad Electronic Group",
          description: `I drive AI enablement for the CMS migration, working with 90+ people across engineering, QA, product, content,
          SRE and up to CTO level. That covers Gemini Enterprise and Gemini CLI as the company tooling, a presentation to the team
          on how MCP and skills help with Gemini and Claude models, an evaluation of Strapi's MCP server and of the AEM MCP options
          (I recommended against the AEM ones), a supply chain check across the storefront repositories after the axios compromise,
          written up as an advisory for the team, and a human review before anything AI generated reaches Confluence or a pull
          request.`,
          isCurrent: true,
        },
        {
          period: "2026",
          title: "My own platform",
          description: `Claude Code is my main engineering tool on a large TypeScript monorepo for payments, ledgers, an ads engine and
          real time feeds. Around it sit skills adapted from an open source collection and extended with my own, such as an
          engineering discipline skill organised as phases and gates, a design review subagent, and private published pages that keep
          the working record: decision registers, review pages teammates use as their fix list, and live trackers.`,
          isCurrent: true,
        },
        {
          period: "Ongoing",
          title: "Gods of Zushin, my MMORPG",
          description: `I use AI to build features, write up in game events and debug support cases. For support I copy only the
          non sensitive data for that case into a sandbox of my own and let the agent work there, never on live data. Before off
          the shelf MCP servers existed I built my own for logging, audit and SQL access; now I use and configure the published
          ones. In September 2026 I also ran an owner authorised, read only security assessment of its public surface and wrote
          the hardening runbook.`,
          isCurrent: true,
        },
      ],
    },
  },
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
