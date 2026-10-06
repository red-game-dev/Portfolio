import {
  faTableColumns,
  faRocketLaunch,
  faMobileScreen,
  faGlobe,
  faGem,
  faFutbol,
  faCube,
  faCoins,
  faBoxesStacked,
  faArrowsRotate,
  faArrowRightArrowLeft,
  faBooks,
  faBoxArchive,
  faCastle,
  faChartCandlestick,
  faChessRook,
  faCloudArrowUp,
  faCompass,
  faDice,
  faDungeon,
  faPlaneDeparture,
  faPaw,
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

import { blueprintLabels } from "@/data/blueprints/labels";
import { githubActivity } from "@/data/githubActivity";
import { lensContent } from "@/data/lens";
import { PortfolioAiUsage } from "@/types/ai-usage";
import { BlueprintLabels } from "@/types/blueprints";
import { CaseStudy, CaseStudyFilters, ExpertiseContent } from "@/types/case-studies";
import { CodeReviewContent } from "@/types/code-review";
import { Detail } from "@/types/details";
import { IGamingContent, Web3Content } from "@/types/domains";
import { ForgeContent, TalentsContent } from "@/types/forge";
import { ArenaContent, BossLabels, Duels, FinaleContent, HudLabels, JourneyTrailContent } from "@/types/game";
import { Github } from "@/types/general";
import { Headline } from "@/types/headline";
import { HistoryLabels } from "@/types/history";
import { LensContent } from "@/types/lens";
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
    programming: Skill[];
    frontend: Skill[];
    backend: Skill[];
    mobile: Skill[];
    blockchain: Skill[];
    cloud: Skill[];
    cms: Skill[];
    tools: Skill[];
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
  journeyTrail: JourneyTrailContent;
  lens: LensContent;
  arena: ArenaContent;
  finale: FinaleContent;
  blueprintLabels: BlueprintLabels;
  expertise: ExpertiseContent;
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
      "Open to architect, engineering leadership, product, blockchain and AI engineering roles, full time or B2B.",
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
  terminal: {
    prompt: "visitor@redgame.dev:~$",
    welcome: [
      "Welcome to redgame.dev. Start with help: it lists every command, from contact to a few surprises.",
      "Or ask me to do something: red create app, red fix my broken vibe coded app, red migrate app, red enable ai in my company, red hire as cto.",
      "Press / or ` anywhere on the page to come back to this prompt.",
    ],
    suggestions: [
      "help", "contact", "red fix my broken vibe coded app", "red create app", "red enable ai in my company", "red hire as architect", "whoami", "ls",
    ],
    featured: "help",
    featuredLabel: "Start here",
    contact: {
      title: "Let's talk",
      subtitle: "Pick whatever suits you, I answer quickly.",
      heading: "Reach me",
      subject: "Hello from redgame.dev",
    },
    helpTitle: "Commands",
    unknownCommand: "command not found: {name}. Type help to see what I can show you.",
    inputLabel: "Terminal command",
    shortcutHint: "Press / or ` from anywhere",
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
          phrase: "fix my broken vibe coded app",
          aliases: ["fix my vibe coded app", "fix vibe coded app", "fix my vibecoded app", "vibe coded app", "rescue my vibe coded app", "fix my vibe code"],
          title: "Vibe code rescue",
          pitch: "An app an AI wrote fast, made into one that holds: real errors found, security holes closed, tests that keep it fixed.",
          scan: [
            "Reading what the agent actually wrote, not what it said it wrote",
            "Finding the secrets in the client and the open endpoints",
            "Replacing the copy pasted parts with one source of truth",
            "Adding the tests and the guardrails it never had",
          ],
          services: ["AI-Generated App Rescue & Hardening", "Architecture & Security Review", "Performance Engineering"],
          cases: ["A budget anyone could drain", "A consent flow no API test could see", "Five authorisation findings, fixed at the guard"],
          subject: "Fixing my vibe coded app",
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
      lenses: {
        recruiter: [
          "Every role with its dates, the outcome and the stack. Companies I founded run on their own branch, beside employment.",
        ],
        product: [
          "Each role read as a product: what it set out to do and what it achieved. The companies I founded run on their own branch.",
        ],
      },
    },
    services: {
      title: "What can I offer?",
      description: [
        "What I take on, grouped by area. Each card is work I have done for real, and each one has a direct line to me.",
      ],
      lenses: {
        recruiter: [
          "What I can be hired for, grouped by area. Each card is work I have done, with a direct line to me.",
        ],
        product: [
          "Product and growth first, then the engineering behind it. Each card is work I have done.",
        ],
      },
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
    programming: {
      title: "Programming Languages",
      description: [
        "The languages I write, from C/C++ game engines and PHP frameworks of my own to TypeScript across a whole platform.",
      ],
    },
    frontend: {
      title: "Frontend Ecosystem",
      description: [
        "Frameworks and libraries from plain JavaScript, jQuery and Backbone to Vue, Nuxt, React and Next.js, and the patterns for governing a frontend at scale.",
      ],
    },
    backend: {
      title: "Backend, Realtime & Data",
      description: [
        "Server frameworks, databases, event streams and real time transports, including the C++ libraries under my game servers.",
      ],
    },
    mobile: {
      title: "Mobile & Desktop",
      description: [
        "Native and cross platform apps, desktop builds and the release pipelines that get them into the stores.",
      ],
    },
    blockchain: {
      title: "Web3 Libraries & Chains",
      description: [
        "Wallets, indexers and the chains I have built on, from EVM networks and Solana to a chain of our own on Substrate.",
      ],
    },
    cloud: {
      title: "Cloud & Infrastructure",
      description: [
        "Hosts I have run production on, from servers set up by hand on OVH and DigitalOcean to Kubernetes on GKE and AWS set up in full.",
      ],
    },
    cms: {
      title: "Commerce & Content Platforms",
      description: [
        "AEM and Strapi for enterprise content, Contentful for client sites, Shopify with plugins of my own, and WordPress.",
      ],
    },
    tools: {
      title: "Tools Skills",
      description: [
        "I generally use a variety of tools. Some I use less often, and some more, depending on the current task.",
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
      lenses: {
        recruiter: [
          "I built machine learning models before LLMs, and AI agents are now part of almost every task I do, inside " +
            "rules and reviews I set. The numbers, the rules and the history are below.",
        ],
        product: [
          "AI as a way to ship faster without lowering the bar: what I use it for, the guardrails that keep it safe for a company, and how I got here.",
        ],
      },
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
      lenses: {
        recruiter: [
          "Real problems from my roles and my own platform: the problem, how it was solved, and the rule I kept.",
        ],
        product: [
          "Real cases from my roles and my own platform, each read as the problem, the decisions and the outcome.",
        ],
      },
    },
    web3: {
      title: "On Chain",
      description: ["Web3 from fan tokens at scale to a chain of my own. Each block below is somewhere it shipped, confirmed as you read it."],
      lenses: {
        recruiter: [
          "Web3 in production: fan tokens for 1.5M+ users, a chain built from zero, an NFT lending marketplace and a game launcher.",
        ],
        product: [
          "Web3 products from fan engagement at scale to a chain built from zero, and what each one let its users do.",
        ],
      },
    },
    igaming: {
      title: "Live Table",
      description: ["iGaming across live casino, slots and bet tables, to regulated platforms for clients. The cards are dealt as you arrive."],
      lenses: {
        recruiter: [
          "iGaming experience across live casino, slots and bet tables: game UIs and mobile apps, operator tooling, and platforms for clients.",
        ],
        product: [
          "Casino products for operators: rich games on every screen whose results always come from the server, and onboarding that scales with operators.",
        ],
      },
    },
    codeReview: {
      title: "Code Review and Open Source",
      description: ["The work behind the work: reading other people's code closely, in teams and in the open."],
    },
    platform: {
      title: "What I Have Built, More Than Once",
      description: ["The same kinds of system, built at several companies. Each tile names where; below them, worked examples in detail."],
      lenses: {
        recruiter: [
          "The kinds of system I have built at more than one company, with worked examples.",
        ],
      },
    },
    engineRoom: {
      title: "Engine Room",
      description: [
        "Under the floor of the game world: an MMO from engine to live operations, a location based mobile game, rendering heavy " +
          "animation at frame rate, a game server before and after a bot flood, and a Web3 game launcher.",
      ],
      lenses: {
        recruiter: [
          "How the games I have built and worked on fit together, in brief. Open a drawing for the detail.",
        ],
        product: [
          "The products behind the game world: an MMO run as a live business, a game played on the real map, and a launcher that puts a Web3 game one click away.",
        ],
      },
    },
    arena: {
      title: "Bug Raid",
      description: ["A break from reading. Squash the bugs before they reach production. Your best score stays in this browser."],
      lenses: {
        recruiter: [
          "An optional game: squash the bugs before they reach production. Skip it if you are short on time.",
        ],
      },
    },
    duels: {
      title: "Human vs Agent",
      description: [
        `PvP, honestly: every round here happened. Most go my way. Some go to the agent, and each of those left me a rule I still
        follow.`,
      ],
      lenses: {
        recruiter: [
          "Real rounds of working with an AI agent. Most go my way; the ones that did not each became a rule I follow.",
        ],
        product: [
          "What working with an AI agent looks like in practice, and the rules that keep it safe for a company: security, policy, data privacy and process.",
        ],
      },
    },
    forge: {
      title: "Skills",
      description: [
        `No self ratings. Each skill's rarity is earned from how long I have used it in real roles, projects and study, measured from
        their dates, and every card says where.`,
      ],
      lenses: {
        recruiter: [
          "Every skill with its years of use, measured from the dates of real roles, projects and study.",
        ],
      },
    },
    talents: {
      title: "Talents",
      description: ["The skills that do not fit in a stack: how I work with people."],
    },
    roster: {
      title: "Characters I Play",
      description: [
        `The roles I play, as characters in my own party, each with the job titles it covers. Level is the years in that role,
        measured from real dates. Stats are my own scores.`,
      ],
      lenses: {
        recruiter: [
          "The roles I play, from architect and CTO to product and blockchain engineer, with the years in each, measured from real dates.",
        ],
        product: [
          "The roles I play, product ones included: CEO, Product Owner and product engineer as well as architect, with the years in each.",
        ],
      },
    },
    projects: {
      title: "Projects & Achievements",
      description: [
        "Every project is a region on the map, laid out in the order I explored them. Pick one to open its map: what I built there, the loot, and where to see it.",
      ],
      lenses: {
        recruiter: [
          "Projects and achievements, one region each. Open one for what I built there and where to see it.",
        ],
      },
    },
    recommendations: {
      title: "Recommendations",
      description: [
        "Lines from my reference letters from Authentic Gaming and reNFT, attributed by role. A reference from KPMG is available on request.",
      ],
    },
  },
  details: {
    name: "Redeemer Pace",
    intro: "Architect. Builder. Founder.",
    hook: "Programming since I was 7. Game engines, payment systems, a blockchain and platforms for millions, and companies of my own.",
    paragraphs: [
      `I am a software architect with 15+ years in the industry, most of them leading: CEO and CTO of my own social network and MMORPG,
      co-founder and CTO of CoinOn, then architect and tech lead at Chiliz and Conrad. I design systems that are not tied to a vendor or a framework,
      and I stay hands on while I do it.`,
      `I build with AI agents. I write the rules, the context and the checks they work within, and a person reviews every change. The
      "How I use AI" section shows what that looks like day to day.`,
      `I have worked across e-commerce, payments, iGaming, game publishing and Web3, on the engineering side and on the business side.
      That is why I can be useful to a CTO in the morning and to a marketing team in the afternoon.`,
      `I am looking for an architect, head or VP of engineering, product engineering, blockchain or AI engineering role where the
      problems are hard and the standards are high.`,
    ],
    proof: [
      { value: "20+", label: "years writing software, since I was 7" },
      { value: "15+", label: "years in the industry, from my first company in 2010" },
      { value: "12+", label: "startups built" },
      { value: "200M+", label: "active users on products at companies I worked for" },
      { value: "1.5M+", label: "users in 167 countries on one platform" },
      { value: "7M+", label: "sessions a month at peak on another" },
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
        {
          title: "DevOps & Release Engineering",
          icon: faCloudArrowUp,
          description: "I set up the pipelines, environments and release paths that let a team ship often without breaking production.",
          points: [
            "CI/CD with audit logs, permission controls and rollback",
            "Kubernetes, canary rollouts and edge caching, or simpler hosts behind deploy adapters",
            "Environments, migrations and feature flags that keep staging honest",
            "Disaster recovery and business continuity plans",
          ],
          emailSubject: "DevOps and release engineering",
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
      productOutcome: "A storefront in 16 markets moving to a headless CMS market by market, with editors targeting each block by market, audience and viewport",
      outcome: "Up to 7M+ sessions a month, working with 90+ people up to CTO level",
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
        "ADR-driven Documentation for AI-assisted Decisions",
        "Agentic Implementation with Human-in-the-loop Review",
        "Architecture + Codebase Analysis Workflows",
        "Parallel Sub-agent Orchestration for Multi-source Audits",
        "Svelte",
        "NX",
        "pnpm",
        "shadcn-vue",
        "Tailwind",
        "VS Code",
        "JetBrains Tools",
        "Miro",
      ],
    },
    {
      title: "Senior Full Stack Engineer, HyperPlay Labs",
      industries: ["gamePublishing", "web3"],
      from: "Oct 2023",
      productOutcome: "A Web3 game one launcher away: store, wallet and install in one flow across web, desktop and mobile, plus a portal for studios",
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
        "Fastlane",
        "Google Store & Apple Store",
        "pnpm",
        "shadcn-ui",
        "Tailwind",
        "Turborepo",
        "VS Code",
        "JetBrains Tools",
        "Visual Studio",
        "Miro",
      ],
    },
    {
      title: "Senior Frontend Engineer, reNFT Labs",
      industries: ["web3"],
      from: "Jan 2023",
      productOutcome: "Marketplace V2 and its landing page, rebuilt so the NFT lending product could keep changing without breaking its critical flows",
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
        "pnpm",
        "shadcn-ui",
        "Tailwind",
        "Turborepo",
        "VS Code",
        "JetBrains Tools",
        "Miro",
      ],
    },
    {
      title: "Founder & Architect, Gamified Social Network Platform",
      ventureRole: "Founder, CEO and CTO",
      industries: ["fintech", "sports", "social"],
      isVenture: true,
      from: "2021",
      productOutcome:
        "A gamified social platform with milestone based funding, payments on a double entry ledger, an ads " +
        "engine with its own auction and real time feeds",
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
        "Strapi",
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
        "PL/pgSQL",
        "Tailwind",
        "VS Code",
        "JetBrains Tools",
        "Miro",
      ],
    },
    {
      title: "Founder, CEO at TasteTravellers",
      ventureRole: "Founder and CEO",
      industries: ["travel"],
      from: "Feb 2018",
      productOutcome: "A travel page and community grown through authentic content, brand collaborations and paid campaigns",
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
        "Built and ran the TasteTravellers store on Shopify, including plugins of my own for it.",
        "Collaborations and partnerships with travel related companies, promoted to the community.",
      ],
      techStack: [
        "Shopify",
      ],
    },
    {
      title: "Founder, CEO & CTO, Gods of Zushin",
      ventureRole: "Founder, CEO and CTO",
      industries: ["gamePublishing"],
      from: "Apr 2015",
      productOutcome:
        "An MMORPG run as a live business: purchases and subscriptions, live patching, moderation and " +
        "analytics, marketed across social and streaming platforms",
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
        "Ran the game on OVH dedicated servers and the web on DigitalOcean, set up from scratch with no managed cloud, behind Cloudflare.",
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
        "Bash",
        "SSH",
        "OpenSSL",
        "Linq",
        "OVH Cloud",
        "WordPress",
        "VS Code",
        "JetBrains Tools",
        "Visual Studio",
      ],
    },
    {
      title: "Mobile Core Engineer / Architect, Chiliz",
      industries: ["web3", "sports"],
      from: "Nov 2019",
      productOutcome: "A fan engagement app for 1.5M+ users in 167 countries, taken from critically unstable to a core seven squads ship features on",
      outcome: "1.5M+ users in 167 countries, 7 product squads and 30+ engineers",
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
        "Cordova",
        "Dart",
        "Fastlane",
        "Google Store & Apple Store",
        "Firebase",
        "VS Code",
        "JetBrains Tools",
        "Visual Studio",
        "Miro",
      ],
    },
    {
      title: "Co-founder & CTO, CoinOn",
      ventureRole: "Co-founder and CTO",
      isVenture: true,
      industries: ["web3"],
      from: "Nov 2021",
      productOutcome:
        "A Web3 platform for influencers and game publishers, taken from zero to web, mobile and chain, with " +
        "the roadmap, KPIs and budgeting tools to run it",
      to: "Jan 2022",
      description: [
        "Delivered a full scale solution of website, mobile app and a blockchain infrastructure.",
      ],
      bullets: [
        "Defined and executed the technology roadmap, aligning engineering goals with the company’s long term vision and product milestones.",
        "Led the architecture from 0 to 1, building the entire stack from the ground up with scalability, security, and performance at its core.",
        "Built for exchange and DeFi volume from day one, and live before creator coin launchpads became a trend; what it could not get was a licence.",
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
        "Dart",
        "Golang",
        "Ruby on Rails",
        "Gatsby",
        "Firebase",
        "NX",
        "WordPress",
        "VS Code",
        "JetBrains Tools",
        "Visual Studio",
        "Miro",
      ],
    },
    {
      title: "Software Engineer / Technical Lead for Client Projects, KPMG",
      industries: ["fintech", "igaming", "gamePublishing", "pharmatech", "consulting"],
      from: "Feb 2019",
      productOutcome: "Client products shipped with machine learning for recommendations, ads and feed ranking, which went live",
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
        "Contentful",
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
        "Symfony",
        "Linq",
        "Python",
        "Ruby on Rails",
        "VS Code",
        "JetBrains Tools",
        "Visual Studio",
      ],
    },
    {
      title: "Frontend Game Engineer, AuthenticGaming",
      industries: ["igaming"],
      from: "Jul 2017",
      productOutcome: "A live casino game UI for every screen and a new mobile app, credited by the CTO with the most innovative user experience in the industry",
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
        "Socket.IO",
        "Ramda",
        "VS Code",
        "JetBrains Tools",
      ],
    },
    {
      title: "Founder, CEO & CTO, Arcavium",
      ventureRole: "Founder, CEO and CTO",
      isVenture: true,
      countsForSkills: false,
      industries: ["gamePublishing"],
      period: "A past venture",
      // Undated on purpose: the year only places it on the timeline and is never shown.
      from: "2020",
      to: "2020",
      productOutcome:
        "Anyone could build and run a whole game, client and server, without writing an engine, and drop into code only where they wanted",
      description: [
        `A low code game builder: choose from menus and upload models to build a whole game, its client interface and its server, write
        classes in several languages where needed, and leave hosting and the rest to the platform. It launched, and closed for lack of funding.`,
      ],
      bullets: [
        "The game client and server generated from menu choices and uploaded models",
        "Custom classes in several languages, run safely by the platform",
        "Hosting and updates handled for the creator, with any customisation they needed",
      ],
      techStack: ["Strapi"],
    },
    {
      title: "Founder & CTO, Adotta",
      ventureRole: "Founder and CTO",
      isVenture: true,
      countsForSkills: false,
      industries: ["social", "fintech"],
      period: "A past venture",
      // Undated on purpose: the year only places it on the timeline and is never shown.
      from: "2020",
      to: "2020",
      productOutcome:
        "Giving to an animal shelter earned points that partners accepted, so a donation came back to the donor as value",
      description: [
        `A donations app for animal shelters: donors earn points they can spend wherever partners accept them. It launched, and closed for
        lack of funding.`,
      ],
      bullets: [
        "Shelter profiles with what each one needs",
        "Donations that earn points",
        "Points spent with partner businesses",
      ],
      techStack: ["Strapi"],
    },
    {
      title: "Founder & CTO, Punti",
      ventureRole: "Founder and CTO",
      isVenture: true,
      countsForSkills: false,
      industries: ["ecommerce", "fintech"],
      period: "A past venture",
      // Undated on purpose: the year only places it on the timeline and is never shown.
      from: "2020",
      to: "2020",
      productOutcome:
        "Shops, outlets and restaurants got a ready loyalty scheme, online and in store, without building or maintaining an app",
      description: [
        `A loyalty platform for ecommerce, physical outlets and restaurants, so a business could run its own loyalty scheme without building or
        maintaining an app. It launched against established competition, and closed for lack of funding.`,
      ],
      bullets: [
        "One customer app holding points for every business",
        "Earning at the till or online, by each business's own rules",
        "A dashboard for rewards, with no app for the business to build",
      ],
      techStack: ["Strapi"],
    },
    {
      title: "Founder, CEO & CTO, Crypto Casino",
      ventureRole: "Founder, CEO and CTO",
      isVenture: true,
      countsForSkills: false,
      industries: ["igaming", "web3", "fintech"],
      period: "A past venture",
      // Undated on purpose: the year only places it on the timeline and is never shown.
      from: "2021",
      to: "2021",
      productOutcome: "A complete crypto casino and sportsbook, built for scale and ready to launch, held back only by licensing",
      description: [
        `A crypto casino with games aggregated from many studios, a sportsbook with live odds, bonuses and tournaments, and crypto
        deposits and withdrawals on one balance. Built in full and never launched: it could not get a licence.`,
      ],
      bullets: [
        "Games from many studios behind one aggregation layer",
        "A sportsbook with live odds and settlement",
        "Bonuses and tournaments that run across every game",
        "Crypto deposits and withdrawals on several chains, on one balance",
        "Built for scale from the start, held back only by licensing",
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
        "Object Oriented Programming", "Data Structures & Algorithms", "Software Test Automation", "UX Design", "Visual Studio"],
      from: "Sep 2015",
      to: "Jun 2017",
    },
    {
      title: "Extended Diploma Computer Software Engineering, MCAST",
      description: [],
      techStack: ["C#", "Blender", "Photoshop", "Web Development", "PHP", "Maths", "2D Animation with After Effects", "SQL", "Networking", "Visual Studio"],
      from: "Sep 2013",
      to: "Jun 2015",
    },
    {
      title: "Diploma Computer Software Engineering, MCAST",
      description: [],
      techStack: ["C#", "Blender", "Photoshop", "Web Development", "PHP", "Maths", "2D Animation with After Effects", "SQL", "Networking", "Visual Studio"],
      from: "Sep 2011",
      to: "Jun 2013",
    },
    {
      title: "Foundation in Computing, MCAST",
      description: [],
      techStack: ["C#", "Computer Systems", "Web Development", "Maths", "Visual Studio"],
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
    programming: [
      {
        name: "Typescript",
        score: 95,
      },
      {
        name: "Javascript",
        score: 90,
      },
      {
        name: "PHP",
        score: 90,
      },
      {
        name: "C/C++",
        score: 70,
      },
      {
        name: "C#, .NET",
        score: 59,
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
        name: "Golang",
        score: 10,
      },
      {
        name: "Rust",
        score: 40,
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
        name: "Dart",
        score: 70,
      },
      {
        name: "Solidity",
        score: 50,
      },
      {
        name: "SQL",
        score: 95,
      },
      {
        name: "PL/pgSQL",
        score: 75,
      },
      {
        name: "Bash",
        score: 80,
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
        name: "ShaderLab",
        score: 50,
      },
    ],
    frontend: [
      {
        name: "Vue",
        score: 95,
      },
      {
        name: "Nuxt / Nuxt 4",
        score: 90,
      },
      {
        name: "React",
        score: 90,
      },
      {
        name: "NextJs",
        score: 90,
      },
      {
        name: "Angular",
        score: 40,
      },
      {
        name: "Svelte",
        score: 60,
      },
      {
        name: "Astro",
        score: 60,
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
        name: "JQuery",
        score: 99,
      },
      {
        name: "RxJS",
        score: 90,
      },
      {
        name: "Ramda",
        score: 60,
      },
      {
        name: "State Management",
        score: 90,
      },
      {
        name: "Canvas",
        score: 90,
      },
      {
        name: "WebGL",
        score: 80,
      },
      {
        name: "PixiJs",
        score: 40,
      },
      {
        name: "Webpack",
        score: 80,
      },
      {
        name: "SSR / SSG",
        score: 90,
      },
      {
        name: "Design Systems",
        score: 90,
      },
      {
        name: "Micro-frontends",
        score: 85,
      },
      {
        name: "Tailwind CSS",
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
      {
        name: "pnpm",
        score: 90,
      },
    ],
    backend: [
      {
        name: "NodeJS",
        score: 85,
      },
      {
        name: "NestJS",
        score: 85,
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
        name: "Ruby on Rails",
        score: 70,
      },
      {
        name: "Graphql",
        score: 70,
      },
      {
        name: "PostgreSQL",
        score: 85,
      },
      {
        name: "Redis",
        score: 80,
      },
      {
        name: "MongoDB",
        score: 70,
      },
      {
        name: "Supabase",
        score: 80,
      },
      {
        name: "NoSQL",
        score: 90,
      },
      {
        name: "Kafka",
        score: 50,
      },
      {
        name: "Temporal",
        score: 80,
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
        name: "Firebase",
        score: 70,
      },
      {
        name: "Boost",
        score: 80,
      },
      {
        name: "ACE",
        score: 75,
      },
      {
        name: "Linq",
        score: 30,
      },
      {
        name: "Ssh",
        score: 90,
      },
      {
        name: "OpenSSL",
        score: 60,
      },
    ],
    mobile: [
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
        name: "Electron",
        score: 40,
      },
      {
        name: "Fastlane",
        score: 30,
      },
      {
        name: "Google Store & Apple Store",
        score: 90,
      },
    ],
    blockchain: [
      {
        name: "Ethers.js",
        score: 60,
      },
      {
        name: "Wagmi (React)",
        score: 70,
      },
      {
        name: "TheGraph",
        score: 50,
      },
      {
        name: "Alchemy",
        score: 60,
      },
      {
        name: "Solana",
        score: 30,
      },
      {
        name: "Substrate",
        score: 70,
      },
      {
        name: "Polkadot",
        score: 70,
      },
    ],
    cloud: [
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
        name: "Cloudflare",
        score: 90,
      },
      {
        name: "Cloudflare Workers",
        score: 85,
      },
      {
        name: "Vercel",
        score: 70,
      },
      {
        name: "Railway",
        score: 70,
      },
      {
        name: "Docker",
        score: 90,
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
        name: "Istio",
        score: 70,
      },
      {
        name: "Varnish",
        score: 75,
      },
      {
        name: "Aiven Postgres",
        score: 60,
      },
      {
        name: "CI/CD",
        score: 85,
      },
      {
        name: "OpenFeature",
        score: 75,
      },
      {
        name: "GO Feature Flag",
        score: 75,
      },
    ],
    cms: [
      {
        name: "Adobe Experience Manager (AEM)",
        score: 75,
      },
      {
        name: "Strapi",
        score: 90,
      },
      {
        name: "Contentful",
        score: 75,
      },
      {
        name: "Shopify",
        score: 50,
      },
      {
        name: "Wordpress",
        score: 67,
      },
    ],
    tools: [
      {
        name: "Git",
        score: 95,
      },
      {
        name: "SVN",
        score: 90,
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
        name: "draw.io / C4 model",
        score: 90,
      },
      {
        name: "Miro",
        score: 85,
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
      {
        name: "Stripe",
        score: 90,
      },
      {
        name: "PayPal",
        score: 80,
      },
      {
        name: "Twilio",
        score: 75,
      },
      {
        name: "Google Maps",
        score: 75,
      },
      {
        name: "Mapbox",
        score: 75,
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
      {
        name: "Leading squads and engineering teams",
        score: 80,
      },
      {
        name: "Hiring and building teams",
        score: 80,
      },
      {
        name: "Architecture governance",
        score: 80,
      },
      {
        name: "Roadmaps and prioritisation",
        score: 80,
      },
      {
        name: "Estimation and scoping",
        score: 80,
      },
      {
        name: "Onboarding engineers",
        score: 80,
      },
      {
        name: "Technical and vendor evaluations",
        score: 80,
      },
      {
        name: "Delegation and ownership",
        score: 80,
      },
      {
        name: "Running workshops and discovery",
        score: 80,
      },
      {
        name: "Leading through incidents",
        score: 80,
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
        icon: faRocketLaunch,
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
        "PayPal for purchases and donations",
        "Subscriptions",
        "Payment provider abstraction and routing",
        "Double entry ledgers",
        "Idempotency",
        "Signed and verified webhooks",
        "Reconciliation",
        "Multi currency and FX",
        "Tax",
        "Banking rails: bank transfers next to card payments",
        "On and off ramps between fiat and crypto",
        "Payments paused automatically on fraud signals",
        "Payment holds with dual approval",
      ],
    },
    {
      label: "Web3 & Blockchain",
      items: [
        "Ethereum and EVM chains, Solana, Bitcoin and Polkadot parachains",
        "A chain of our own on Substrate, with bridges",
        "Smart contracts in Solidity and Rust",
        "Indexing with The Graph and Alchemy",
        "Wallets with Wagmi and Ethers.js",
        "Exchanges: trading and swaps from one token to another",
        "Listing after KYC review, and automatic listing on volume",
        "A stablecoin underneath, with every token traded against it",
        "Creator token launchpads",
        "NFT lending and rentals",
        "Asset management for large holders",
        "Node and indexing infrastructure as a service",
        "Attack vector reviews before every release",
      ],
    },
    {
      label: "iGaming",
      items: [
        "Live dealer UIs on every screen",
        "Slots with outcomes decided on the server",
        "Bet tables drawn on canvas",
        "Player accounts and wallets",
        "Bonuses and tournaments",
        "Sportsbook and live odds",
        "Game aggregation across studios",
        "Operator integration and automated onboarding",
        "Real time game feeds over WebSockets",
      ],
    },
    {
      label: "Game Development",
      items: [
        "An MMORPG engine and servers built from scratch in C/C++",
        "My own physics engine and framework",
        "Low latency multiplayer networking",
        "Boost and ACE as general libraries",
        "Lua for game content",
        "A C# launcher with live patching",
        "Anti cheat and anti tamper",
        "Canvas and WebGL games with PixiJS",
        "GPU and render performance for heavy animation",
        "Location based mobile games",
        "Unity and Unreal Engine",
      ],
    },
    {
      label: "Algorithms & Recommendations",
      items: [
        "Feed suggestions ranked by affinity, freshness and engagement",
        "Product suggestions from views, baskets and similar items",
        "Suggested follows",
        "Ads ranking and targeting",
        "Trending scores with time decay",
        "Cold start fallbacks for new people and new items",
        "Diversity rules, so a feed does not repeat itself",
        "Search relevance and boosting",
        "Compression and encryption algorithms",
      ],
    },
    {
      label: "Search",
      items: [
        "Elasticsearch for product search",
        "Facets, filters and sorting over large catalogues",
        "Autocomplete and suggestions",
        "Search across languages and markets",
        "Search over encrypted fields with blind indexes",
      ],
    },
    {
      label: "Commerce & CMS",
      items: [
        "Adobe Experience Manager",
        "Contentful for client sites",
        "Strapi, for enterprise content and my own products",
        "Shopify stores, with plugins I built for a travel brand",
        "WordPress sites",
        "Headless CMS migrations",
        "Multi market catalogues and pricing",
        "Procurement punch out with SAP Ariba and Oracle OCI",
        "Digital asset management",
        "Translation management",
      ],
    },
    {
      label: "CRM & Marketing",
      items: [
        "Customer data and personalisation with Insider",
        "Transactional and marketing email with SendGrid",
        "A/B testing with Kameleoon and Adobe Target",
        "Support desks with Zendesk",
        "Customer master data synced with SAP",
        "Server side tagging and consent",
        "Paid campaigns on Facebook, YouTube, Twitch, Reddit and Instagram",
        "Referral and invite flows",
      ],
    },
    {
      label: "Auth & Identity",
      items: [
        "OAuth 2",
        "Running an OIDC provider",
        "Enterprise OIDC with Cidaas",
        "JWT",
        "Two factor (TOTP)",
        "Role based access control",
        "KYC gated accounts",
        "Secrets handling",
      ],
    },
    {
      label: "Security, SecOps & Anti Cheat",
      items: [
        "Custom cryptography and compression for game client and server traffic",
        "Anti cheat in my game: anti tamper on accounts and inventory",
        "Anti abuse on a social platform: abuse paths closed on refunds and ad billing",
        "Bot flood response: a read only assessment, a hardening runbook and firewall scripts",
        "Authorisation reviews with critical findings fixed",
        "Smart contract security audits and attack path review",
        "Rate limiting in two layers",
        "Field level encryption with blind indexes",
        "CSP and security headers",
        "Supply chain advisories and a CI blocklist scan",
        "Vendor security vetting against SOC 2 and GDPR",
        "Partitioned audit logs",
      ],
    },
    {
      label: "DevOps & Infrastructure",
      items: [
        "CI/CD with audit logs, permission controls and rollback",
        "Kubernetes on GKE, Helm and Istio canary rollout per market",
        "AWS set up in full and tuned for cost",
        "Varnish and Cloudflare Workers at the edge",
        "Disaster recovery and business continuity plans",
        "Deploy adapters over two hosts and 14 service environments",
        "Database migrations verified on staging and production",
        "Game servers run from scratch on OVH and DigitalOcean, with live patching",
        "Servers per region, switched by hand before load balancers were common",
        "Desktop and mobile release builds",
        "App store release pipelines",
      ],
    },
    {
      label: "Backend & Data",
      items: [
        "Express",
        "AdonisJS",
        "Drizzle",
        "gRPC",
        "OpenAPI",
        "Event streams, with an outbox",
        "Real time over WebSockets and SSE",
        "Microservices",
        "Sagas across ledgers",
        "MariaDB and T-SQL",
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
      label: "AI & Machine Learning",
      items: [
        "TensorFlow",
        "PyTorch",
        "Recommendation, ads and feed ranking models",
        "LLM APIs (GPT, Claude, Gemini)",
        "LangChain",
        "Agent skills, subagents and slash commands",
        "Plans and progress tracked in published artifacts",
        "Test batteries as the proof layer",
      ],
    },
    {
      label: "MCP Servers",
      items: [
        "Playwright and Chrome DevTools, to check the deployed build",
        "Supabase, with staging and production kept apart",
        "Vercel, Railway and Cloudflare for deploys, logs and bindings",
        "Sentry for errors",
        "Stripe and PayPal",
        "Jira and Confluence",
        "Figma for design context",
        "Context7, Microsoft Learn, and Google and Gemini developer docs",
        "Next.js and Nuxt devtools",
        "Docker Hub, Docker docs and Redis",
        "Strapi and AEM MCP options, evaluated for access control",
        "My own servers for logging, audit and SQL access",
        "A read only server over archived session history",
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
      deepDive: "A deeper look",
      screens: "From the real thing",
      screenPrevious: "Previous screenshot",
      screenNext: "Next screenshot",
      screenPosition: "Screenshot {index} of {count}",
      undated: "Past",
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
        "Built the engine and the servers from scratch in C/C++, with my own framework and physics, for low latency multiplayer; Boost and ACE as general libraries",
        "Wrote custom cryptography and compression for client and server traffic, with anti tamper account and inventory systems",
        "Added Stripe and PayPal for in game purchases and subscriptions, and a branded merchandise store",
        "Grew the community with campaigns on Facebook, YouTube, Twitch, Reddit and Instagram",
        "Built moderation tools, analytics dashboards and live patching",
        "Led moderators, event coordinators, testers and developers as CEO and CTO",
      ],
      techStack: ["C/C++", "Boost", "ACE", "Lua", "Python", "VueJS", "PHP Laravel", "C#", "Electron (Old Launcher)", "OVH Cloud", "DigitalOcean", "Cloudflare",
        "WordPress", "Shopify"],
      link: "https://goz.fun",
      deepDive: {
        stats: [
          { value: "8M+", label: "registered accounts" },
          { value: "50k", label: "active players at its peak" },
          { value: "2015", label: "started, and still patched today" },
        ],
        note: "As with most of my startups I was CEO and CTO, and what it lacked to take a strong position was funding.",
        screens: [
          {
            image: "/images/ventures/goz-5.webp",
            caption: "The launcher: news, the shop and Play, over the running game (2020)",
            alt: "Game launcher window titled Gods of Zushin, begin your journey, with news tiles, shop and community links and a Play Now button",
          },
          {
            image: "/images/ventures/goz-6.webp",
            caption: "Character select, with a level 300 Sun Warrior (2020)",
            alt: "Character select screen with a warrior in glowing pink armour on a cloud backdrop, a stats panel and character slots",
          },
          {
            image: "/images/ventures/goz-7.webp",
            caption: "The world map of Zushin",
            alt: "Hand painted parchment map of floating islands, mountains and sea",
          },
          {
            image: "/images/ventures/goz-8.webp",
            caption: "A guild gathered at the Palace, by the warehouse, auction and exchange (2020)",
            alt: "Town square in front of a palace with a crowd of players beside characters labelled Warehouse, Auction and Exchange Points",
          },
          {
            image: "/images/ventures/goz-9.webp",
            caption: "Close combat in a dark temple (2017)",
            alt: "A warrior fighting ghost enemies in a dark temple with damage numbers and experience gained floating above",
          },
          {
            image: "/images/ventures/goz-10.webp",
            caption: "A party against the ice Dragon Lord in a group dungeon (2018)",
            alt: "A party of players fighting a giant ice dragon boss in a temple, with a boss health bar and a group loot panel",
          },
          {
            image: "/images/ventures/goz-11.webp",
            caption: "The Sea Devil boss, fought underwater (2019)",
            alt: "An armoured sea devil leaping at a player with a giant blade while other players gather behind",
          },
          {
            image: "/images/ventures/goz-12.webp",
            caption: "A winter event in the snow (2019)",
            alt: "A giant snowman with a yin and yang belly holding a lantern in a snowy pine forest",
          },
          {
            image: "/images/ventures/goz-1.webp",
            caption: "Fifth anniversary: the city dressed for the celebration",
            alt: "Game screenshot of a city square with pagoda rooftops and a fifth anniversary logo over the scene",
          },
          {
            image: "/images/ventures/goz-2.webp",
            caption: "In the world: a lantern lined path to a temple gate",
            alt: "Third person view of an armoured character walking a stone path between lanterns towards a temple gate",
          },
          {
            image: "/images/ventures/goz-3.webp",
            caption: "The quest journal and a boss quest",
            alt: "Game interface with a quest window listing a main quest tree and the details and rewards of a boss quest",
          },
          {
            image: "/images/ventures/goz-13.webp",
            caption: "A golden dragon mount across the desert (2023)",
            alt: "A player riding a golden mechanical dragon across a desert under an orange sky",
          },
          {
            image: "/images/ventures/goz-14.webp",
            caption: "A jade phoenix mount over a city in the sky (2023)",
            alt: "A player on a translucent jade phoenix flying past tall pagodas",
          },
          {
            image: "/images/ventures/goz-15.webp",
            caption: "A training plaza as enemies spawn (2023)",
            alt: "A character in red robes on a stone plaza with glowing magic circles as three enemies appear",
          },
          {
            image: "/images/ventures/goz-4.webp",
            caption: "Chapter 5, Discovery of New Lands",
            alt: "Wide banner of a stone arena in a forest with the title Chapter 5, Discovery of New Lands",
          },
        ],
        blueprintId: "goz",
      },
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
        "AnimeBook, the social network: friends, a timeline diary, videos, favourites, comments and sharing to other platforms",
        "Guilds and ship crews, ships levelled for stat bonuses, a wiki, forums, drawing galleries, and world and language chat channels",
        "Manga read as a real book, and anime streaming that could skip the fillers",
        "Characters with hybrid classes mixed across anime and random elements, levelled without a cap, in an economy of berries earned by taking part",
        "Items enhanceable without limit, a shop with rank upgrades, and PayPal donations",
        "My own PHP framework, in the spirit of Laravel and Symfony, that closed PHP's usual security loopholes, and my own JS framework",
        "Servers per region switched by hand, before load balancers were common, tuned to the bone",
        "An auction house for virtual items and a self serve ads system",
        "The game engine in PHP on the same framework: battles, levels, drops and the economy",
        "Grew and ran the community and its moderators as CEO and CTO",
      ],
      techStack: ["PHP", "My Own Frameworks (PHP, JS)", "JS (JQuery, Backbone)", "Python", "WebGL & Canvas", "HTML", "CSS", "OVH Cloud",
        "DigitalOcean", "Cloudflare", "Visual Studio"],
      link: "https://drive.google.com/drive/folders/1jN-Xhfiro3UJppRLVehG8UIytjFJVVtl?usp=share_link",
      deepDive: {
        stats: [
          { value: "10M+", label: "registered users" },
          { value: "3M+", label: "active users" },
          { value: "2015", label: "rebuilt from scratch" },
        ],
        note: "As with most of my startups I was CEO and CTO, and what it lacked to take a strong position was funding.",
        screens: [
          {
            image: "/images/ventures/amw-1.webp",
            caption: "Home hub: sharing, uploads, character gifts and a daily login reward",
            alt: "Web page over a parchment map with five feature tabs and a panel offering a reward for logging in",
          },
          {
            image: "/images/ventures/amw-2.webp",
            caption: "A crew page with members, points and a shared warehouse",
            alt: "Web page styled as a scroll showing a crew with members, points and a grid of shared items",
          },
          {
            image: "/images/ventures/amw-3.webp",
            caption: "The equipment auction shop",
            alt: "Dark red web page listing equipment items with prices and buy buttons",
          },
          {
            image: "/images/ventures/amw-4.webp",
            caption: "The community menu: anime book, pages, groups and channels",
            alt: "Web page with a menu of large tiles labelled Anime Book, Page, Group and Channel under an artwork banner",
          },
        ],
        blueprintId: "amw",
      },
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
        "The Shopify store, its products and the plugins I built for it",
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
      techStack: ["Unity", "Unreal Engine", "ShaderLab", "Sky Engine"],
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
      intro: "Tooling for grid trading strategies on Raindex, an on chain order book.",
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
        "Vercel", "Storybook", "Automated Testing", "PL/pgSQL"],
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
      icon: faMobileScreen,
      kind: "game",
      status: "openSource",
      title: "GOZ Mobile",
      category: "Mobile game",
      intro: "Gods of Zushin for touch devices and desktop: an MMORPG with a location based twist, in the spirit of Pokémon Go.",
      responsibilities: [
        "A client in JavaScript and TypeScript with RxJS, built with Babel",
        "Server side JSON from PHP and ASP, reusing the main game's API",
      ],
      techStack: ["JavaScript", "TypeScript", "RxJS", "Node.js", "PHP"],
      repo: "https://github.com/AMW-Game-Entertainment/GOZ-Mobile",
      from: "Jul 2017",
      to: "Nov 2018",
    },
    {
      icon: faRocketLaunch,
      kind: "game",
      status: "openSource",
      title: "GOZ Launchers",
      category: "Game launchers",
      intro: `The launcher players use is in C#: a minimal installer that downloads the game on first launch and starts the client.
      Electron and Vue versions were tried along the way.`,
      responsibilities: [
        "The C# launcher: a minimal installer, the game downloaded on first launch, then patched and started",
        "An Electron and Vue launcher, tried along the way",
        "A 2023 launcher app on Electron 23, tried along the way",
      ],
      techStack: ["Electron", "Vue.js", "C#", "TypeScript"],
      repo: "https://github.com/AMW-Game-Entertainment/GOZ-Launcher",
      from: "Jul 2019",
      to: "Sep 2024",
    },
    {
      icon: faCube,
      kind: "game",
      status: "openSource",
      title: "Three Unity Games",
      category: "Unity games",
      intro: "Three games made in Unity: BeatThem, a first person shooter; Surviving It, a survival game; and Your Kingdom, a kingdom builder.",
      responsibilities: [
        "BeatThem, a first person shooter",
        "Surviving It, a survival game",
        "Your Kingdom, a kingdom builder",
      ],
      techStack: ["Unity", "C#", "ShaderLab"],
      repo: "https://github.com/AMW-Game-Entertainment",
      from: "Feb 2021",
      to: "Feb 2021",
    },
    {
      icon: faArrowsRotate,
      kind: "game",
      status: "private",
      title: "GOZ App Rebuild",
      category: "Rebuild",
      intro: "The game's web app and API rebuilt on Next.js and Express, to simplify the application and reduce its running cost.",
      responsibilities: [
        "A web app on Next.js",
        "A game API on Express and TypeScript",
        "The older app and API replaced over time",
      ],
      techStack: ["Next.js", "Express", "TypeScript"],
      from: "Mar 2023",
      to: "Apr 2023",
    },
    {
      icon: faFutbol,
      kind: "product",
      status: "private",
      title: "Fan Guru",
      category: "Sports fan data",
      intro: "A sports fan venture: a crawler that gathers data from many sources into real time data for sports fans.",
      responsibilities: [
        "A crawler pulling data from many sources in real time",
        "A back end template kept deliberately small, with auth and database drivers added separately",
      ],
      techStack: ["TypeScript", "Node.js"],
      from: "Oct 2023",
      to: "Mar 2024",
    },
    {
      icon: faFileLines,
      kind: "product",
      status: "private",
      title: "StripMarkdown.com",
      category: "Online tool",
      intro: "An online tool that turns markdown into plain text instantly, free and with nothing to install.",
      responsibilities: [
        "Markdown converted to plain text in the browser",
        "Built for developers and content creators",
      ],
      techStack: ["TypeScript"],
      from: "Mar 2024",
      to: "Apr 2024",
    },
    {
      icon: faGem,
      kind: "product",
      status: "private",
      title: "Mela Luxe Brands",
      category: "Company website",
      intro: "The website for my brands company, showing its brands to investors, partners and future hires.",
      responsibilities: [
        "A showcase of the company's brands",
        "Pages for investors, partnerships and careers",
      ],
      techStack: ["TypeScript"],
      from: "Sep 2024",
      to: "Mar 2025",
    },
    {
      icon: faCoins,
      kind: "web3",
      status: "private",
      title: "CoinOn Studios",
      category: "Crypto studio",
      intro: "A crypto studio: its website, its app and a game in C#, FleetRush.",
      responsibilities: [
        "The studio website",
        "The studio app",
        "FleetRush, a game in C#",
      ],
      techStack: ["TypeScript", "C#"],
      from: "Apr 2024",
      to: "Mar 2025",
    },
    {
      icon: faBoxesStacked,
      kind: "product",
      status: "private",
      title: "Supplio",
      category: "B2B e-commerce",
      intro: "A B2B e-commerce platform in the spirit of Alibaba, built with the Manus agent.",
      responsibilities: [
        "Multiple vendors, a product catalogue and categories",
        "Cart, authentication and checkout with payment or email inquiry",
        "A Next.js front end on a NestJS back end",
      ],
      techStack: ["Next.js", "NestJS", "TypeScript"],
      from: "Jan 2026",
      to: "Jan 2026",
    },
    {
      icon: faTableColumns,
      kind: "product",
      status: "private",
      title: "The CMS",
      category: "CMS dashboard",
      intro: "A basic CMS dashboard, built to grow.",
      responsibilities: [
        "A content dashboard to build on",
      ],
      techStack: ["TypeScript"],
      from: "Sep 2025",
      to: "Oct 2025",
    },
    {
      icon: faGlobe,
      kind: "game",
      status: "ongoing",
      title: "Gods of Zushin, Cross Platform",
      category: "Rebuild",
      intro: "Gods of Zushin rebuilt as a cross platform game, mainly for the web.",
      responsibilities: [
        "A workspace for the cross platform rebuild",
      ],
      techStack: [],
      from: "Sep 2026",
    },
    {
      icon: faGamepadModern,
      kind: "game",
      status: "archived",
      title: "Arcavium",
      category: "Low code game builder",
      intro: "A whole game, client and server, built from menus and uploaded models, with code only where you want it. A past venture of mine.",
      responsibilities: [
        "The game client and server generated from menu choices and uploaded models",
        "Custom classes in several languages, run safely by the platform",
        "Hosting and updates handled for the creator",
        "Founded and led as CEO and CTO; it closed for lack of funding",
      ],
      techStack: ["Strapi"],
      countsForSkills: false,
      deepDive: { note: "One of my past ventures. It launched, and what it lacked to grow was funding.", blueprintId: "arcavium" },
      period: "A past venture",
      // Undated on purpose: the year only orders the map and is never shown.
      from: "2020",
      to: "2020",
    },
    {
      icon: faPaw,
      kind: "community",
      status: "archived",
      title: "Adotta",
      category: "Donations for shelters",
      intro: "A donations app for animal shelters, where every donation earned points to spend with partners. A past venture of mine.",
      responsibilities: [
        "Shelter profiles with what each one needs",
        "Donations that earn points, spent with partner businesses",
        "Founded it and led it as CTO; it closed for lack of funding",
      ],
      techStack: ["Strapi"],
      countsForSkills: false,
      deepDive: { note: "One of my past ventures. It launched, and what it lacked to grow was funding.", blueprintId: "adotta" },
      period: "A past venture",
      // Undated on purpose: the year only orders the map and is never shown.
      from: "2020",
      to: "2020",
    },
    {
      icon: faStore,
      kind: "product",
      status: "archived",
      title: "Punti",
      category: "Loyalty platform",
      intro: "Loyalty for shops, outlets and restaurants without building an app of their own. A past venture of mine.",
      responsibilities: [
        "One customer app holding points for every business",
        "Earning at the till or online, by each business's own rules",
        "Founded it and led it as CTO, against established competition; it closed for lack of funding",
      ],
      techStack: ["Strapi"],
      countsForSkills: false,
      deepDive: { note: "One of my past ventures. It launched, and what it lacked to grow was funding.", blueprintId: "punti" },
      period: "A past venture",
      // Undated on purpose: the year only orders the map and is never shown.
      from: "2020",
      to: "2020",
    },
    {
      icon: faDice,
      kind: "game",
      status: "archived",
      title: "Crypto Casino",
      category: "Crypto casino and sportsbook",
      intro: "A crypto casino and sportsbook of my own, built in full for scale and never launched for lack of a licence. A past venture of mine.",
      responsibilities: [
        "Games from many studios behind one aggregation layer, a sportsbook with live odds, and bonuses and tournaments across them",
        "Crypto deposits and withdrawals on several chains, on one balance and one ledger",
        "Founded it and led it as CEO and CTO; it was ready, and the licence was what it could not get",
      ],
      techStack: [],
      countsForSkills: false,
      deepDive: { note: "One of my past ventures. It was built in full; what it could not get was a licence.", blueprintId: "casino" },
      period: "A past venture",
      // Undated on purpose: the year only orders the map and is never shown.
      from: "2021",
      to: "2021",
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
      techStack: ["ReactJS", "Unity", "Angular", "C/C++", "PHP", "NodeJS", "Flutter", "Python", "Astro", "SVN"],
      link: "https://drive.google.com/drive/folders/0B1gPxpJpFGW5SGhXeS1pTzA4Tmc?resourcekey=0-amvzxbZpCBhf7bV-GVUmTg&usp=share_link",
      from: "2003",
    },
  ],
  caseStudyFilters: {
    label: "Show case studies for",
    allLabel: "Everything",
    domains: {
      architecture: "Architecture",
      payments: "Payments and banking",
      web3: "Web3 and blockchain",
      igaming: "iGaming",
      games: "Game publishing",
      mobile: "Mobile",
      security: "Security",
      ai: "AI workflow",
    },
  },
  bossLabels: { boss: "Boss", hp: "HP", defeated: "Defeated", loot: "Loot" },
  hud: { pick: "Pick a character", level: "Level", xp: "XP", bosses: "Bosses defeated" },
  lens: lensContent,
  journeyTrail: {
    zoneLabel: "Zone {index} of {total}: {zone}",
    zones: { matrix: "The Matrix", ai: "AI", chain: "Chain", casino: "Casino", mmo: "Game world" },
    titles: { started: "Start", about: "Who I am" },
  },
  finale: {
    kicker: "Run complete",
    title: "Wow! You made it to the end.",
    screen: ["THANKS FOR", "PLAYING"],
    screenLabel: "Thanks for playing",
    summaryTitle: "Your run",
    stats: {
      zones: "Zones crossed",
      bosses: "Bosses defeated",
      duels: "Duels played",
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
    ruleLabel: "Rule kept",
    rulesTitle: "Rules of engagement",
    rulesDescription: "What I put in place before a team works with agents, so the speed comes with guardrails.",
    rules: [
      {
        name: "Security",
        detail: `Tools scoped per environment, with staging and production on separate connections. Subagents never write to
        production, secrets are handled by name only, and a supply chain blocklist runs in CI.`,
      },
      {
        name: "Company policy",
        detail: `What employees and contractors may use AI for, written down. At Conrad I enforced the rule that nothing AI generated
        reaches the wiki or a pull request without human review.`,
      },
      {
        name: "Data privacy",
        detail: "A tool's confidentiality model is checked before company code goes near it. No sensitive data to a model, and synthetic data for money paths.",
      },
      {
        name: "The right skills and MCP servers",
        detail: "Project skills and MCP servers installed per job, each evaluated for access control before the team relies on it.",
      },
      {
        name: "A process that scales",
        detail: `One flow from idea to code: plan, design doc, tickets, test first, review. Decisions go in registers the agents
        search before they ask.`,
      },
      {
        name: "Fits the frameworks you run",
        detail: "Built to plug into what a company already uses: Agile sprints, the issue tracker and the wiki, through to HR and accountancy processes.",
      },
    ],
    rounds: [
      {
        agent: "A payer can change their country to unlock instant statutory refunds.",
        human: "The country locks once set. The real gap is that it is never checked against the payment.",
        result: "A jurisdiction snapshot on every charge.",
      },
      {
        human: "Write that agents never get write access to production and never see production data.",
        agent: "The configuration says otherwise: a production database connection exists without a read only flag. The absolute claim would not survive one question.",
        result: "The accurate version: staging and production as separate, chosen connections, and subagents that never write to production.",
        winner: "agent",
        rule: "A claim about how I work is checked against the actual configuration before it is published.",
      },
      {
        agent: "These two auth secrets match no code. Delete them from both hosting projects.",
        human: "Demo and production still run the old provider. Deleting them takes production down.",
        result: 'Live secrets kept, and "no longer used" now means on every deployed branch.',
      },
      {
        human: "Keep the role filter on plan lookups; without it, how do we filter plans by role?",
        agent: "Two kinds of query: one follows a subscription's own link to its plan, where a filter can only lose data; catalogue browsing keeps it.",
        result: "The split, after a fee bug charged some accounts the default rate instead of their plan's. I added the case it had missed.",
        winner: "agent",
        rule: "When a link already says which row is right, do not filter it again.",
      },
      {
        agent: "Nine domain services can use the shared base class directly.",
        human: "Each domain gets a subclass of its own, and the generator stops emitting the shortcut.",
        result: "Nine services wrapped and the generator template fixed.",
      },
      {
        human: "A cost saving and a user figure, written as I remembered them.",
        agent: "The documents mix a two year total with one year, and the public record for those years shows fewer users.",
        result: "About 80%, worded as the case and the architecture, and 1.5M+ users in 167 countries.",
        winner: "agent",
        rule: "Floors only, the measure named, nothing rounded up.",
      },
      {
        agent: "Post the review with the page's finding numbers.",
        human: "Comment on the exact lines instead.",
        result: "43 line comments, and three fix samples calling helpers that do not exist caught before posting.",
      },
    ],
  },
  web3: {
    statement: "Web3 infrastructure, exchanges and asset management: from token trading at scale to a chain of my own, lending, and wallets.",
    validatorsLabel: "Where it shipped",
    validators: ["Chiliz", "CoinOn", "reNFT", "HyperPlay"],
    flow: {
      title: "Send a transaction through the stack",
      description: "Pick a request and watch it travel from the wallet to the chain and back, with security checks on the way.",
      note: "A simulation of the architecture: nothing is signed and nothing touches a real chain.",
      resetLabel: "Reset",
      logLabel: "Transaction log",
      hashLabel: "tx",
      steps: [
        { id: "wallet", name: "Wallet", tech: ["MetaMask", "WalletConnect"] },
        { id: "dapp", name: "dApp", tech: ["Wagmi", "Ethers.js"] },
        { id: "security", name: "Security checks", tech: ["Simulation", "Allowance rules"] },
        { id: "rpc", name: "RPC provider", tech: ["Alchemy", "Infura"] },
        { id: "mempool", name: "Mempool", tech: ["Nonce", "Gas"] },
        { id: "block", name: "Block", tech: ["Confirmations"] },
        { id: "indexer", name: "Indexer", tech: ["The Graph"] },
        { id: "ui", name: "UI", tech: ["Receipt"] },
      ],
      scenarios: [
        {
          label: "Send 25 USDC",
          lines: [
            "wallet: the user signs, seeing the amount, the recipient and the fee",
            "dapp: transaction built with Wagmi and Ethers.js, gas estimated, chain id checked",
            "security: simulated first. Balance covers it, no unlimited approval, recipient not on a blocklist",
            "rpc: sent through Alchemy, with Infura as the fallback provider",
            "mempool: pending with the next nonce, waiting for a block",
            "block: mined and confirmed",
            "indexer: picked up by the subgraph, balances updated",
            "ui: receipt shown with a link to the transaction",
          ],
          result: "Done: 25 USDC sent.",
        },
        {
          label: "Approve unlimited spend",
          lines: [
            "wallet: a dApp asks for approval to spend your tokens",
            "dapp: request decoded as approve(spender, unlimited)",
            "security: blocked. Unlimited approval to an unverified contract; an exact amount is suggested instead",
          ],
          blockedAt: "security",
          result: "Stopped before signing: nothing reached the chain.",
        },
      ],
    },
    stackTitle: "The stack on chain",
    stack: [
      {
        label: "Token standards",
        items: [
          { name: "ERC-20", detail: "Fungible tokens and stablecoins" },
          { name: "ERC-721", detail: "NFTs, one of a kind" },
          { name: "ERC-1155", detail: "Many token types in one contract" },
        ],
      },
      {
        label: "Smart contracts",
        items: [{ name: "Solidity" }, { name: "Rust on Substrate" }, { name: "Security audits" }, { name: "Attack path review" }],
      },
      {
        label: "Chains",
        items: [{ name: "Ethereum and EVM chains" }, { name: "Polygon" }, { name: "Solana" }, { name: "Polkadot and parachains" }, { name: "Substrate" }],
      },
      {
        label: "Wallets and chain data",
        items: [
          { name: "MetaMask" },
          { name: "WalletConnect" },
          { name: "Wagmi" },
          { name: "Ethers.js" },
          { name: "Web3.js" },
          { name: "The Graph" },
          { name: "Alchemy" },
          { name: "Infura" },
        ],
      },
    ],
    blockLabel: "Block",
    previousLabel: "prev",
    pendingLabel: "Pending",
    confirmedLabel: "Confirmed",
    capabilities: [
      {
        name: "Token exchange and fan tokens",
        detail: `An exchange app where each club's token trades against a base token, with on chain buying and reward claims, for 1.5M+ users
        in 167 countries.`,
        places: ["Chiliz"],
      },
      {
        name: "A chain of my own, with bridges",
        detail: "A chain in Rust on Substrate after Polkadot parachains, with bridges and indexers across Solana, Polkadot and EVM chains.",
        places: ["CoinOn"],
      },
      {
        name: "Stablecoins",
        detail: "Stablecoin work as co-founder and CTO, for clients, and on my own platform.",
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
    statement: "iGaming from the inside: live casino, slots and bet tables, player accounts and wallets, bonuses and tournaments, " +
      "sportsbook and live odds, game aggregation, and regulated platforms for clients.",
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
      },
      {
        name: "Canvas performance",
        detail: "Profiling tools that found the bottlenecks in canvas rendering.",
        places: ["Authentic Gaming"],
      },
      {
        name: "Player accounts and wallets",
        detail: "Accounts, balances and one wallet every bet and win moves through, with deposits and withdrawals under licence.",
        places: ["KPMG", "Authentic Gaming", "My crypto casino"],
      },
      {
        name: "Bonuses and tournaments",
        detail: "Bonus rules with wagering tracked across games, and tournaments with leaderboards and prizes.",
        places: ["KPMG", "My crypto casino"],
      },
      {
        name: "Sportsbook and live odds",
        detail: "Live odds fed in and moving with the match, prices checked as a bet is accepted, and bets settled from results.",
        places: ["KPMG", "My crypto casino"],
      },
      {
        name: "Game aggregation",
        detail: "Games from many studios behind one integration, so an operator adds a studio without new work.",
        places: ["Authentic Gaming", "KPMG", "My crypto casino"],
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
    scope: `From one GitHub account alone, so it is a floor: most of my review work at Conrad, Chiliz, KPMG and Authentic Gaming lived
    in company repositories this cannot see.`,
    squaresLabel: "One square per pull request",
    grids: [
      { label: "Pull requests merged", count: 298 },
      { label: "Pull requests reviewed", count: 520 },
    ],
    activityTitle: "Activity on GitHub",
    activityDescription: `The last three years on my current account, darker for busier days. The two decades before live on earlier
    accounts and in company repositories.`,
    activityYearLabel: "Contributions in {year}, one square per day",
    activity: { ...githubActivity, years: githubActivity.years.slice(-3) },
    highlights: [
      {
        name: "fetchff",
        detail: "An open source HTTP client library. It is not mine: I review its pull requests, 35 so far, and opened one of my own.",
        quote: "I review a library my own platform depends on instead of forking it.",
        points: [
          "Its security hardening release, with full test coverage",
          "React Native support and high throughput performance",
          "SWR support and a React hook",
          "Request deduplication and better polling",
          "Retry with jitter, limited to idempotent methods",
          "Cache revalidation with ETags, and request aborting",
          "Endpoints typed from OpenAPI schemas",
        ],
        link: { label: "fetchff on GitHub", url: "https://github.com/MattCCC/fetchff" },
      },
      {
        name: "Issues I opened",
        detail: "43 issues in other teams' public repositories, from security findings to component specs and bug reports.",
        points: [
          "13 security findings from a code scanning and dependency audit of a desktop game launcher",
          "Prototype pollution, ReDoS, command line injection and CSRF among them",
          "Component specs and fixes for a design system's UI library",
          "A bug report on Prisma running on Cloudflare Workers",
        ],
        link: { label: "My GitHub", url: "https://github.com/red-game-dev" },
      },
      {
        name: "Others",
        detail: "Open source projects and the company codebases I have worked in.",
        points: [],
      },
    ],
  },
  expertise: {
    tileGroups: [
      {
        label: "Money & Web3",
        tiles: [
          {
            name: "Payments and ledgers",
            detail: "Gateways, subscriptions, double entry ledgers, and regulated deposit and withdrawal flows.",
            places: ["Own platform", "KPMG clients", "Gods of Zushin"],
          },
          {
            name: "Banking rails and ramps",
            detail: "Card and bank payments side by side, fiat to crypto and back, and payments paused automatically on fraud signals.",
            places: ["Own platform", "CoinOn"],
          },
          {
            name: "Exchanges and trading",
            detail: "Trading and swaps from one token to another, listing after KYC review and automatic listing on volume.",
            places: ["Chiliz", "CoinOn"],
          },
          {
            name: "Tokens and launchpads",
            detail: "Fan tokens at scale, creator tokens traded against a pegged stablecoin, and NFTs.",
            places: ["Chiliz", "CoinOn", "reNFT"],
          },
          {
            name: "Chains, wallets and indexers",
            detail: "Multi chain apps with wallets, indexers and bridges, and a chain of our own on Substrate.",
            places: ["CoinOn", "HyperPlay", "reNFT", "Chiliz"],
          },
          {
            name: "Virtual economies and loyalty",
            detail: "Currencies earned by taking part, loyalty points, rewards and in game shops.",
            places: ["AMW", "Gods of Zushin", "Punti", "Chiliz"],
          },
        ],
      },
      {
        label: "Platforms & Infrastructure",
        tiles: [
          {
            name: "Adapters and no lock-in",
            detail: "Vendors and hosts behind adapters, so a provider can be added, run in parallel and switched by configuration.",
            places: ["Conrad", "Own platform"],
          },
          {
            name: "DevOps and release",
            detail: "CI/CD with audit logs and rollback, Kubernetes with canary rollout per market, disaster recovery plans and many environments.",
            places: ["Conrad", "CoinOn", "HyperPlay", "Own platform"],
          },
          {
            name: "Security",
            detail: "Custom cryptography and anti tamper, smart contract audits, authorisation reviews and server hardening.",
            places: ["Gods of Zushin", "HyperPlay", "CoinOn", "Own platform"],
          },
          {
            name: "Migrations",
            detail: "Brownfield moves without a big bang: CMS and platform migrations, and an unstable app rebuilt as a V2 core.",
            places: ["Conrad", "KPMG", "Chiliz"],
          },
          {
            name: "Auth and identity",
            detail: "Running an OIDC provider, enterprise single sign on, two factor, and accounts guarded against tampering.",
            places: ["Conrad", "Own platform", "Gods of Zushin"],
          },
          {
            name: "Search",
            detail: "Product search over large catalogues with facets, and search over encrypted fields.",
            places: ["Conrad", "Own platform"],
          },
          {
            name: "Servers run by hand",
            detail: "Game and web servers set up from scratch on dedicated hosts, tuned for latency and cost, before managed cloud.",
            places: ["Gods of Zushin", "AMW"],
          },
          {
            name: "Many markets, one platform",
            detail: "Markets, currencies, languages and tax rules served from one codebase.",
            places: ["Conrad", "Chiliz", "Own platform"],
          },
        ],
      },
      {
        label: "Products & Growth",
        tiles: [
          {
            name: "Social networks and communities",
            detail: "Feeds, profiles, guilds, chat and moderation, grown to millions of members.",
            places: ["AMW", "Own platform", "Gods of Zushin"],
          },
          {
            name: "Recommendations and ranking",
            detail: "Feed suggestions, product suggestions and ads ranked by models that went live.",
            places: ["KPMG clients", "Own platform"],
          },
          {
            name: "Marketplaces and auctions",
            detail: "Auction houses, player trading, and NFT lending and rentals.",
            places: ["AMW", "Gods of Zushin", "reNFT"],
          },
          {
            name: "Ads systems",
            detail: "Self serve ads, ranked placements and the billing behind them.",
            places: ["AMW", "Own platform"],
          },
          {
            name: "Commerce and content",
            detail: "AEM and Strapi for enterprise content, Contentful for clients, and Shopify with plugins of my own.",
            places: ["Conrad", "KPMG clients", "TasteTravellers"],
          },
          {
            name: "Design systems",
            detail: "Shared component libraries that keep brands, products and platforms consistent.",
            places: ["Conrad", "HyperPlay", "Chiliz", "reNFT"],
          },
          {
            name: "Mobile apps",
            detail: "Native and cross platform apps shipped to both stores, from fan tokens to a game launcher.",
            places: ["Chiliz", "CoinOn", "HyperPlay"],
          },
          {
            name: "Products from zero",
            detail: "Ventures founded, built and launched, usually as CEO and CTO.",
            places: ["Gods of Zushin", "AMW", "CoinOn", "Arcavium", "Adotta", "Punti", "My crypto casino"],
          },
        ],
      },
      {
        label: "Games & Real Time",
        tiles: [
          {
            name: "Real time systems",
            detail: "Live game data and streaming over WebSockets, low latency multiplayer and real time feeds.",
            places: ["Authentic Gaming", "Gods of Zushin", "Own platform"],
          },
          {
            name: "Game engines and servers",
            detail: "An MMORPG engine and servers from scratch in C/C++, and a browser game engine in PHP.",
            places: ["Gods of Zushin", "AMW"],
          },
          {
            name: "Launchers and live patching",
            detail: "Launchers that install small, fetch the game and patch only what changed.",
            places: ["Gods of Zushin", "HyperPlay"],
          },
          {
            name: "Canvas, WebGL and heavy animation",
            detail: "Game UI and tables drawn on canvas and WebGL, kept smooth on every screen.",
            places: ["Authentic Gaming", "KPMG", "CoinOn"],
          },
          {
            name: "iGaming",
            detail: "Live dealer UIs, slots and bet tables, operator onboarding, and a crypto casino with a sportsbook of my own.",
            places: ["Authentic Gaming", "KPMG clients", "My crypto casino"],
          },
        ],
      },
      {
        label: "Teams & Delivery",
        tiles: [
          {
            name: "Leading teams",
            detail: "7 product squads and 30+ engineers at Chiliz, 10+ people as co-founder and CTO at CoinOn, architecture across 90+ people at Conrad.",
            places: ["Chiliz", "CoinOn", "Conrad"],
          },
          {
            name: "Architecture governance",
            detail: "Standards, decision records and reviews that many teams build to.",
            places: ["Conrad", "Chiliz"],
          },
          {
            name: "Building teams",
            detail: "Teams hired and grown from nothing: developers, testers, moderators and community.",
            places: ["CoinOn", "Gods of Zushin", "AMW"],
          },
          {
            name: "AI enablement",
            detail: "Agents inside guardrails, plans tracked in artifacts, and test batteries as the proof.",
            places: ["Conrad", "Own platform"],
          },
        ],
      },
    ],
    architectureKindsTitle: "Kinds of architecture I have built",
    architectureKinds: [
      "Full financial systems, fiat and on chain",
      "Double entry ledgers",
      "Sagas across ledgers",
      "Microservices",
      "A modular core behind adapters",
      "Event driven, with an outbox",
      "Backend for frontend and anti corruption layers",
      "Micro frontends",
      "SSR, SSG and edge caching",
      "Offline first, with sync",
      "Real time over WebSockets and SSE",
      "Client and server games for low latency",
      "Multi chain, with bridges and indexers",
      "A chain of our own on Substrate",
      "Monorepos with a shared core",
      "Machine learning pipelines",
    ],
    exampleTitle: "Worked examples",
    exampleDescription: `A full financial system end to end, multi market commerce, my own platform's core and one payment through it, and a ranking
    pipeline. Each is a glance, not the full design.`,
  },
  blueprintLabels,
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
  caseStudies: [
    {
      domain: "architecture",
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
      domain: "architecture",
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
      domain: "architecture",
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
      domain: "architecture",
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
      domain: "architecture",
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
      domain: "architecture",
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
      domain: "payments",
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
      domain: "payments",
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
      domain: "payments",
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
      domain: "payments",
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
      domain: "security",
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
      domain: "ai",
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
    {
      domain: "web3",
      area: "Web3 and mobile",
      title: "Fan tokens for 1.5M+ users in 167 countries",
      summary: ["A fan engagement platform with real time rewards and NFT integrations needed its mobile app to carry on chain features reliably."],
      points: [
        "Delivered proofs of concept and production on chain integrations in the React Native app",
        "Built the V2 core those features run on: routing, error reporting, app lifecycle and reactive state with RxJS",
        "Architecture direction across 7 squads and 30+ engineers",
      ],
      tags: ["Fan tokens", "On chain integrations", "React Native"],
      audiences: ["architecture"],
      industries: ["web3", "sports"],
      loot: "On chain features ride on a stable core, never on a patched one",
    },
    {
      domain: "web3",
      area: "Web3",
      title: "A chain of our own, with bridges",
      summary: ["A Web3 platform for influencers and game publishers needed its whole stack built from zero, chain included."],
      points: [
        "Led the architecture from 0 to 1 across web, mobile, back end, blockchain and infrastructure, with a team of 10+",
        "Cross chain interoperability with custom bridges and indexers across Solana, Polkadot and EVM chains",
        "Moved from Polkadot parachains to a chain of our own in Rust on Substrate",
        "Smart contract safety work on blockchain specific threats",
      ],
      tags: ["Substrate", "Bridges", "Indexers"],
      audiences: ["architecture"],
      industries: ["web3"],
      loot: "A chain cannot be patched casually: CI/CD with audit logs and rollback, and recovery plans before launch",
    },
    {
      domain: "web3",
      area: "Web3",
      title: "NFT lending marketplace V2",
      summary: ["The NFT lending marketplace and its landing page needed a V2 that could keep scaling as the product changed."],
      points: [
        "Built marketplace V2 with the tech lead and owned the V2 landing page from 0 to 1",
        "Refactored major parts of the codebase and wired contract interactions with Wagmi and Ethers",
        "End to end Playwright tests on the critical flows, Storybook with interaction tests, high Lighthouse scores",
      ],
      tags: ["NFT lending", "Wagmi", "Playwright"],
      audiences: ["architecture"],
      industries: ["web3"],
      loot: "Critical flows are tested end to end before they are refactored",
    },
    {
      domain: "igaming",
      area: "Live casino",
      title: "Live casino UI on every screen",
      summary: [
        `A live casino provider streamed tables from land based casinos to operators on mobile, tablet and desktop, and needed the game
        UI and a new mobile app.`,
      ],
      points: [
        "Game UI for desktop and mobile, and the new mobile application",
        "Real time back end logic in Node.js and WebSockets for live game data and streaming",
        "Legacy Backbone code refactored into Redux flows",
        `In the CTO's words: "He had a crucial role in the development of the game UI for the desktop and mobile application enabling AG
        to deliver the most innovative User Experience in the industry."`,
      ],
      tags: ["Live casino", "Real time", "Mobile"],
      audiences: [],
      industries: ["igaming"],
      loot: "One game UI for every screen the operators streamed to",
    },
    {
      domain: "igaming",
      area: "Live casino",
      title: "A bet table on canvas",
      summary: ["A proof of concept for an interactive bet table, drawn on canvas with PixiJS. The repository is public on my GitHub."],
      points: [
        "Built the bet table in PixiJS and presented it to the engineering team and the CTO, feeding future product planning",
        "Profiling tools to find the bottlenecks in canvas rendering",
      ],
      tags: ["PixiJS", "Canvas", "Proof of concept"],
      audiences: [],
      industries: ["igaming"],
      loot: "A working table in front of the CTO, not a slide",
    },
    {
      domain: "igaming",
      area: "Operator tooling",
      title: "Operator onboarding, automated",
      summary: ["Integrating each new casino operator took manual effort."],
      points: [
        "Built internal operator tools that streamlined and automated onboarding and integration of new operators",
        "Less manual effort, and client support that scaled with the number of operators",
      ],
      tags: ["Operator tooling", "Automation"],
      audiences: [],
      industries: ["igaming"],
      loot: "Onboarding that scales with the number of operators",
    },
    {
      domain: "games",
      area: "Game publishing",
      title: "One launcher across web, desktop and mobile",
      summary: ["A Web3 game launcher had to work as a website, a game store, a developer portal, an Electron desktop app and a mobile app."],
      points: [
        "Architecture for the web platform and the Electron desktop app; introduced and architected the React Native mobile app",
        "Lighthouse audits and native C/C++ modules, with profiling that reduced memory use and load times in Electron and on mobile",
        "CLI tools, scaffolders and internal docs for developer experience",
        "Code review across the whole multi stack codebase, from the launcher to the store and the developer portal",
        "Before that, game publishing tools for KPMG clients: content delivery, user management and interactive PixiJS interfaces",
      ],
      tags: ["Electron", "React Native", "Open source"],
      audiences: ["architecture"],
      industries: ["gamePublishing", "web3"],
      loot: "One architecture for every surface a player meets",
    },
    {
      domain: "games",
      area: "Game publishing",
      title: "My MMORPG, from engine to live operations",
      summary: ["Gods of Zushin, built from my studies onward: the engine, the launchers, the payments and the live game."],
      points: [
        "A custom high performance engine in C/C++ with Lua, built for low latency multiplayer and still in use",
        "Own cryptography and compression for client and server traffic, with anti tamper on accounts and inventory",
        "A C# launcher, live patching, moderation tools and analytics dashboards",
        "Stripe and PayPal purchases and subscriptions, and marketing run across social and streaming platforms",
      ],
      tags: ["C/C++", "Lua", "Live operations"],
      audiences: ["architecture"],
      industries: ["gamePublishing"],
      loot: "Owning every layer, from the engine to the community",
    },
    {
      domain: "mobile",
      area: "Mobile architecture",
      title: "An unstable app rebuilt as a V2 core",
      summary: ["I inherited a critically unstable mobile app that 7 squads were building on."],
      points: [
        "Diagnosed the root issues and delivered fixes that restored reliability and performance",
        "Built the V2 core from scratch, with modules shared across mobile and web, a monorepo, component libraries and a design system",
        "Native modules in C/C++, Java and Kotlin, lazy loading and bundle optimisation",
        "Onboarding and architecture documentation for 30+ engineers",
      ],
      tags: ["React Native", "Monorepo", "TDD"],
      audiences: ["architecture"],
      industries: ["web3", "sports"],
      loot: "Test driven, with 95%+ coverage on the frontend and mobile codebases",
    },
    {
      domain: "security",
      area: "Security and operations",
      title: "A bot flood on my game server",
      summary: ["In September 2026 my game's server went down under a flood of connections, most likely bots."],
      points: [
        "Ran a read only assessment of my own public surface with an agent: paths, headers, TLS and subdomains, with no exploitation and no admin actions",
        `Found, in order: the CDN could be bypassed through a published origin address, game services listened on all interfaces, database
        credentials sat in plain text and the origin stack was end of life`,
        "Delivered a hardening runbook in priority order, firewall scripts for Windows and Linux, web server rules and a manual test checklist",
        "Hardened in place to keep costs flat, with a rebuild planned later",
      ],
      tags: ["Security assessment", "Hardening", "DDoS"],
      audiences: ["ai"],
      industries: ["gamePublishing"],
      loot: "Anti cheat is not anti DDoS: a flood that never signs in needs a firewall, not a game rule",
    },
    {
      domain: "security",
      area: "Authorisation",
      title: "Five authorisation findings, fixed at the guard",
      summary: [
        `A background security review on my own platform reported five authorisation findings, three critical and two high, each a way
        for one user to reach another user's data.`,
      ],
      points: [
        "A shortcut that let someone add themselves to a conversation was removed, with an internal path that only works from a verified invite",
        "Reading another user's subscription now fails a service layer check, verified live: another user gets 403, the owner 200",
        "An admin statistics endpoint that assumed an admin now goes through the guard like everywhere else",
      ],
      tags: ["Authorisation", "Guards", "Live verification"],
      audiences: ["architecture"],
      industries: ["social"],
      loot: "Access decisions live in one guard per domain, and every fix is proven through the live endpoint",
    },
  ],
  aiUsage: {
    screen: {
      message: ["33,000+ prompts", "on one machine", "Feb to Oct 2026"],
      label: "At least 33,000 prompts to my main coding agent on one machine alone, February to October 2026. ChatGPT, Gemini, " +
        "other tools, other machines and earlier years are not counted, so the real total is several times higher.",
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
        `About half of all prompts are short steering turns like "continue" or "recheck", which sit outside these rows. The count
        is one coding agent on one machine since February 2026. ChatGPT (much of my architecture research and stakeholder writing),
        Gemini, other tools, other machines and the years before are not in it, so the real total is several times higher.`,
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
