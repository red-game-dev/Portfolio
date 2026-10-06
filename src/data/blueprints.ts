import { Blueprint, BlueprintContent } from "@/types/blueprints";

// Kinds of architecture I have built, drawn as a glance, not the full design. No company is named: each is
// the shape of a system, with my role, the scale it was built for and the stack. My own ventures also feed
// the project map's dialogs. No hosts, addresses, versions or amounts, and the platform stays unnamed.

export const GOZ_BLUEPRINT: Blueprint = {
  id: "goz-engine",
  zone: "mmo",
  title: "An MMORPG, from engine to live operations",
  caption: "My own game: an engine in C/C++ with my own framework and physics, a split set of game services, and the web, payments and operations around them.",
  summary: {
    role: "Founder, CEO and CTO: engine, servers, launcher, payments, operations and marketing",
    scale: "8M+ registered accounts, and 50k active players at its peak, before mobile games took the share",
    stack: ["C/C++", "Boost", "ACE", "Own framework", "Lua", "Python", "C#", "Laravel", "Vue", "Cloudflare"],
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "goz-players",
        label: "Players",
        place: { col: 1, row: 1, rowSpan: 2 },
        nodes: [
          { id: "goz-launcher", label: "Launcher", detail: "C#, replaced an Electron one" },
          { id: "goz-client", label: "Game client", detail: "C/C++, own framework and physics" },
          { id: "goz-crypto", label: "Own cryptography", detail: "And compression on the wire", kind: "note" },
        ],
      },
      {
        id: "goz-edge",
        label: "Edge",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "goz-cdn", label: "CDN and WAF", detail: "Website and patches" },
          { id: "goz-firewall", label: "Origin firewall", detail: "Game ports throttled" },
        ],
      },
      {
        id: "goz-web",
        label: "Web",
        place: { col: 2, row: 2 },
        nodes: [
          { id: "goz-site", label: "Website and accounts", detail: "Laravel and Vue" },
          { id: "goz-payments", label: "Payments", detail: "Purchases and subscriptions" },
          { id: "goz-patches", label: "Patch distribution", detail: "Live patching" },
        ],
      },
      {
        id: "goz-game",
        label: "Game services, built for low latency",
        place: { col: 3, row: 1, rowSpan: 2 },
        nodes: [
          { id: "goz-auth", label: "Auth front", detail: "Login throttling" },
          { id: "goz-gate", label: "Gate", detail: "Sessions and routing" },
          { id: "goz-world", label: "Game server", detail: "World logic, Lua and Python scripts" },
          { id: "goz-chat", label: "Chat server" },
          { id: "goz-data", label: "Data server", detail: "Persistence" },
          { id: "goz-admin", label: "Admin server", detail: "Private interface only" },
        ],
      },
      {
        id: "goz-ops",
        label: "Operations",
        place: { col: 4, row: 1 },
        nodes: [
          { id: "goz-gm", label: "Game master panel" },
          { id: "goz-moderation", label: "Moderation tools" },
          { id: "goz-analytics", label: "Analytics dashboards" },
        ],
      },
      {
        id: "goz-storage",
        label: "Storage",
        place: { col: 4, row: 2 },
        nodes: [
          { id: "goz-db", label: "Game database", kind: "store" },
          { id: "goz-webdb", label: "Web database", kind: "store" },
        ],
      },
    ],
    edges: [
      { from: "goz-launcher", to: "goz-cdn", label: "patches" },
      { from: "goz-launcher", to: "goz-client" },
      { from: "goz-client", to: "goz-firewall", label: "encrypted" },
      { from: "goz-firewall", to: "goz-auth" },
      { from: "goz-auth", to: "goz-gate" },
      { from: "goz-gate", to: "goz-world" },
      { from: "goz-world", to: "goz-data" },
      { from: "goz-data", to: "goz-db" },
      { from: "goz-site", to: "goz-payments" },
      { from: "goz-site", to: "goz-webdb" },
      { from: "goz-gm", to: "goz-admin" },
      { from: "goz-moderation", to: "goz-world" },
      { from: "goz-analytics", to: "goz-db" },
    ],
  },
  wireframe: {
    device: "desktop",
    screens: [
      {
        title: "Launcher",
        regions: [
          { kind: "media", label: "News and events", size: 2 },
          { kind: "stat", label: "Patch progress and version" },
          { kind: "actions", label: "Play, account, store, language" },
        ],
      },
      {
        title: "Login and character select",
        regions: [
          { kind: "list", label: "Server pick" },
          { kind: "form", label: "Login, with a throttle notice" },
          { kind: "card", label: "Characters with class and level", size: 1.5 },
          { kind: "actions", label: "Create character" },
        ],
      },
      {
        title: "In game",
        regions: [
          { kind: "bar", label: "Character bars, minimap" },
          { kind: "canvas", label: "The world", size: 3 },
          { kind: "actions", label: "Skill bar and chat tabs" },
        ],
      },
      {
        title: "Web account and shop",
        regions: [
          { kind: "stat", label: "Balance and subscription" },
          { kind: "list", label: "Item packs with price", size: 1.5 },
          { kind: "actions", label: "Buy through a hosted payment page" },
          { kind: "list", label: "Purchase history, redeem a code" },
        ],
      },
    ],
    decision: "Patching, payments, moderation and support all run through tools I built, so a very small team could run a live game for years.",
    outcome: "Started in 2015 and still patched today, with 8M+ registered accounts and 50k active players at its peak.",
  },
  journeys: [
    {
      title: "A new player",
      steps: [
        "Lands on the website and downloads the launcher",
        "The launcher patches the client",
        "Creates an account and picks a server",
        "Creates a character and plays the tutorial and the first quest",
        "Meets the shop at a natural point, not at the door",
      ],
    },
    {
      title: "A returning player after a patch",
      steps: [
        "The launcher sees the new version and patches only what changed",
        "Plays, and an in game notice says what is new",
        "Joins the event the patch brought",
      ],
    },
  ],
};

export const AMW_BLUEPRINT: Blueprint = {
  id: "amw-social",
  zone: "mmo",
  title: "A social network with an economy and an RPG",
  caption: "A social network for anime, manga, cosplay and gaming fans, where taking part earned points that levelled up your own RPG character.",
  summary: {
    role: "Founder, CEO and CTO: the product, the engines and the community",
    scale: "About 10M users, 3M+ of them active",
    stack: ["PHP", "My own PHP and JS frameworks", "Python", "JavaScript", "WebGL and Canvas", "C++", "Lua"],
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "amw-client",
        label: "Browser",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "amw-ui", label: "Web app", detail: "HTML and JavaScript" },
          { id: "amw-gfx", label: "Canvas and WebGL", detail: "Avatars and RPG scenes" },
        ],
      },
      {
        id: "amw-web",
        label: "Web tier",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "amw-lb", label: "Load balancer" },
          { id: "amw-php", label: "PHP application", detail: "Profiles, posts, forums" },
          { id: "amw-py", label: "Python services", detail: "Feeds and jobs" },
          { id: "amw-chat", label: "Chat and presence" },
        ],
      },
      {
        id: "amw-economy",
        label: "Economy",
        place: { col: 3, row: 1 },
        nodes: [
          { id: "amw-points", label: "Points engine", detail: "Earned on interactions" },
          { id: "amw-auction", label: "Auction house", detail: "Virtual items" },
          { id: "amw-ads", label: "Ads system", detail: "Self serve, targeted" },
          { id: "amw-rpg", label: "RPG characters", detail: "Levels and enhancements" },
        ],
      },
      {
        id: "amw-data",
        label: "Data",
        place: { col: 4, row: 1 },
        nodes: [
          { id: "amw-db", label: "Relational database", kind: "store" },
          { id: "amw-cache", label: "Cache", kind: "store" },
          { id: "amw-media", label: "Media storage", detail: "Artwork, cosplay, fan fiction" },
        ],
      },
      {
        id: "amw-engine",
        label: "Game side",
        columns: 2,
        place: { col: 1, row: 2, colSpan: 2 },
        nodes: [
          { id: "amw-gameengine", label: "Own engines", detail: "C++ and Lua" },
          { id: "amw-wire", label: "Own cryptography", detail: "And compression" },
        ],
      },
    ],
    edges: [
      { from: "amw-ui", to: "amw-lb" },
      { from: "amw-lb", to: "amw-php" },
      { from: "amw-php", to: "amw-points" },
      { from: "amw-points", to: "amw-auction" },
      { from: "amw-points", to: "amw-rpg" },
      { from: "amw-php", to: "amw-ads" },
      { from: "amw-php", to: "amw-db" },
      { from: "amw-py", to: "amw-cache" },
      { from: "amw-gfx", to: "amw-gameengine" },
      { from: "amw-gameengine", to: "amw-wire" },
    ],
  },
  wireframe: {
    device: "desktop",
    screens: [
      {
        title: "Feed and profile",
        regions: [
          { kind: "bar", label: "Points balance and level" },
          { kind: "card", label: "Profile with avatar and RPG stats" },
          { kind: "list", label: "Posts, artwork and forum activity", size: 2 },
          { kind: "list", label: "Auctions ending soon, promoted items" },
        ],
      },
      {
        title: "Auction",
        regions: [
          { kind: "media", label: "Item and rarity", size: 1.5 },
          { kind: "stat", label: "Current bid and time left" },
          { kind: "form", label: "Your bid" },
          { kind: "list", label: "Bid history, related items" },
        ],
      },
      {
        title: "Ad manager",
        regions: [
          { kind: "form", label: "Campaign and audience filters", size: 1.5 },
          { kind: "stat", label: "Budget in points or money" },
          { kind: "card", label: "Creative preview" },
          { kind: "list", label: "Results" },
        ],
      },
      {
        title: "Character",
        regions: [
          { kind: "canvas", label: "Avatar scene", size: 2 },
          { kind: "steps", label: "Level and enhancements" },
          { kind: "actions", label: "Equip, or buy an enhancement with points" },
        ],
      },
    ],
    decision: "Every interaction earned points, and points bought enhancements, auction items and promotion, so taking part was the game.",
    outcome: "About 10M users, 3M+ active, on a stack I built mostly myself.",
  },
  journeys: [
    {
      title: "A creator",
      steps: [
        "Posts artwork",
        "Earns points from reactions and comments",
        "Lists an item at auction",
        "Spends the proceeds on a character enhancement",
      ],
    },
    {
      title: "An advertiser",
      steps: [
        "Creates a campaign and picks an audience",
        "Sets a budget in points or money",
        "Watches impressions and clicks, then tops up",
      ],
    },
  ],
};

export const blueprintContent: BlueprintContent = {
  labels: {
    overview: "Overview",
    architecture: "Architecture",
    productFlow: "Product flow",
    decision: "Product decision",
    outcome: "Outcome",
    role: "My role",
    scale: "Built for",
    stack: "Stack",
    journeys: "User journeys",
    glanceNote: "A glance at the architecture, not the full design.",
    sketchNote: "Sketches of the flow, not screenshots of a real product.",
  },
  ai: [
    {
      id: "ai-workflow",
      zone: "ai",
      title: "AI delivery with guardrails",
      caption: "The agent works inside a contract: policy, scoped tools, verification and a person's review. Nothing merges on its own.",
      summary: {
        role: "Designed it, and work inside it every day",
        scale: "My own products, client work and a 90+ person delivery organisation",
        stack: ["Claude Code", "Claude, GPT and Gemini APIs", "MCP servers", "Subagents", "Playwright", "Decision records"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "contract",
            label: "Contract the agent works under",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "policy", label: "Policy", detail: "What AI may touch" },
              { id: "rules", label: "Rules file and skills", detail: "Per repository" },
              { id: "memory", label: "Memory and handoffs" },
              { id: "registers", label: "Decision registers", detail: "Numbered, searched first" },
            ],
          },
          {
            id: "task",
            label: "A task",
            columns: 2,
            place: { col: 2, row: 1 },
            nodes: [
              { id: "agent", label: "Main agent", detail: "Large model", span: 2 },
              { id: "subagents", label: "Subagents", detail: "Read only, small model" },
              { id: "mcp", label: "Scoped tools, MCP", detail: "Staging apart from production" },
            ],
          },
          {
            id: "gates",
            label: "Gates",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "tests", label: "Tests on the real surface", detail: "Never seeded state" },
              { id: "security", label: "Security and supply chain checks" },
              { id: "review", label: "Human review", detail: "Every change" },
            ],
          },
          {
            id: "outcome",
            place: { col: 4, row: 1 },
            nodes: [{ id: "merge", label: "Merge and record" }],
          },
        ],
        edges: [
          { from: "contract", to: "agent" },
          { from: "agent", to: "subagents" },
          { from: "agent", to: "mcp" },
          { from: "agent", to: "tests" },
          { from: "tests", to: "security" },
          { from: "security", to: "review" },
          { from: "review", to: "merge" },
          { from: "merge", to: "registers", label: "recorded", style: "dashed" },
        ],
      },
      journeys: [
        {
          title: "A change, from request to merge",
          steps: [
            "A task arrives with its acceptance criteria",
            "The agent reads the rules, the skills and the decision registers first",
            "Read only subagents research in parallel on a small model",
            "The change is made with scoped tools, with staging kept apart from production",
            "Tests run on the real surface, then security and supply chain checks",
            "A person reviews every change before it merges",
            "The decision is recorded for the next session",
          ],
        },
      ],
    },
  ],
  chain: [
    {
      id: "fan-token-app",
      zone: "chain",
      title: "A fan token app",
      caption: "Each club has its own token, bought with the platform's base token, inside a mobile app rebuilt as one core that many squads ship on.",
      summary: {
        role: "Mobile core architect across seven product squads",
        scale: "1M+ users in 160+ countries",
        stack: ["React Native", "TypeScript", "RxJS", "Redux Observables", "Ethers", "Kotlin", "Java", "C/C++", "Jest"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "fan-core",
            label: "Mobile app, one shared core",
            columns: 2,
            place: { col: 1, row: 1, colSpan: 2 },
            nodes: [
              { id: "fan-routing", label: "Routing" },
              { id: "fan-lifecycle", label: "App lifecycle", detail: "Back press, resume" },
              { id: "fan-errors", label: "Error reporting" },
              { id: "fan-design", label: "Design system", detail: "Component library" },
              { id: "fan-native", label: "Native modules", detail: "C/C++, Java, Kotlin" },
              { id: "fan-state", label: "Reactive state", detail: "RxJS orchestration" },
            ],
          },
          {
            id: "fan-wallet",
            label: "In app wallet",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "fan-topup", label: "Top up", detail: "The base token" },
              { id: "fan-balances", label: "Balances", detail: "Base and club tokens" },
            ],
          },
          {
            id: "fan-actions",
            label: "On chain actions",
            place: { col: 4, row: 1 },
            nodes: [
              { id: "fan-buy", label: "Buy a club token", detail: "Paid in the base token" },
              { id: "fan-claim", label: "Claim a reward", detail: "Contract call" },
            ],
          },
          {
            id: "fan-team",
            place: { col: 1, row: 2 },
            nodes: [
              { id: "fan-squads", label: "Seven product squads", detail: "Build on the core" },
              { id: "fan-tdd", label: "Test first", detail: "95%+ coverage", kind: "note" },
            ],
          },
          {
            id: "fan-backend",
            label: "Back end",
            columns: 2,
            place: { col: 2, row: 2, colSpan: 2 },
            nodes: [
              { id: "fan-indexer", label: "Indexer", detail: "Confirms from the chain, not the client" },
              { id: "fan-services", label: "Back end services" },
              { id: "fan-rewards", label: "Real time rewards", detail: "And notifications", span: 2 },
            ],
          },
          {
            id: "fan-chain",
            label: "Chain",
            place: { col: 4, row: 2 },
            nodes: [{ id: "fan-contracts", label: "Token contracts", detail: "One token per club", kind: "store" }],
          },
        ],
        edges: [
          { from: "fan-squads", to: "fan-core" },
          { from: "fan-tdd", to: "fan-core", style: "link" },
          { from: "fan-state", to: "fan-wallet" },
          { from: "fan-topup", to: "fan-balances" },
          { from: "fan-balances", to: "fan-buy", label: "base token" },
          { from: "fan-buy", to: "fan-contracts" },
          { from: "fan-claim", to: "fan-contracts" },
          { from: "fan-contracts", to: "fan-indexer" },
          { from: "fan-indexer", to: "fan-services" },
          { from: "fan-services", to: "fan-rewards" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Club home",
            regions: [
              { kind: "stat", label: "Base token balance" },
              { kind: "list", label: "Club tokens held", size: 1.6 },
              { kind: "card", label: "Rewards waiting" },
              { kind: "actions", label: "Buy, claim", size: 0.8 },
            ],
          },
          {
            title: "Top up",
            regions: [
              { kind: "stat", label: "Amount in base token" },
              { kind: "form", label: "Payment method", size: 1.4 },
              { kind: "actions", label: "Top up", size: 0.8 },
            ],
          },
          {
            title: "Buy a club token",
            regions: [
              { kind: "card", label: "Club token, priced in base token" },
              { kind: "form", label: "Amount" },
              { kind: "bar", label: "Fee and total", size: 0.7 },
              { kind: "actions", label: "Buy", size: 0.8 },
            ],
          },
          {
            title: "Pending on chain",
            regions: [
              { kind: "overlay", label: "Pending, with a clear status", size: 2 },
              { kind: "bar", label: "Confirmed from the indexer", size: 0.7 },
              { kind: "bar", label: "An error state if it fails", size: 0.7 },
            ],
          },
          {
            title: "Claim a reward",
            regions: [
              { kind: "card", label: "The reward", size: 1.4 },
              { kind: "steps", label: "Pending, then confirmed" },
              { kind: "actions", label: "Claim", size: 0.8 },
            ],
          },
        ],
        decision: "Each club has its own token, bought with the platform's base token, and every on chain step has its own " +
          "pending and error state inside an ordinary app flow.",
        outcome: "A critically unstable app became one core seven squads ship on, with on chain features in production for 1M+ users.",
      },
      journeys: [
        {
          title: "A fan buys a club token",
          steps: [
            "Opens the club home and sees the base token balance",
            "Tops up the base token",
            "Buys the club token, paying in the base token",
            "Sees a pending state while the contract call settles",
            "The balance updates once the indexer confirms it",
          ],
        },
        {
          title: "A fan claims a reward",
          steps: [
            "A real time reward arrives as a notification",
            "Opens it and claims",
            "The claim is a contract call, shown as pending",
            "Confirmed from the chain, never from the client",
          ],
        },
      ],
    },
    {
      id: "creator-launchpad",
      zone: "chain",
      title: "A creator coin launchpad on its own stablecoin",
      caption: "A pegged stablecoin underneath, creator coins on top that only ever trade against it, priced on a curve, with NFTs and engagement rewards around them.",
      summary: {
        role: "CTO: architecture from zero across web, mobile, back end and chain, with a team of 10+",
        scale: "Influencers and creators launching coins for their fans, built from zero",
        stack: ["Rust", "Substrate", "Solidity", "Node.js", "Flutter", "Next.js", "Nuxt", "PixiJS", "AWS"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "lp-clients",
            label: "Clients",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "lp-app", label: "Mobile app", detail: "Flutter" },
              { id: "lp-web", label: "Web app", detail: "Animated canvas fronts" },
              { id: "lp-sdk", label: "Partner SDKs and APIs" },
            ],
          },
          {
            id: "lp-services",
            label: "Services",
            columns: 2,
            place: { col: 2, row: 1, colSpan: 2 },
            nodes: [
              { id: "lp-gateway", label: "API gateway", span: 2 },
              { id: "lp-kyc", label: "Identity and KYC gate" },
              { id: "lp-launch", label: "Coin launch", detail: "Price on a curve" },
              { id: "lp-trade", label: "Trade", detail: "Only against the stablecoin" },
              { id: "lp-nft", label: "NFTs", detail: "Minted for fans" },
              { id: "lp-engage", label: "Engagement rewards" },
              { id: "lp-onramp", label: "Fiat on ramp", detail: "Into the stablecoin" },
            ],
          },
          {
            id: "lp-chain",
            label: "Chain",
            place: { col: 4, row: 1 },
            nodes: [
              { id: "lp-stable", label: "Stablecoin", detail: "Pegged, under every coin", kind: "store" },
              { id: "lp-coins", label: "Creator coins", detail: "Paired with the stablecoin" },
              { id: "lp-own", label: "Own chain", detail: "Rust on Substrate" },
              { id: "lp-bridges", label: "Bridges and indexers", detail: "Solana, Polkadot, EVM" },
            ],
          },
          {
            id: "lp-ops",
            label: "Operations",
            columns: 4,
            place: { col: 1, row: 2, colSpan: 4 },
            nodes: [
              { id: "lp-ci", label: "CI/CD", detail: "Audit logs, rollback" },
              { id: "lp-recovery", label: "Disaster recovery" },
              { id: "lp-compliance", label: "Compliance research" },
              { id: "lp-kpis", label: "Analytics and KPIs" },
            ],
          },
        ],
        edges: [
          { from: "lp-clients", to: "lp-gateway" },
          { from: "lp-gateway", to: "lp-kyc" },
          { from: "lp-launch", to: "lp-coins" },
          { from: "lp-trade", to: "lp-stable" },
          { from: "lp-onramp", to: "lp-trade" },
          { from: "lp-stable", to: "lp-coins", style: "link" },
          { from: "lp-coins", to: "lp-own" },
          { from: "lp-own", to: "lp-bridges", style: "link" },
          { from: "lp-ops", to: "lp-services", style: "dashed" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Launch a coin",
            regions: [
              { kind: "form", label: "Name, symbol, image", size: 1.4 },
              { kind: "card", label: "Curve preview, priced in the stablecoin" },
              { kind: "bar", label: "Fees shown up front", size: 0.7 },
              { kind: "actions", label: "Launch", size: 0.8 },
            ],
          },
          {
            title: "Coin page",
            regions: [
              { kind: "canvas", label: "Price on the curve", size: 1.6 },
              { kind: "stat", label: "Holders and supply" },
              { kind: "list", label: "Creator feed and NFT drops" },
              { kind: "actions", label: "Buy, sell", size: 0.8 },
            ],
          },
          {
            title: "Buy",
            regions: [
              { kind: "stat", label: "Amount in the stablecoin" },
              { kind: "bar", label: "Slippage and fee", size: 0.7 },
              { kind: "bar", label: "Top up from fiat if short", size: 0.7 },
              { kind: "actions", label: "Confirm once", size: 0.8 },
            ],
          },
          {
            title: "Portfolio",
            regions: [
              { kind: "stat", label: "Stablecoin balance" },
              { kind: "list", label: "Creator coins and NFTs held", size: 1.6 },
              { kind: "card", label: "Rewards from engagement" },
            ],
          },
        ],
        decision: "Every coin trades only against a pegged stablecoin, so prices read in one steady unit and fans never juggle pairs across chains.",
        outcome: "Creators launch coins and NFTs for their fans without arranging liquidity or pairs themselves, on a stack built from zero.",
      },
      journeys: [
        {
          title: "A creator",
          steps: [
            "Signs up and passes verification",
            "Launches a coin, priced on a curve in the stablecoin",
            "Shares the link and sees the first fans buy",
            "Drops an NFT and unlocks a reward for holders",
          ],
        },
        {
          title: "A fan",
          steps: [
            "Tops up the stablecoin from fiat",
            "Discovers a creator and buys their coin",
            "Holds it, collects their NFTs and claims engagement rewards",
          ],
        },
      ],
    },
    {
      id: "nft-lending",
      zone: "chain",
      title: "An NFT lending marketplace",
      caption: "Owners rent out NFTs, renters borrow them for games, and the marketplace reads everything from an indexer so the interface never guesses.",
      summary: {
        role: "Senior frontend engineer on marketplace V2, owner of the V2 landing page",
        scale: "A lending protocol with game integrations",
        stack: ["Next.js", "React", "TypeScript", "Wagmi", "Ethers", "The Graph", "Radix UI", "Storybook", "Playwright"],
      },
      architecture: {
        columns: 3,
        groups: [
          {
            id: "nft-people",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "nft-owner", label: "Owner", kind: "actor" },
              { id: "nft-renter", label: "Renter", kind: "actor" },
            ],
          },
          {
            id: "nft-web",
            label: "Marketplace web",
            columns: 2,
            place: { col: 2, row: 1 },
            nodes: [
              { id: "nft-list", label: "List for rent", detail: "Price, duration, collateral" },
              { id: "nft-browse", label: "Browse and filter" },
              { id: "nft-landing", label: "Landing page" },
              { id: "nft-rent", label: "Rent", detail: "Through the wallet" },
              { id: "nft-design", label: "Design system", detail: "Radix, Storybook tests", span: 2 },
            ],
          },
          {
            id: "nft-chain",
            label: "Chain",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "nft-wallet", label: "Wallet", detail: "Wagmi and Ethers" },
              { id: "nft-contracts", label: "Lending contracts", kind: "store" },
              { id: "nft-graph", label: "Indexer", detail: "Subgraph" },
            ],
          },
          {
            id: "nft-api",
            label: "Back end",
            place: { col: 2, row: 2 },
            nodes: [{ id: "nft-marketapi", label: "Marketplace API", detail: "GraphQL" }],
          },
          {
            id: "nft-around",
            place: { col: 3, row: 2 },
            nodes: [
              { id: "nft-games", label: "Game integrations" },
              { id: "nft-e2e", label: "End to end tests", detail: "On the critical flows", kind: "note" },
            ],
          },
        ],
        edges: [
          { from: "nft-owner", to: "nft-list" },
          { from: "nft-renter", to: "nft-browse" },
          { from: "nft-rent", to: "nft-wallet" },
          { from: "nft-wallet", to: "nft-contracts" },
          { from: "nft-contracts", to: "nft-graph" },
          { from: "nft-graph", to: "nft-marketapi" },
          { from: "nft-marketapi", to: "nft-web" },
          { from: "nft-games", to: "nft-contracts" },
          { from: "nft-e2e", to: "nft-web", style: "link" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Browse",
            regions: [
              { kind: "bar", label: "Filters and collections", size: 0.7 },
              { kind: "list", label: "NFTs with price and duration", size: 2 },
            ],
          },
          {
            title: "Listing",
            regions: [
              { kind: "media", label: "The NFT", size: 1.6 },
              { kind: "list", label: "Price, duration, collateral" },
              { kind: "actions", label: "Rent", size: 0.8 },
            ],
          },
          {
            title: "Rent",
            regions: [
              { kind: "overlay", label: "Confirm in the wallet", size: 1.6 },
              { kind: "bar", label: "Pending, then confirmed", size: 0.7 },
            ],
          },
          {
            title: "My rentals",
            regions: [
              { kind: "list", label: "Active rentals", size: 1.6 },
              { kind: "bar", label: "Time left", size: 0.7 },
              { kind: "actions", label: "Return", size: 0.8 },
            ],
          },
        ],
        decision: "The marketplace reads state from an indexer, so the interface never guesses what the chain holds.",
        outcome: "V2 shipped with end to end tests on the critical flows, Storybook interaction tests and high Lighthouse scores.",
      },
      journeys: [
        {
          title: "A renter",
          steps: ["Browses by collection", "Picks an NFT and its terms", "Rents it through the wallet", "Uses it in a game", "Returns it at expiry"],
        },
        {
          title: "An owner",
          steps: ["Lists an NFT with price, duration and collateral", "Sees it rented", "Gets it back, or claims the collateral at expiry"],
        },
      ],
    },
  ],
  platform: [
    {
      id: "financial-system",
      zone: "matrix",
      title: "A full financial system, end to end, Web2 and Web3",
      caption: "From onboarding and KYC to payments in, multi currency wallets on double entry ledgers, payouts under dual " +
        "approval and reconciliation, with a stablecoin, custody and chains on the same rails.",
      summary: {
        role: "Architect of the money stack end to end, from onboarding to reconciliation",
        scale: "Multi currency, multi jurisdiction, fiat and on chain, designed for enterprise volume",
        stack: ["TypeScript", "NestJS", "PostgreSQL", "Stripe", "Double entry ledgers", "Sagas", "Solidity", "Ethers", "Rust", "Substrate"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "fin-channels",
            label: "Channels",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "fin-web", label: "Web and mobile apps" },
              { id: "fin-partners", label: "Partner API" },
              { id: "fin-office", label: "Back office", detail: "Roles and permissions" },
            ],
          },
          {
            id: "fin-identity",
            label: "Identity and compliance",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "fin-kyc", label: "KYC verification" },
              { id: "fin-guards", label: "Guards per domain", detail: "Who may act for whom" },
              { id: "fin-rules", label: "Jurisdiction rules", detail: "Tax, refunds, limits per region" },
            ],
          },
          {
            id: "fin-in",
            label: "Money in",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "fin-cards", label: "Card gateway adapter", detail: "Tokenised, provider agnostic" },
              { id: "fin-local", label: "Local payment methods", detail: "Routed with risk checks and fallback" },
              { id: "fin-subs", label: "Plans and subscriptions", detail: "Multi provider pricing" },
            ],
          },
          {
            id: "fin-web3",
            label: "Web3 rails",
            place: { col: 4, row: 1, rowSpan: 2 },
            nodes: [
              { id: "fin-connected", label: "Connected wallets", detail: "Sign in with Ethereum" },
              { id: "fin-stable", label: "Stablecoin", detail: "Pegged settlement unit", kind: "store" },
              { id: "fin-tokens", label: "Token contracts", detail: "Tokenisation and staking" },
              { id: "fin-bridges", label: "Bridges and indexers", detail: "Across chains" },
            ],
          },
          {
            id: "fin-core",
            label: "Core ledger",
            columns: 2,
            place: { col: 1, row: 2, colSpan: 2 },
            nodes: [
              { id: "fin-ledger", label: "Double entry ledgers", detail: "Fiat and credits, append only", kind: "store", span: 2 },
              { id: "fin-wallets", label: "Wallets", detail: "Available, pending, held" },
              { id: "fin-fx", label: "Exchange rates", detail: "Multi currency" },
              { id: "fin-saga", label: "Ledger crossing saga", detail: "Self healing" },
              { id: "fin-idem", label: "Idempotency", detail: "One effect per event", kind: "decision" },
            ],
          },
          {
            id: "fin-out",
            label: "Money out and controls",
            place: { col: 3, row: 2 },
            nodes: [
              { id: "fin-withdraw", label: "Withdrawals", detail: "Installments" },
              { id: "fin-holds", label: "Holds", detail: "A second admin above a threshold" },
              { id: "fin-recon", label: "Reconciliation and integrity sweeps" },
              { id: "fin-audit", label: "Audit trail", detail: "Partitioned" },
            ],
          },
        ],
        edges: [
          { from: "fin-channels", to: "fin-identity" },
          { from: "fin-identity", to: "fin-in" },
          { from: "fin-in", to: "fin-ledger" },
          { from: "fin-ledger", to: "fin-wallets" },
          { from: "fin-saga", to: "fin-wallets" },
          { from: "fin-wallets", to: "fin-withdraw" },
          { from: "fin-holds", to: "fin-withdraw" },
          { from: "fin-recon", to: "fin-ledger", style: "dashed" },
          { from: "fin-connected", to: "fin-stable" },
          { from: "fin-stable", to: "fin-ledger", label: "settles" },
          { from: "fin-tokens", to: "fin-bridges", style: "link" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Onboarding",
            regions: [
              { kind: "form", label: "Account and country", size: 1.2 },
              { kind: "steps", label: "Identity checks, step by step" },
              { kind: "actions", label: "Verify", size: 0.8 },
            ],
          },
          {
            title: "Wallet",
            regions: [
              { kind: "stat", label: "Available, pending, held" },
              { kind: "list", label: "Fiat and stablecoin balances", size: 1.2 },
              { kind: "list", label: "Events, each saying why", size: 1.2 },
            ],
          },
          {
            title: "Add money",
            regions: [
              { kind: "list", label: "Card, local method or a connected wallet", size: 1.4 },
              { kind: "bar", label: "Fees and the rate up front", size: 0.7 },
              { kind: "actions", label: "Pay once", size: 0.8 },
            ],
          },
          {
            title: "Withdraw",
            regions: [
              { kind: "stat", label: "Amount and currency" },
              { kind: "bar", label: "Installments, and the threshold rule", size: 0.7 },
              { kind: "overlay", label: "Waiting for a second approval", size: 1.2 },
            ],
          },
          {
            title: "Back office hold",
            regions: [
              { kind: "card", label: "Amount, reason, created by" },
              { kind: "actions", label: "Approve, never by the hold's own creator", size: 0.8 },
              { kind: "list", label: "Audit trail", size: 1.2 },
            ],
          },
        ],
        decision: "Every movement is two balancing ledger rows, every request is idempotent, and money above a threshold needs a " +
          "second person, whether it moves as fiat or on chain.",
        outcome: "A retry cannot pay twice, balances explain themselves, drift is caught by reconciliation, and the same rules " +
          "hold across currencies, regions and chains.",
      },
      journeys: [
        {
          title: "A customer",
          steps: [
            "Signs up and passes KYC for their country",
            "Adds money by card, a local method or a connected wallet",
            "Sees it pending, then available, with the reason for each change",
            "Converts at a shown rate and withdraws in installments",
          ],
        },
        {
          title: "Operations",
          steps: [
            "A withdrawal above the threshold is held",
            "A second admin approves it",
            "Reconciliation confirms the ledger against the provider and the chain",
          ],
        },
      ],
    },
    {
      id: "multi-market-commerce",
      zone: "matrix",
      title: "Multi market headless commerce",
      caption: "One storefront and two content sources behind one adapter, switched country by country, so a legacy system retires market by market.",
      summary: {
        role: "Lead software architect across a 90+ person delivery organisation",
        scale: "More than a dozen country storefronts and millions of sessions a month",
        stack: ["Nuxt", "Vue", "TypeScript", "Headless CMS", "PostgreSQL", "OpenFeature", "Istio", "Varnish", "Cloudflare Workers", "C4 model"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "mm-edge",
            label: "Edge",
            place: { col: 1, row: 1, rowSpan: 2 },
            nodes: [
              { id: "mm-shopper", label: "Shopper", kind: "actor" },
              { id: "mm-cdn", label: "CDN and WAF", detail: "Edge cache per country zone" },
              { id: "mm-origin", label: "Origin cache" },
            ],
          },
          {
            id: "mm-store",
            label: "Storefront, SSR",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "mm-client", label: "Browser client", detail: "Hydration" },
              { id: "mm-ssr", label: "Server runtime", detail: "SSR and BFF routes" },
              { id: "mm-adapter", label: "Content adapter", detail: "One typed contract" },
              { id: "mm-flags", label: "Flag SDK", detail: "Provider per country" },
            ],
          },
          {
            id: "mm-commerce",
            label: "Commerce domains, untouched",
            columns: 3,
            place: { col: 2, row: 2 },
            nodes: [
              { id: "mm-checkout", label: "Checkout" },
              { id: "mm-product", label: "Product" },
              { id: "mm-search", label: "Search" },
            ],
          },
          {
            id: "mm-cms",
            label: "New CMS",
            columns: 2,
            place: { col: 3, row: 1 },
            nodes: [
              { id: "mm-headless", label: "Headless CMS", detail: "REST API; publishing bans the cache", span: 2 },
              { id: "mm-db", label: "PostgreSQL", detail: "Managed", kind: "store" },
              { id: "mm-preview", label: "Editor preview", detail: "Viewport, audience, market" },
            ],
          },
          {
            id: "mm-legacy",
            label: "Legacy, runs in parallel",
            isExternal: true,
            place: { col: 3, row: 2 },
            nodes: [{ id: "mm-old", label: "Legacy CMS", detail: "Retires market by market" }],
          },
          {
            id: "mm-rollout",
            label: "Rollout and governance",
            place: { col: 4, row: 1, rowSpan: 2 },
            nodes: [
              { id: "mm-relay", label: "Flag relay", detail: "Per country rollout" },
              { id: "mm-mesh", label: "Service mesh routing", detail: "Markets migrate on their own" },
              { id: "mm-watch", label: "Monitoring and rollback" },
              { id: "mm-records", label: "Decision records", detail: "Numbered ADRs, C4 set" },
            ],
          },
        ],
        edges: [
          { from: "mm-shopper", to: "mm-cdn" },
          { from: "mm-cdn", to: "mm-origin" },
          { from: "mm-origin", to: "mm-ssr" },
          { from: "mm-ssr", to: "mm-client" },
          { from: "mm-ssr", to: "mm-adapter" },
          { from: "mm-flags", to: "mm-adapter" },
          { from: "mm-store", to: "mm-commerce" },
          { from: "mm-adapter", to: "mm-headless", label: "new" },
          { from: "mm-adapter", to: "mm-old", label: "legacy" },
          { from: "mm-headless", to: "mm-db" },
          { from: "mm-headless", to: "mm-preview" },
          { from: "mm-relay", to: "mm-cms", style: "dashed" },
        ],
      },
      wireframe: {
        device: "desktop",
        screens: [
          {
            title: "Page editor with live preview",
            regions: [
              { kind: "bar", label: "Page title, locale switch, publish state", area: "header" },
              { kind: "list", label: "Blocks in order, each with a target: market, audience, viewport", area: "left" },
              { kind: "media", label: "Preview: viewport, audience, market", area: "main" },
              { kind: "form", label: "Fields for the selected block, and how it renders", area: "right" },
              { kind: "actions", label: "Save, copy across locales", area: "footer" },
            ],
          },
          {
            title: "Market rollout",
            regions: [
              { kind: "bar", label: "Markets and their content source" },
              { kind: "list", label: "Each market: source, flag state, health", size: 2.4 },
              { kind: "actions", label: "Roll a market forward or back" },
            ],
          },
        ],
        decision: "Targeting is set per block, not per page, and each market moves to the new CMS on its own flag, so a rollback is a flag flip.",
        outcome: "One page serves several markets and audiences, markets migrate independently under monitoring, and a phone " +
          "preview inside a desktop editor renders as a real phone would.",
      },
      journeys: [
        {
          title: "An editor publishes a targeted page",
          steps: [
            "Composes the page from blocks, each targeted by market, audience and viewport",
            "Previews every variant in the editor",
            "Publishes, and the cache for that page is banned",
            "The next visit in that market renders the new content",
          ],
        },
        {
          title: "A market moves to the new CMS",
          steps: ["The market's flag flips to the new source", "Monitoring watches errors and speed", "If anything is off, the flag flips back in seconds"],
        },
      ],
    },
    {
      id: "platform-core",
      zone: "matrix",
      title: "My platform: a core behind adapters",
      caption: "One core package holds the business logic and the apps are thin shells. Every vendor and host sits behind an " +
        "adapter, so a provider can be added, run in parallel and switched by configuration.",
      summary: {
        role: "Founder, CEO and CTO, and its architect",
        scale: "Designed for enterprise volume from the first line",
        stack: ["TypeScript", "NestJS", "Next.js", "PostgreSQL", "Supabase", "Redis", "Stripe", "Cloudflare R2", "Vitest", "Playwright"],
      },
      architecture: {
        columns: 1,
        groups: [
          {
            id: "platform-apps",
            label: "Apps, thin shells",
            columns: 4,
            place: { col: 1, row: 1 },
            nodes: [
              { id: "consumer-web", label: "Consumer web app", detail: "PWA, offline first" },
              { id: "public-api", label: "Public API", detail: "NestJS" },
              { id: "admin-api", label: "Admin API", detail: "NestJS" },
              { id: "back-office", label: "Back office" },
            ],
          },
          {
            id: "platform-core-group",
            label: "Domain core, plain TypeScript",
            columns: 4,
            place: { col: 1, row: 2 },
            nodes: [
              { id: "scheduler", label: "Scheduler", detail: "Postgres backed jobs" },
              { id: "domain", label: "Domain services", detail: "One guard per domain", span: 2 },
              { id: "events", label: "Event bus", detail: "Real time over SSE" },
              { id: "engines", label: "Engines and registries", detail: "Feed, ads, credits, moderation, flags, outbox", span: 4 },
            ],
          },
          {
            id: "platform-adapters",
            label: "37 adapter contracts",
            columns: 4,
            place: { col: 1, row: 3 },
            nodes: [
              { id: "seam-payments", label: "Payments", detail: "Stripe gateway, tax and FX providers" },
              { id: "seam-storage", label: "Storage and media", detail: "Cloudflare R2, Supabase, scanning" },
              { id: "seam-database", label: "Database", detail: "Drizzle, Supabase, SQL, IndexedDB" },
              { id: "seam-auth", label: "Auth", detail: "OAuth, OIDC, passwordless" },
              { id: "seam-notifications", label: "Notifications", detail: "Email, SMS and push" },
              { id: "seam-cms", label: "CMS", detail: "Strapi, Contentful, Sanity, Storyblok" },
              { id: "seam-ads", label: "Ads", detail: "Own network, external slots" },
              { id: "seam-moderation", label: "Moderation", detail: "Four provider adapters" },
              { id: "seam-realtime", label: "Real time", detail: "SSE, WebSocket, Redis backplane" },
              { id: "seam-flags", label: "Feature flags", detail: "API, database, file, memory, Redis" },
              { id: "seam-hosts", label: "Hosts", detail: "Deploy targets, env vars, source control" },
              { id: "seam-frameworks", label: "Frameworks", detail: "NestJS and Next.js adapters" },
            ],
          },
        ],
        edges: [
          { from: "consumer-web", to: "public-api" },
          { from: "back-office", to: "admin-api" },
          { from: "public-api", to: "domain" },
          { from: "admin-api", to: "domain" },
          { from: "scheduler", to: "domain" },
          { from: "domain", to: "events" },
          { from: "domain", to: "engines" },
          { from: "platform-core-group", to: "platform-adapters", label: "only through contracts" },
        ],
      },
    },
    {
      id: "platform-money",
      zone: "matrix",
      title: "My platform: one payment, step by step",
      caption: "A payment is booked twice on purpose, as two balancing ledger rows under one correlation id, and every step " +
        "can be retried safely. Money paths are tested through the real API, on synthetic data at real volume.",
      summary: {
        role: "Founder, CEO and CTO, and its architect",
        scale: "Payments, payouts and holds across jurisdictions, in several currencies",
        stack: ["TypeScript", "NestJS", "PostgreSQL", "Stripe", "Double entry ledger", "Idempotency keys", "Supertest", "Playwright"],
      },
      architecture: {
        columns: 1,
        groups: [
          {
            id: "money-payment",
            label: "Payment",
            columns: 4,
            place: { col: 1, row: 1 },
            nodes: [
              { id: "checkout", label: "Checkout", detail: "Idempotency key, jurisdiction snapshot" },
              { id: "gateway", label: "Gateway adapter", detail: "Provider agnostic, Stripe today" },
              { id: "provider", label: "Payment provider", detail: "Tokenised card only" },
              { id: "webhook", label: "Webhook verifier", detail: "Verified before anything moves, replays rejected" },
            ],
          },
          {
            id: "money-booking",
            label: "Booking",
            columns: 4,
            place: { col: 1, row: 2 },
            nodes: [
              { id: "tax-fx", label: "Tax and FX", detail: "Tax per region and provider based FX, behind contracts", kind: "note" },
              { id: "ledger-rows", label: "Two ledger rows", detail: "Debit and credit, one correlation id", kind: "store" },
              { id: "ledger", label: "Double entry ledger", detail: "Every movement balanced" },
              { id: "idempotent", label: "Idempotent handler", detail: "A repeat returns the prior result", kind: "decision" },
            ],
          },
          {
            id: "money-views",
            label: "Views and controls",
            columns: 4,
            place: { col: 1, row: 3 },
            nodes: [
              { id: "reconcile", label: "Reconciliation", detail: "Ledger checked against the provider" },
              { id: "balance", label: "Balance view", detail: "Available minus pending minus held" },
              { id: "holds", label: "Payout holds", detail: "A second admin above a threshold" },
              { id: "treasury", label: "Treasury accrual", detail: "Idempotent" },
            ],
          },
        ],
        edges: [
          { from: "checkout", to: "gateway" },
          { from: "gateway", to: "provider" },
          { from: "provider", to: "webhook" },
          { from: "webhook", to: "idempotent" },
          { from: "idempotent", to: "ledger", label: "first time" },
          { from: "ledger", to: "ledger-rows" },
          { from: "tax-fx", to: "checkout" },
          { from: "ledger-rows", to: "balance" },
          { from: "ledger", to: "treasury" },
          { from: "holds", to: "balance" },
          { from: "reconcile", to: "ledger-rows", label: "drift", style: "dashed" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Campaign",
            regions: [
              { kind: "media", label: "Story", size: 1.4 },
              { kind: "steps", label: "Milestones with status" },
              { kind: "stat", label: "Progress", size: 0.8 },
              { kind: "actions", label: "Contribute", size: 0.8 },
            ],
          },
          {
            title: "Amount and method",
            regions: [
              { kind: "stat", label: "Amount in your currency" },
              { kind: "bar", label: "Base currency underneath", size: 0.7 },
              { kind: "form", label: "Card entry by the provider", size: 1.4 },
              { kind: "actions", label: "Continue", size: 0.8 },
            ],
          },
          {
            title: "Confirm",
            regions: [
              { kind: "list", label: "Fee breakdown" },
              { kind: "list", label: "What happens at each milestone", size: 1.4 },
              { kind: "actions", label: "Submit once", size: 0.8 },
            ],
          },
          {
            title: "Receipt",
            regions: [
              { kind: "card", label: "Contribution recorded" },
              { kind: "bar", label: "Balance event in the wallet", size: 0.7 },
              { kind: "steps", label: "Milestone progress updated" },
              { kind: "bar", label: "Guests need only an email", size: 0.7 },
            ],
          },
        ],
        decision: "Money is released per verified milestone, not up front, and each contribution is written to a double entry ledger with an idempotency key.",
        outcome: "A retry or a double click cannot charge twice, payouts wait for KYC and a verified milestone, and the flow is " +
          "tested end to end through the real endpoints.",
      },
      journeys: [
        {
          title: "A fan contributes",
          steps: [
            "Picks an amount in their own currency",
            "Sees the base currency equivalent",
            "Pays once, however often they click",
            "Gets a receipt and a balance event",
          ],
        },
        {
          title: "A creator is paid",
          steps: ["Passes KYC", "Reaches a verified milestone", "Receives the payout in installments"],
        },
      ],
    },
    {
      id: "ml-ranking",
      zone: "matrix",
      title: "Recommendations and feed ranking",
      caption: "Signals feed a model, the model scores candidates, and the feed, the suggestions and the ads are ranked by one scoring service.",
      summary: {
        role: "Technical lead for client projects: built the models and took them live",
        scale: "Client products in production",
        stack: ["TensorFlow", "Python", "Feature pipelines", "Model serving"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "ml-signals",
            label: "Signals",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "ml-views", label: "Views and clicks" },
              { id: "ml-follows", label: "Follows and reactions" },
              { id: "ml-adsignals", label: "Ad interactions" },
            ],
          },
          {
            id: "ml-training",
            label: "Training",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "ml-features", label: "Feature pipeline" },
              { id: "ml-train", label: "Training", detail: "TensorFlow" },
              { id: "ml-models", label: "Model store", kind: "store" },
            ],
          },
          {
            id: "ml-serving",
            label: "Serving",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "ml-candidates", label: "Candidate generation" },
              { id: "ml-score", label: "Scoring service" },
              { id: "ml-rank", label: "Ranking" },
            ],
          },
          {
            id: "ml-surfaces",
            label: "Product surfaces",
            place: { col: 4, row: 1 },
            nodes: [
              { id: "ml-feed", label: "Social feed" },
              { id: "ml-suggestions", label: "Suggestions" },
              { id: "ml-adslots", label: "Ad slots" },
            ],
          },
        ],
        edges: [
          { from: "ml-signals", to: "ml-features" },
          { from: "ml-features", to: "ml-train" },
          { from: "ml-train", to: "ml-models" },
          { from: "ml-models", to: "ml-score" },
          { from: "ml-candidates", to: "ml-score" },
          { from: "ml-score", to: "ml-rank" },
          { from: "ml-rank", to: "ml-surfaces" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "A ranked feed",
            regions: [
              { kind: "list", label: "Posts, ranked for this person", size: 2 },
              { kind: "card", label: "Suggested follows" },
              { kind: "card", label: "A sponsored slot, ranked like the rest" },
            ],
          },
        ],
        decision: "Ranking runs as its own scoring service, so the feed, the suggestions and the ads share one model, and every response feeds the next training run.",
        outcome: "The models went live in client products: suggestions and recommendations, ads, and social feed ranking.",
      },
      journeys: [
        {
          title: "From a tap to a better feed",
          steps: ["A person opens the feed", "Candidates are scored and ranked for them", "They react, follow or skip", "Those signals feed the next training run"],
        },
      ],
    },
  ],
  casino: [
    {
      id: "live-dealer",
      zone: "casino",
      title: "Live dealer tables with real time bets",
      caption: "Real tables streamed from casino floors to many operators' players, with a real time path that keeps bets and results in step with the video.",
      summary: {
        role: "Frontend game engineer: the game UI, the new mobile app and real time back end logic",
        scale: "Tables streamed from land based casinos to operators on mobile, tablet and desktop",
        stack: ["JavaScript", "Redux", "RxJS", "Redux Observables", "PixiJS", "Canvas", "Node.js", "WebSockets"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "ld-floor",
            label: "Casino floor",
            place: { col: 1, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ld-table", label: "Live table", detail: "Wide angle HD camera" },
              { id: "ld-round", label: "Dealer and round", detail: "Bets open, closed, result" },
            ],
          },
          {
            id: "ld-media",
            label: "Video",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "ld-encoder", label: "Encoder" },
              { id: "ld-delivery", label: "Video delivery" },
            ],
          },
          {
            id: "ld-live",
            label: "Real time",
            place: { col: 2, row: 2 },
            nodes: [
              { id: "ld-state", label: "Round state", detail: "The server decides, never the client" },
              { id: "ld-socket", label: "Real time service", detail: "Node.js, WebSockets" },
            ],
          },
          {
            id: "ld-clients",
            label: "Game clients",
            place: { col: 3, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ld-ui", label: "Game UI", detail: "Canvas table, desktop and mobile" },
              { id: "ld-app", label: "Mobile app" },
              { id: "ld-profiling", label: "Profiling tools", detail: "Canvas rendering", kind: "note" },
            ],
          },
          {
            id: "ld-operators",
            label: "Operators",
            isExternal: true,
            place: { col: 4, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ld-sites", label: "Operator sites and apps" },
              { id: "ld-onboarding", label: "Onboarding tooling", detail: "Integration automated" },
            ],
          },
        ],
        edges: [
          { from: "ld-table", to: "ld-encoder" },
          { from: "ld-encoder", to: "ld-delivery" },
          { from: "ld-delivery", to: "ld-ui" },
          { from: "ld-round", to: "ld-state" },
          { from: "ld-state", to: "ld-socket" },
          { from: "ld-socket", to: "ld-ui", isTwoWay: true },
          { from: "ld-ui", to: "ld-sites" },
          { from: "ld-app", to: "ld-sites" },
          { from: "ld-onboarding", to: "ld-sites" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "The table in portrait",
            regions: [
              { kind: "media", label: "Live video of the real table", size: 2.4 },
              { kind: "bar", label: "Bets open, closed, result, timer", size: 0.6 },
              { kind: "canvas", label: "Bet table on canvas, chips by touch", size: 2.4 },
              { kind: "bar", label: "History, folded away", size: 0.6 },
              { kind: "actions", label: "Balance, chips, repeat, undo, confirm", size: 0.9 },
            ],
          },
          {
            title: "Result",
            regions: [
              { kind: "media", label: "The dealer reveals the result", size: 2.4 },
              { kind: "overlay", label: "Result and win", size: 1.4 },
              { kind: "actions", label: "Bets open again", size: 0.9 },
            ],
          },
        ],
        decision: "The table is drawn on canvas with a real time channel for round state, so bets lock on the server's signal and results stay in step with the stream.",
        outcome: "The CTO credits the desktop and mobile game UI with letting the company deliver the most innovative user " +
          "experience in the industry, and the new mobile app shipped.",
      },
      journeys: [
        {
          title: "A player at the table",
          steps: [
            "Opens the table from an operator's site or app",
            "Bets open, and chips go down on the canvas table",
            "Bets lock on the server's signal, not the client's",
            "The dealer reveals the result and the win is shown",
            "The next round opens",
          ],
        },
        {
          title: "A new operator",
          steps: ["Integrates once through the onboarding tooling", "Configures its tables", "Goes live without a manual setup each time"],
        },
      ],
    },
  ],
  mmo: [
    GOZ_BLUEPRINT,
    {
      id: "goz-hardening",
      zone: "mmo",
      title: "A game server, before and after hardening",
      caption: "Before, the origin answered the internet directly. After, only the CDN and expected game traffic reach it. " +
        "Anti cheat is not anti DDoS: a flood that never signs in has to be stopped before the game.",
      summary: {
        role: "Owner of the game: ran the assessment with an agent and wrote the runbook",
        scale: "A live game server under a flood of connections",
        stack: ["Cloudflare", "Firewall rules", "Windows and Linux scripts", "TLS", "Web server rules"],
      },
      architecture: {
        columns: 2,
        groups: [
          {
            id: "before",
            label: "Before",
            columns: 2,
            isExternal: true,
            place: { col: 1, row: 1 },
            nodes: [
              { id: "internet-before", label: "Internet", kind: "actor" },
              { id: "bot-flood", label: "Bot flood" },
              { id: "origin-before", label: "Origin", detail: "Every service on every interface", span: 2 },
            ],
          },
          {
            id: "after",
            label: "After",
            columns: 2,
            place: { col: 2, row: 1 },
            nodes: [
              { id: "internet-after", label: "Internet", kind: "actor" },
              { id: "game-ports", label: "Game ports", detail: "Connection throttling" },
              { id: "edge-shield", label: "CDN, WAF, rate limits", detail: "Bot challenge during floods" },
              { id: "origin-firewall", label: "Origin firewall", detail: "CDN ranges and admin only", span: 2 },
              { id: "web-tier", label: "Web tier" },
              { id: "private-tier", label: "Admin and database tier", detail: "Private interfaces only" },
              { id: "configs", label: "Config files", detail: "No longer served on the web", kind: "note", span: 2 },
            ],
          },
        ],
        edges: [
          { from: "internet-before", to: "origin-before", label: "direct", style: "dashed" },
          { from: "bot-flood", to: "origin-before" },
          { from: "internet-after", to: "edge-shield" },
          { from: "edge-shield", to: "origin-firewall" },
          { from: "game-ports", to: "origin-firewall" },
          { from: "origin-firewall", to: "web-tier" },
          { from: "origin-firewall", to: "private-tier" },
        ],
      },
    },
    {
      id: "game-launcher",
      zone: "mmo",
      title: "A Web3 game launcher and store",
      caption: "A store and developer portal on the web, a desktop launcher and a mobile app on one back end and one design " +
        "system, with the wallet held by the launcher.",
      summary: {
        role: "Senior full stack engineer: web and desktop architecture, and introduced the mobile app",
        scale: "A store, a developer portal, a desktop launcher and a mobile app on one back end",
        stack: ["TypeScript", "React", "Next.js", "Electron", "React Native", "Node.js", "GraphQL", "PostgreSQL", "C/C++", "Storybook"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "gl-shared",
            label: "Shared",
            columns: 2,
            place: { col: 1, row: 1, colSpan: 4 },
            nodes: [
              { id: "gl-design", label: "Design system", detail: "Storybook, interaction tests" },
              { id: "gl-tooling", label: "Developer tooling", detail: "CLI, scaffolders, docs" },
            ],
          },
          {
            id: "gl-clients",
            label: "Clients",
            columns: 4,
            place: { col: 1, row: 2, colSpan: 4 },
            nodes: [
              { id: "gl-store", label: "Store website", detail: "Next.js" },
              { id: "gl-portal", label: "Developer portal" },
              { id: "gl-launcher", label: "Desktop launcher", detail: "Electron, native C/C++ modules" },
              { id: "gl-mobile", label: "Mobile app", detail: "React Native" },
            ],
          },
          {
            id: "gl-backend",
            label: "Back end",
            columns: 2,
            place: { col: 1, row: 3, colSpan: 2 },
            nodes: [
              { id: "gl-api", label: "Platform services", detail: "Node.js, GraphQL" },
              { id: "gl-db", label: "Catalogue and accounts", kind: "store" },
            ],
          },
          {
            id: "gl-play",
            label: "Play",
            columns: 2,
            place: { col: 3, row: 3, colSpan: 2 },
            nodes: [
              { id: "gl-download", label: "Download and verify" },
              { id: "gl-wallet", label: "Wallet session", detail: "EVM chains" },
              { id: "gl-game", label: "Game process", detail: "Signs through the launcher" },
              { id: "gl-contracts", label: "Smart contracts", detail: "Reviewed for attack paths" },
            ],
          },
        ],
        edges: [
          { from: "gl-shared", to: "gl-clients" },
          { from: "gl-clients", to: "gl-api" },
          { from: "gl-api", to: "gl-db" },
          { from: "gl-launcher", to: "gl-play" },
          { from: "gl-wallet", to: "gl-game" },
          { from: "gl-game", to: "gl-contracts" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Store page",
            regions: [
              { kind: "media", label: "Cover", size: 1.6 },
              { kind: "card", label: "Description" },
              { kind: "list", label: "Chain and wallet needs" },
              { kind: "actions", label: "Install", size: 0.8 },
            ],
          },
          {
            title: "Wallet",
            regions: [
              { kind: "card", label: "The chain this game needs" },
              { kind: "form", label: "Connect a wallet", size: 1.4 },
              { kind: "actions", label: "Connect", size: 0.8 },
            ],
          },
          {
            title: "Install",
            regions: [
              { kind: "card", label: "The game" },
              { kind: "stat", label: "Download progress" },
              { kind: "list", label: "Verified files", size: 1.4 },
            ],
          },
          {
            title: "Library",
            regions: [
              { kind: "list", label: "Installed games", size: 2 },
              { kind: "card", label: "Updates" },
              { kind: "actions", label: "Play", size: 0.8 },
            ],
          },
          {
            title: "In game",
            regions: [
              { kind: "media", label: "The game", size: 2.6 },
              { kind: "bar", label: "Wallet session kept", size: 0.7 },
              { kind: "overlay", label: "Sign a transaction" },
            ],
          },
        ],
        decision: "Wallet and install live in one launcher, so a Web3 game is one click away instead of three tools.",
        outcome: "The same flow on web, desktop and mobile with one design system, and native modules and profiling cut memory use and load times.",
      },
      journeys: [
        {
          title: "A player, from store to playing",
          steps: [
            "Finds a game in the store",
            "Connects a wallet, told which chain the game needs",
            "Installs it inside the launcher",
            "Plays, and the game signs transactions through the launcher's wallet session",
          ],
        },
      ],
    },
  ],
};
