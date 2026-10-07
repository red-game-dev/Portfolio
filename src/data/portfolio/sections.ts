import { PortfolioData } from "@/types/portfolio";

// Every section's title and introduction, with the wording for each view.
export const sectionsContent: Pick<PortfolioData, "sections"> = {
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
};
