import { Blueprint, BlueprintContent } from "@/types/blueprints";

// Kinds of architecture I have built, drawn as a glance, not the full design. No company is named: each is
// a product I worked on or proposed, with what I did, its scale and the stack. My own ventures also feed
// the project map's dialogs. No hosts, addresses, versions or amounts, and the platform stays unnamed.

export const GOZ_BLUEPRINT: Blueprint = {
  id: "goz-engine",
  zone: "mmo",
  title: "An MMORPG, from engine to live operations",
  caption: "My own game, built from scratch: the engine and the servers in C/C++ with my own framework and physics, Boost " +
    "and ACE as general libraries, and the web, payments and operations around them.",
  summary: {
    role: "Founder, CEO and CTO: built the engine and servers from scratch, then the launcher, payments, operations and marketing",
    scale: "8M+ registered accounts, and 50k active players at its peak, before mobile games took the share",
    stack: ["C/C++", "Own engine and framework", "Own physics", "Boost and ACE libraries", "Lua", "Python", "C#", "Laravel", "Vue", "OVH", "Cloudflare"],
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "goz-players",
        label: "Players",
        place: { col: 1, row: 1, rowSpan: 2 },
        nodes: [
          { id: "goz-launcher", label: "Launcher", detail: "C#, a minimal installer that fetches the game on first launch" },
          { id: "goz-client", label: "Game client", detail: "Own engine, framework and physics in C/C++" },
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
        label: "Game services, built from scratch for low latency, on OVH dedicated servers",
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
          { kind: "stat", label: "First launch downloads the game, later ones patch it" },
          { kind: "actions", label: "Play starts the client; account, store, language" },
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
        "Lands on the website and downloads the minimal installer",
        "The first launch downloads the game, and Play starts the client",
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
  caption: "A social network for anime, manga, cosplay and gaming fans: a feed with stories and videos, diaries and " +
    "crews, manga to read and anime to watch, and a character of your own, all running on one currency earned by taking part.",
  summary: {
    role: "Founder, CEO and CTO: proposed and built the product, its engines and its economy, and ran the community",
    scale: "10M+ registered, 3M+ active",
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
          { id: "amw-gfx", label: "Canvas and WebGL", detail: "Characters and scenes" },
        ],
      },
      {
        id: "amw-web",
        label: "Web tier",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "amw-lb", label: "Load balancer" },
          { id: "amw-php", label: "PHP application", detail: "Profiles, posts, diaries, crews, forums" },
          { id: "amw-py", label: "Python services", detail: "Feeds and jobs" },
          { id: "amw-chat", label: "Chat and presence" },
        ],
      },
      {
        id: "amw-content",
        label: "Content",
        place: { col: 3, row: 1 },
        nodes: [
          { id: "amw-stories", label: "Stories and videos" },
          { id: "amw-anime", label: "Anime streaming", detail: "Fillers marked, skippable" },
          { id: "amw-manga", label: "Manga reader", detail: "Interactive book mode" },
        ],
      },
      {
        id: "amw-data",
        label: "Data",
        place: { col: 4, row: 1, rowSpan: 2 },
        nodes: [
          { id: "amw-db", label: "Relational database", kind: "store" },
          { id: "amw-cache", label: "Cache", kind: "store" },
          { id: "amw-media", label: "Media storage", detail: "Artwork, cosplay, video" },
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
      {
        id: "amw-economy",
        label: "Economy",
        place: { col: 3, row: 2 },
        nodes: [
          { id: "amw-berries", label: "Berries", detail: "Earned by taking part, spent everywhere" },
          { id: "amw-items", label: "Items and inventory" },
          { id: "amw-auction", label: "Auction house" },
          { id: "amw-ads", label: "Ads system", detail: "Self serve, targeted" },
          { id: "amw-characters", label: "Characters", detail: "Mixed from many anime, levelled up" },
        ],
      },
    ],
    edges: [
      { from: "amw-ui", to: "amw-lb" },
      { from: "amw-lb", to: "amw-php" },
      { from: "amw-php", to: "amw-content" },
      { from: "amw-php", to: "amw-economy" },
      { from: "amw-php", to: "amw-db" },
      { from: "amw-py", to: "amw-cache" },
      { from: "amw-content", to: "amw-media" },
      { from: "amw-gfx", to: "amw-gameengine" },
      { from: "amw-gameengine", to: "amw-wire" },
    ],
  },
  wireframe: {
    device: "desktop",
    screens: [
      {
        title: "Feed",
        regions: [
          { kind: "steps", label: "Stories", size: 0.7 },
          { kind: "list", label: "Posts, videos, artwork and forum activity", size: 2 },
          { kind: "card", label: "Auctions ending soon and promoted items" },
        ],
      },
      {
        title: "Diary",
        regions: [
          { kind: "form", label: "A new entry, and who can read it" },
          { kind: "list", label: "Entries by date, with comments", size: 2 },
        ],
      },
      {
        title: "Ship crew",
        regions: [
          { kind: "media", label: "Crew banner and flag" },
          { kind: "list", label: "Members and their roles" },
          { kind: "list", label: "Crew posts", size: 1.4 },
          { kind: "actions", label: "Join or leave" },
        ],
      },
      {
        title: "Read manga",
        regions: [
          { kind: "canvas", label: "The page, turned like a book", size: 2.4 },
          { kind: "bar", label: "Chapter and progress" },
          { kind: "actions", label: "Previous page, next page, chapters" },
        ],
      },
      {
        title: "Watch anime",
        regions: [
          { kind: "media", label: "The episode", size: 2.4 },
          { kind: "bar", label: "Skip fillers: on" },
          { kind: "list", label: "Episodes, fillers marked" },
        ],
      },
      {
        title: "Build your character",
        regions: [
          { kind: "canvas", label: "Your character, mixed from many anime", size: 2 },
          { kind: "list", label: "Hair, outfit and gear from different series" },
          { kind: "steps", label: "Level and enhancements" },
        ],
      },
      {
        title: "Items and berries",
        regions: [
          { kind: "stat", label: "Berries balance" },
          { kind: "list", label: "Inventory", size: 1.4 },
          { kind: "list", label: "Ways to earn: posting, reading, watching, taking part" },
          { kind: "actions", label: "Use, sell at auction, buy" },
        ],
      },
      {
        title: "Auction",
        regions: [
          { kind: "media", label: "Item and rarity", size: 1.5 },
          { kind: "stat", label: "Current bid in berries, time left" },
          { kind: "form", label: "Your bid" },
          { kind: "list", label: "Bid history, related items" },
        ],
      },
    ],
    decision: "Every way of taking part earned berries, and berries bought items, enhancements, auction lots and promotion, so being active was the game.",
    outcome: "10M+ registered and 3M+ active, on a stack I built mostly myself.",
  },
  journeys: [
    {
      title: "A fan's evening",
      steps: [
        "Watches an episode, skipping the fillers",
        "Reads the next manga chapter in book mode",
        "Writes a diary entry and posts to the crew",
        "Earns berries for all of it",
        "Buys a piece of gear for a character mixed from different anime",
      ],
    },
    {
      title: "A creator",
      steps: [
        "Posts artwork or a video",
        "Earns berries from reactions and comments",
        "Lists an item at auction",
        "Spends the proceeds on a character enhancement",
      ],
    },
    {
      title: "An advertiser",
      steps: ["Creates a campaign and picks an audience", "Sets a budget in berries or money", "Watches impressions and clicks, then tops up"],
    },
  ],
};

// Early ventures, kept undated on purpose. What they did comes from my own description; no stack is on record,
// so none is shown.
const EARLY_SCALE = "An early venture, launched and closed for lack of funding";

export const ARCAVIUM_BLUEPRINT: Blueprint = {
  id: "low-code-game-builder",
  zone: "mmo",
  title: "A low code game builder",
  caption: "Build a whole game, its client and its server, by choosing from menus and uploading models, write classes in several languages only where you want to, and let the platform host and run the rest.",
  summary: {
    role: "Founder, CEO and CTO: proposed the product and its architecture, and built it",
    scale: EARLY_SCALE,
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "ar-creator",
        label: "Creator",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "ar-builder", label: "Builder", detail: "Menus and dropdowns, no code" },
          { id: "ar-assets", label: "Model upload", detail: "Models and assets" },
          { id: "ar-code", label: "Custom classes", detail: "In several languages, when needed" },
        ],
      },
      {
        id: "ar-pipeline",
        label: "Build pipeline",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "ar-definition", label: "Game definition", detail: "Everything the menus chose" },
          { id: "ar-generator", label: "Generator", detail: "Client and server from one definition" },
          { id: "ar-runtimes", label: "Language runtimes", detail: "Custom classes run safely" },
        ],
      },
      {
        id: "ar-game",
        label: "The game",
        place: { col: 3, row: 1 },
        nodes: [
          { id: "ar-client", label: "Game client", detail: "The interface players see" },
          { id: "ar-server", label: "Game server", detail: "Rules, state and players" },
        ],
      },
      {
        id: "ar-run",
        label: "Run for the creator",
        place: { col: 4, row: 1 },
        nodes: [
          { id: "ar-hosting", label: "Hosting", detail: "Handled by the platform" },
          { id: "ar-updates", label: "Updates", detail: "Rebuilt and shipped on every change" },
          { id: "ar-players", label: "Players", kind: "actor" },
        ],
      },
    ],
    edges: [
      { from: "ar-builder", to: "ar-definition" },
      { from: "ar-assets", to: "ar-definition" },
      { from: "ar-code", to: "ar-runtimes" },
      { from: "ar-definition", to: "ar-generator" },
      { from: "ar-generator", to: "ar-game" },
      { from: "ar-runtimes", to: "ar-server" },
      { from: "ar-game", to: "ar-run" },
    ],
  },
  wireframe: {
    device: "desktop",
    screens: [
      {
        title: "Builder",
        regions: [
          { kind: "bar", label: "Game name and publish state", area: "header" },
          { kind: "list", label: "Scenes, characters, items, rules", area: "left" },
          { kind: "canvas", label: "Live preview", area: "main" },
          { kind: "form", label: "Properties, all from dropdowns", area: "right" },
          { kind: "actions", label: "Upload a model, add code, publish", area: "footer" },
        ],
      },
      {
        title: "Custom code",
        regions: [
          { kind: "bar", label: "Pick a language" },
          { kind: "form", label: "A class, hooked to a game event", size: 2.2 },
          { kind: "bar", label: "Runs on the game server" },
        ],
      },
      {
        title: "Publish",
        regions: [
          { kind: "steps", label: "Build client and server, host, go live" },
          { kind: "stat", label: "Players online" },
          { kind: "actions", label: "Update, roll back" },
        ],
      },
    ],
    decision: "One game definition, built from menu choices, generates both the client and the server, so creators never wire the two by hand, and code is an option, never a requirement.",
    outcome: "It let creators build and run a full game without writing an engine or managing servers. It launched, and closed for lack of funding.",
  },
  journeys: [
    {
      title: "A creator ships a game",
      steps: [
        "Sets the game up from menus",
        "Uploads the models",
        "Adds a class in their own language for one special rule",
        "Publishes, and the platform builds and hosts the client and the server",
        "Players join",
      ],
    },
  ],
};

export const ADOTTA_BLUEPRINT: Blueprint = {
  id: "donations-rewards",
  zone: "mmo",
  title: "Donations to shelters that earn points",
  caption: "Donors give to animal shelters and earn points they can spend wherever partners accept them.",
  summary: {
    role: "Founder, CEO and CTO: proposed the product and built it",
    scale: EARLY_SCALE,
  },
  architecture: {
    columns: 3,
    groups: [
      {
        id: "ad-donors",
        label: "Donors",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "ad-app", label: "Donor app" },
          { id: "ad-shelters", label: "Shelter profiles", detail: "And what each needs" },
        ],
      },
      {
        id: "ad-core",
        label: "Core",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "ad-donations", label: "Donations" },
          { id: "ad-points", label: "Points ledger", detail: "Earned with every donation" },
          { id: "ad-redeem", label: "Redemption", detail: "Wherever partners accept them" },
        ],
      },
      {
        id: "ad-partners",
        label: "Outside",
        isExternal: true,
        place: { col: 3, row: 1 },
        nodes: [
          { id: "ad-payments", label: "Payment provider" },
          { id: "ad-shelter-side", label: "Shelters", detail: "Receive the donations" },
          { id: "ad-partner", label: "Partner businesses", detail: "Accept the points" },
        ],
      },
    ],
    edges: [
      { from: "ad-app", to: "ad-donations" },
      { from: "ad-donations", to: "ad-payments" },
      { from: "ad-donations", to: "ad-shelter-side" },
      { from: "ad-donations", to: "ad-points" },
      { from: "ad-points", to: "ad-redeem" },
      { from: "ad-redeem", to: "ad-partner" },
    ],
  },
  wireframe: {
    device: "phone",
    screens: [
      {
        title: "Shelters",
        regions: [
          { kind: "bar", label: "Near you", size: 0.6 },
          { kind: "list", label: "Shelters and what they need", size: 2.4 },
        ],
      },
      {
        title: "Donate",
        regions: [
          { kind: "card", label: "The shelter" },
          { kind: "stat", label: "Amount" },
          { kind: "form", label: "Payment" },
          { kind: "actions", label: "Donate", size: 0.8 },
        ],
      },
      {
        title: "Points",
        regions: [
          { kind: "stat", label: "Points balance" },
          { kind: "list", label: "Earned per donation", size: 1.6 },
        ],
      },
      {
        title: "Spend",
        regions: [
          { kind: "list", label: "Partners that accept points", size: 1.8 },
          { kind: "actions", label: "Redeem", size: 0.8 },
        ],
      },
    ],
    decision: "Every donation earns points that partners accept, so giving to a shelter also comes back to the donor as value.",
    outcome: "It launched to donors, shelters and partners, and closed for lack of funding.",
  },
  journeys: [
    {
      title: "A donor",
      steps: ["Finds a shelter and sees what it needs", "Donates", "Earns points", "Spends them with a partner"],
    },
  ],
};

export const PUNTI_BLUEPRINT: Blueprint = {
  id: "loyalty-service",
  zone: "mmo",
  title: "Loyalty as a service",
  caption: "A ready loyalty scheme for online shops, physical outlets and restaurants, so a business never builds or maintains its own app.",
  summary: {
    role: "Founder, CEO and CTO: proposed the product and built it",
    scale: "An early venture against established competition, launched and closed for lack of funding",
  },
  architecture: {
    columns: 3,
    groups: [
      {
        id: "pu-customers",
        label: "Customers",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "pu-app", label: "One app", detail: "Every business in one wallet" },
          { id: "pu-scan", label: "Earn", detail: "At the till or online" },
        ],
      },
      {
        id: "pu-core",
        label: "Platform",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "pu-rules", label: "Earning rules", detail: "Set by each business" },
          { id: "pu-ledger", label: "Points ledger" },
          { id: "pu-rewards", label: "Rewards and redemption" },
        ],
      },
      {
        id: "pu-business",
        label: "Businesses",
        isExternal: true,
        place: { col: 3, row: 1 },
        nodes: [
          { id: "pu-dashboard", label: "Business dashboard", detail: "Rules and rewards, no app to build" },
          { id: "pu-outlets", label: "Shops, outlets and restaurants" },
        ],
      },
    ],
    edges: [
      { from: "pu-scan", to: "pu-ledger" },
      { from: "pu-rules", to: "pu-ledger", style: "dashed" },
      { from: "pu-ledger", to: "pu-rewards" },
      { from: "pu-dashboard", to: "pu-rules" },
      { from: "pu-outlets", to: "pu-scan", style: "dashed" },
    ],
  },
  wireframe: {
    device: "phone",
    screens: [
      {
        title: "My places",
        regions: [
          { kind: "stat", label: "Points across every place" },
          { kind: "list", label: "Businesses I collect with", size: 2 },
        ],
      },
      {
        title: "A business",
        regions: [
          { kind: "stat", label: "My points here" },
          { kind: "list", label: "Rewards I can get", size: 1.6 },
        ],
      },
      {
        title: "Earn",
        regions: [
          { kind: "media", label: "Code to scan at the till", size: 2 },
          { kind: "bar", label: "Points added", size: 0.7 },
        ],
      },
      {
        title: "Redeem",
        regions: [
          { kind: "card", label: "The reward", size: 1.4 },
          { kind: "actions", label: "Redeem", size: 0.8 },
        ],
      },
    ],
    decision: "One app for every business, so customers carry one loyalty wallet and a business joins without building anything.",
    outcome: "It launched for shops, outlets and restaurants against established competition, and closed for lack of funding.",
  },
  journeys: [
    {
      title: "A customer",
      steps: ["Scans at a restaurant", "Collects points with every visit", "Redeems a reward", "Uses the same app at the next shop"],
    },
    {
      title: "A business",
      steps: ["Signs up", "Sets its earning rules and rewards", "Starts rewarding customers without building an app"],
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
    role: "What I did",
    scale: "Scale",
    stack: "Stack",
    journeys: "User journeys",
    glanceNote: "A glance at the architecture, not the full design.",
    sketchNote: "Sketches of the flow, not screenshots of a real product.",
  },
  ai: [
    {
      id: "ai-workflow",
      zone: "ai",
      title: "AI delivery: plan artifacts, agents and test batteries",
      caption: "The plan artifact is the system of record, batteries prove each task on the deployed build, and a person " +
        "merges. A tracker is an optional view, not the source.",
      summary: {
        role: "Proposed and designed it, and work inside it every day",
        scale: "My own products, client work and a large enterprise delivery organisation; on one product, 600+ battery " +
          "scripts across 40+ subjects and 150+ end to end specs",
        stack: ["Claude Code on Max", "Gemini Enterprise", "Claude, GPT and Gemini APIs", "MCP servers", "Subagents", "Playwright", "Shell batteries", "Artifacts"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "ai-plan",
            label: "Plan artifact, the system of record",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "ai-phases", label: "Phases", detail: "Each with the gate that closes it" },
              { id: "ai-tasks", label: "Tasks", detail: "Owner, acceptance, status" },
              { id: "ai-decisions", label: "Decision register", detail: "Numbered, searched first" },
            ],
          },
          {
            id: "ai-contract",
            label: "Contract the agent works under",
            place: { col: 1, row: 2 },
            nodes: [
              { id: "ai-policy", label: "Policy", detail: "What AI may touch" },
              { id: "ai-rules", label: "Rules and skills", detail: "Per repository" },
              { id: "ai-handoffs", label: "Handoffs and memory" },
            ],
          },
          {
            id: "ai-run",
            label: "Agent run",
            place: { col: 2, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ai-agent", label: "Main agent", detail: "Large model" },
              { id: "ai-subagents", label: "Subagents", detail: "Read only, never build or commit" },
              { id: "ai-mcp", label: "Scoped tools, MCP", detail: "Staging and production kept apart" },
            ],
          },
          {
            id: "ai-proof",
            label: "Batteries on the deployed build",
            place: { col: 3, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ai-security", label: "Security", detail: "Negative cases: 403 and 404 where they belong" },
              { id: "ai-function", label: "Functionality", detail: "HTTP verified" },
              { id: "ai-flows", label: "Product flows", detail: "Web app to back office, and back" },
              { id: "ai-providers", label: "Provider agnostic", detail: "One contract, every provider" },
              { id: "ai-money", label: "Money path", detail: "Ledger rows verified in the database" },
              { id: "ai-e2e", label: "End to end", detail: "Playwright, screenshots before and after" },
            ],
          },
          {
            id: "ai-gates",
            label: "Gates",
            place: { col: 4, row: 1 },
            nodes: [
              { id: "ai-ledgers", label: "Runs and endpoint ledgers", detail: "Every run, with its commit" },
              { id: "ai-prbody", label: "Pull request body", detail: "Verified versus assumed" },
              { id: "ai-design", label: "Design review agent" },
              { id: "ai-human", label: "Human review", detail: "Every change" },
            ],
          },
          {
            id: "ai-landing",
            place: { col: 4, row: 2 },
            nodes: [{ id: "ai-merge", label: "Merge and republish the plan" }],
          },
        ],
        edges: [
          { from: "ai-phases", to: "ai-tasks" },
          { from: "ai-tasks", to: "ai-agent" },
          { from: "ai-contract", to: "ai-run" },
          { from: "ai-agent", to: "ai-subagents" },
          { from: "ai-agent", to: "ai-mcp" },
          { from: "ai-run", to: "ai-proof" },
          { from: "ai-proof", to: "ai-ledgers" },
          { from: "ai-ledgers", to: "ai-prbody" },
          { from: "ai-prbody", to: "ai-design" },
          { from: "ai-design", to: "ai-human" },
          { from: "ai-human", to: "ai-merge" },
        ],
      },
      wireframe: {
        device: "desktop",
        screens: [
          {
            title: "The plan artifact",
            regions: [
              { kind: "bar", label: "Where things stand", area: "header" },
              { kind: "steps", label: "Phases, each with its gate", area: "left" },
              { kind: "list", label: "Tasks: owner, acceptance, status, the decision behind it", area: "main" },
              { kind: "card", label: "Open questions, with options and a recommendation", area: "right" },
              { kind: "list", label: "Changelog of settled sections", area: "footer" },
            ],
          },
          {
            title: "The runs ledger",
            regions: [
              { kind: "bar", label: "Battery, commit, time" },
              { kind: "list", label: "Each run: pass, fail, skip, pending", size: 2.4 },
              { kind: "bar", label: "Stale when its source changes" },
            ],
          },
        ],
        decision: "The plan page is the record: every row is re-measured on each pass, a row that cannot be checked stays " +
          "unverified, and status is earned by a battery on the deployed build.",
        outcome: "Nothing is re-entered into a tracker, decisions survive long agent sessions, and a change merges only when the batteries and a person agree.",
      },
      journeys: [
        {
          title: "A phase, from decision to merge",
          steps: [
            "The refund window per jurisdiction is decided and recorded as a numbered decision",
            "The agent adds a jurisdiction snapshot at checkout, proven by a probe on staging",
            "The refund endpoint refuses late requests, proven by a battery: 403 outside the window, 200 inside",
            "Ledger rows are checked in the database: debit and credit balance under one correlation id",
            "The back office screen is built and the design review agent approves it",
            "All batteries are green on the deployed build, and a person merges",
          ],
        },
        {
          title: "A battery run",
          steps: [
            "Runs against the deployed build, never against seeded state",
            "Checks the negative cases: another user's data is 403, a foreign id is 404",
            "Moves money only behind an explicit flag, so a plain run is harmless",
            "Writes one line to the runs ledger with its commit",
            "A change to the code it covers marks its last green run as stale",
          ],
        },
      ],
    },
  ],
  chain: [
    {
      id: "web3-exchange",
      zone: "chain",
      title: "A Web3 exchange app",
      caption: "Every club or creator token trades against one base token: markets with live prices, buy and sell, deposits " +
        "and withdrawals, rewards, and each trade settled on chain and confirmed from the indexer.",
      summary: {
        role: "Proposed and built the core the app runs on: one SDK shared across mobile and web, with on chain trading inside it",
        scale: "A large consumer user base worldwide, with many product squads building on the core",
        stack: ["React Native", "TypeScript", "RxJS", "Redux Observables", "Ethers", "WalletConnect", "Kotlin", "Java", "C/C++", "Jest"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "ex-clients",
            label: "Clients, one shared core",
            place: { col: 1, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ex-mobile", label: "Mobile app", detail: "One core for every squad" },
              { id: "ex-web", label: "Web app" },
              { id: "ex-state", label: "Reactive state", detail: "RxJS, live prices" },
              { id: "ex-native", label: "Native modules", detail: "C/C++, Java, Kotlin" },
            ],
          },
          {
            id: "ex-markets-group",
            label: "Markets",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "ex-markets", label: "Markets", detail: "Every token against the base token" },
              { id: "ex-prices", label: "Live prices", detail: "Real time feed" },
              { id: "ex-charts", label: "Price history" },
            ],
          },
          {
            id: "ex-trading",
            label: "Trading",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "ex-order", label: "Buy and sell", detail: "Priced in the base token" },
              { id: "ex-settle", label: "Settlement", detail: "On chain" },
              { id: "ex-receipts", label: "Orders and receipts" },
            ],
          },
          {
            id: "ex-wallet",
            label: "Wallet",
            place: { col: 2, row: 2 },
            nodes: [
              { id: "ex-deposit", label: "Deposits", detail: "Base token in" },
              { id: "ex-balances", label: "Balances", detail: "Base, club and creator tokens" },
              { id: "ex-withdraw", label: "Withdrawals", detail: "Out to an external wallet" },
            ],
          },
          {
            id: "ex-account",
            label: "Account",
            place: { col: 3, row: 2 },
            nodes: [
              { id: "ex-kyc", label: "KYC and limits" },
              { id: "ex-rewards", label: "Rewards", detail: "Claimed on chain, pushed in real time" },
            ],
          },
          {
            id: "ex-chain",
            label: "Chain",
            place: { col: 4, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ex-base", label: "Base token", kind: "store" },
              { id: "ex-tokens", label: "Token contracts", detail: "One per club or creator" },
              { id: "ex-rpc", label: "RPC nodes" },
              { id: "ex-indexer", label: "Indexer", detail: "Confirms from the chain, not the client" },
            ],
          },
          {
            id: "ex-cloud",
            label: "Runs on AWS",
            columns: 3,
            place: { col: 1, row: 3, colSpan: 4 },
            nodes: [
              { id: "ex-compute", label: "Services that scale with load" },
              { id: "ex-stores", label: "Managed data stores" },
              { id: "ex-delivery", label: "CDN and object storage" },
            ],
          },
        ],
        edges: [
          { from: "ex-clients", to: "ex-markets-group" },
          { from: "ex-prices", to: "ex-order" },
          { from: "ex-balances", to: "ex-order", label: "pays in base token" },
          { from: "ex-deposit", to: "ex-balances" },
          { from: "ex-balances", to: "ex-withdraw" },
          { from: "ex-kyc", to: "ex-order", style: "dashed" },
          { from: "ex-order", to: "ex-settle" },
          { from: "ex-settle", to: "ex-tokens" },
          { from: "ex-rewards", to: "ex-tokens" },
          { from: "ex-tokens", to: "ex-indexer" },
          { from: "ex-indexer", to: "ex-receipts", label: "confirmed" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Markets",
            regions: [
              { kind: "bar", label: "Search and filters", size: 0.6 },
              { kind: "list", label: "Tokens with price and change, in the base token", size: 2.4 },
            ],
          },
          {
            title: "Token page",
            regions: [
              { kind: "canvas", label: "Price history", size: 1.6 },
              { kind: "stat", label: "Your holding" },
              { kind: "card", label: "Rewards for holders" },
              { kind: "actions", label: "Buy, sell", size: 0.8 },
            ],
          },
          {
            title: "Buy",
            regions: [
              { kind: "stat", label: "Amount, priced in the base token" },
              { kind: "bar", label: "Fee and total", size: 0.7 },
              { kind: "bar", label: "Deposit if the balance is short", size: 0.7 },
              { kind: "actions", label: "Confirm once", size: 0.8 },
            ],
          },
          {
            title: "Settling",
            regions: [
              { kind: "overlay", label: "Pending on chain, with a clear status", size: 2 },
              { kind: "bar", label: "Confirmed from the indexer", size: 0.7 },
              { kind: "bar", label: "An error state if it fails", size: 0.7 },
            ],
          },
          {
            title: "Wallet",
            regions: [
              { kind: "stat", label: "Base token balance" },
              { kind: "list", label: "Tokens held, with value", size: 1.6 },
              { kind: "actions", label: "Deposit, withdraw", size: 0.8 },
            ],
          },
        ],
        decision: "Every token trades against one base token, so a price always reads in one unit and a single deposit lets a fan trade any club or creator.",
        outcome: "On chain trading and rewards inside an ordinary app flow, on a core rebuilt from critically unstable that every squad ships on.",
      },
      journeys: [
        {
          title: "A fan buys a token",
          steps: [
            "Deposits the base token",
            "Opens a market and watches the live price",
            "Buys, paying in the base token",
            "Sees it pending while the trade settles on chain",
            "The holding appears once the indexer confirms it",
          ],
        },
        {
          title: "A fan sells and withdraws",
          steps: ["Sells back into the base token", "Sees the receipt once settled", "Withdraws to an external wallet"],
        },
        {
          title: "A fan claims a reward",
          steps: ["A real time reward arrives as a notification", "Claims it, as a contract call shown as pending", "Confirmed from the chain, never from the client"],
        },
      ],
    },
    {
      id: "web3-assets",
      zone: "chain",
      title: "Web3 asset management",
      caption: "One view of everything a person owns across chains: tokens, stablecoins, NFTs and staked, lent or pooled " +
        "positions, through custodial or connected wallets, with off chain credits that cross into the wallet safely.",
      summary: {
        role: "Proposed and built wallet and asset flows across several products, from sign in to staking",
        scale: "Tokens, NFTs and positions across EVM chains, Solana and Polkadot",
        stack: ["Solidity", "Ethers", "Wagmi", "Web3.js", "WalletConnect", "MetaMask", "The Graph", "Alchemy", "Polygon", "PostgreSQL"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "am-access",
            label: "Access",
            place: { col: 1, row: 1, rowSpan: 2 },
            nodes: [
              { id: "am-connected", label: "Connected wallets", detail: "WalletConnect, MetaMask" },
              { id: "am-custodial", label: "Custodial wallet", detail: "Held for the user" },
              { id: "am-siwe", label: "Sign in with Ethereum" },
              { id: "am-username", label: "Send by username", detail: "Tokens and NFTs" },
            ],
          },
          {
            id: "am-portfolio",
            label: "Portfolio",
            place: { col: 2, row: 1, rowSpan: 2 },
            nodes: [
              { id: "am-balances", label: "Token balances", detail: "ERC-20 and stablecoins" },
              { id: "am-nfts", label: "NFTs", detail: "ERC-721 and ERC-1155" },
              { id: "am-positions", label: "Positions", detail: "Staked, lent, pooled" },
              { id: "am-activity", label: "Activity", detail: "Every movement with its reason" },
            ],
          },
          {
            id: "am-actions",
            label: "Actions",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "am-stake", label: "Stake and unstake" },
              { id: "am-swap", label: "Swap", detail: "DEX and AMM" },
              { id: "am-lend", label: "Lend or rent out" },
            ],
          },
          {
            id: "am-offchain",
            label: "Off chain",
            place: { col: 3, row: 2 },
            nodes: [
              { id: "am-credits", label: "Credits ledger", detail: "Append only" },
              { id: "am-saga", label: "Crossing saga", detail: "Credits into the wallet, self healing" },
            ],
          },
          {
            id: "am-chain",
            label: "Chain",
            place: { col: 4, row: 1, rowSpan: 2 },
            nodes: [
              { id: "am-tokenise", label: "Tokenisation contracts" },
              { id: "am-staking", label: "Staking contracts" },
              { id: "am-pools", label: "Liquidity pools" },
              { id: "am-index", label: "Indexers", detail: "Balances read from the chain" },
            ],
          },
        ],
        edges: [
          { from: "am-access", to: "am-portfolio" },
          { from: "am-stake", to: "am-staking" },
          { from: "am-swap", to: "am-pools" },
          { from: "am-lend", to: "am-tokenise" },
          { from: "am-credits", to: "am-saga" },
          { from: "am-saga", to: "am-custodial", label: "into the wallet" },
          { from: "am-index", to: "am-positions", label: "read back" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Portfolio",
            regions: [
              { kind: "stat", label: "Total, by chain" },
              { kind: "list", label: "Tokens and stablecoins", size: 1.4 },
              { kind: "list", label: "NFTs", size: 1.2 },
              { kind: "card", label: "Staked, lent and pooled positions" },
            ],
          },
          {
            title: "An asset",
            regions: [
              { kind: "canvas", label: "Value over time", size: 1.4 },
              { kind: "stat", label: "Held, and where" },
              { kind: "actions", label: "Send, swap, stake", size: 0.8 },
            ],
          },
          {
            title: "Send by username",
            regions: [
              { kind: "form", label: "Username, resolved to an address", size: 1.2 },
              { kind: "card", label: "The token or NFT" },
              { kind: "actions", label: "Confirm in the wallet", size: 0.8 },
            ],
          },
          {
            title: "Stake",
            regions: [
              { kind: "stat", label: "Amount" },
              { kind: "list", label: "Terms and rewards" },
              { kind: "steps", label: "Pending, then confirmed" },
              { kind: "actions", label: "Stake", size: 0.8 },
            ],
          },
        ],
        decision: "Balances are read back from the chain through indexers, never kept as the app's own guess, and off chain " +
          "credits only reach the wallet through a saga that heals itself.",
        outcome: "Tokens, NFTs and positions in one place across chains, sent by username instead of an address, with credits and on chain assets that always agree.",
      },
      journeys: [
        {
          title: "A holder manages what they own",
          steps: [
            "Signs in with their wallet",
            "Sees tokens, NFTs and positions across chains in one portfolio",
            "Stakes part of a balance and watches it confirm",
            "Claims the rewards later",
          ],
        },
        {
          title: "A gift by username",
          steps: ["Types a friend's username, resolved to their address", "Picks a token or an NFT", "Confirms in the wallet", "The friend sees it in their portfolio"],
        },
      ],
    },
    {
      id: "web3-infra",
      zone: "chain",
      title: "Web3 infrastructure",
      caption: "The layer under every Web3 product: chains and nodes, indexers, bridges and wallet connectivity, with " +
        "contract releases that are reviewed, audited and can be rolled back.",
      summary: {
        role: "Proposed the infrastructure and ran it: chains, bridges, indexers, the release pipeline and contract security reviews",
        scale: "Three ecosystems and a chain of our own: EVM chains, Solana and Polkadot",
        stack: ["Rust", "Substrate", "Solidity", "Alchemy", "Infura", "The Graph", "WalletConnect", "MetaMask", "AWS"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "inf-products",
            label: "Products",
            place: { col: 1, row: 1, rowSpan: 2 },
            nodes: [
              { id: "inf-apps", label: "Apps and dApps" },
              { id: "inf-backend", label: "Back end services" },
              { id: "inf-partners", label: "Partner SDKs and APIs" },
            ],
          },
          {
            id: "inf-access",
            label: "Access",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "inf-wallets", label: "Wallet connectivity", detail: "WalletConnect, MetaMask, sign in" },
              { id: "inf-checks", label: "Pre flight checks", detail: "Simulation, allowance rules" },
              { id: "inf-rpc", label: "RPC providers", detail: "Alchemy, Infura" },
            ],
          },
          {
            id: "inf-data",
            label: "Chain data",
            place: { col: 2, row: 2 },
            nodes: [
              { id: "inf-indexers", label: "Indexers", detail: "Subgraphs and our own" },
              { id: "inf-events", label: "Event stream", detail: "Into the product" },
            ],
          },
          {
            id: "inf-chains",
            label: "Chains",
            place: { col: 3, row: 1, rowSpan: 2 },
            nodes: [
              { id: "inf-own", label: "Own chain", detail: "Rust on Substrate" },
              { id: "inf-evm", label: "EVM chains", detail: "Ethereum, Polygon" },
              { id: "inf-solana", label: "Solana" },
              { id: "inf-polkadot", label: "Polkadot", detail: "Parachains first" },
            ],
          },
          {
            id: "inf-interop",
            label: "Interop",
            place: { col: 4, row: 1 },
            nodes: [{ id: "inf-bridges", label: "Bridges", detail: "Across three ecosystems" }],
          },
          {
            id: "inf-release",
            label: "Releases and safety",
            place: { col: 4, row: 2 },
            nodes: [
              { id: "inf-review", label: "Contract review", detail: "Attack paths before release" },
              { id: "inf-ci", label: "CI/CD", detail: "Audit logs, permissions, rollback" },
              { id: "inf-recovery", label: "Disaster recovery", detail: "Business continuity plans" },
              { id: "inf-cloud", label: "Cloud", detail: "AWS, tuned for cost and load" },
            ],
          },
        ],
        edges: [
          { from: "inf-apps", to: "inf-wallets" },
          { from: "inf-wallets", to: "inf-checks" },
          { from: "inf-checks", to: "inf-rpc" },
          { from: "inf-rpc", to: "inf-chains" },
          { from: "inf-chains", to: "inf-indexers" },
          { from: "inf-indexers", to: "inf-events" },
          { from: "inf-events", to: "inf-backend" },
          { from: "inf-bridges", to: "inf-chains", style: "link" },
          { from: "inf-review", to: "inf-ci" },
          { from: "inf-ci", to: "inf-chains", label: "deploys", style: "dashed" },
        ],
      },
      journeys: [
        {
          title: "A transaction, from a click to confirmed",
          steps: [
            "The user signs in the wallet",
            "Pre flight checks stop a dangerous approval before it is sent",
            "The RPC provider submits it, and it waits in the mempool",
            "It lands in a block",
            "The indexer picks it up and the product shows the receipt",
          ],
        },
        {
          title: "A contract release",
          steps: [
            "The change is reviewed for attack paths",
            "The pipeline deploys it with an audit log and set permissions",
            "It is promoted only with a rollback ready",
            "Recovery plans are in place before launch, since a chain cannot be patched casually",
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
        role: "Co-founded it and proposed the architecture, then built it from zero across web, mobile, back end and chain with a team of 10+",
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
          {
            id: "lp-aws",
            label: "AWS, set up in full and tuned",
            columns: 4,
            place: { col: 1, row: 3, colSpan: 4 },
            nodes: [
              { id: "lp-network", label: "Private networking", detail: "And autoscaled compute" },
              { id: "lp-data", label: "Managed databases and caches" },
              { id: "lp-cdn", label: "Object storage and CDN" },
              { id: "lp-cost", label: "Monitoring and cost tuning" },
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
          { from: "lp-ops", to: "lp-aws" },
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
        role: "Built marketplace V2 with the tech lead and owned its landing page from zero, wiring contracts through Wagmi and Ethers",
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
            place: { col: 2, row: 1 },
            nodes: [
              { id: "nft-list", label: "List for rent", detail: "Price, duration, collateral" },
              { id: "nft-browse", label: "Browse and filter" },
              { id: "nft-landing", label: "Landing page" },
              { id: "nft-rent", label: "Rent", detail: "Through the wallet" },
              { id: "nft-design", label: "Design system", detail: "Radix, Storybook tests" },
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
        role: "Proposed and built the money stack end to end, from onboarding to reconciliation",
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
          { from: "fin-stable", to: "fin-ledger" },
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
        role: "Proposed the target architecture, designed and built the content adapter, and planned the rollout market by market",
        scale: "A large multi market retailer, migrating without stopping sales",
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
            place: { col: 3, row: 1 },
            nodes: [
              { id: "mm-headless", label: "Headless CMS", detail: "REST API; publishing bans the cache" },
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
            id: "mm-cloud",
            label: "Google Cloud and the edge",
            columns: 4,
            place: { col: 1, row: 3, colSpan: 4 },
            nodes: [
              { id: "mm-gke", label: "GKE", detail: "Kubernetes with Istio and Helm" },
              { id: "mm-managed", label: "Managed PostgreSQL" },
              { id: "mm-workers", label: "Edge workers and Varnish" },
              { id: "mm-bigquery", label: "BigQuery and Looker Studio", detail: "Analytics" },
            ],
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
          { from: "mm-store", to: "mm-cloud", style: "dashed" },
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
      title: "A modular core behind adapters",
      caption: "One core package holds the business logic and the apps are thin shells. Every vendor and host sits behind an " +
        "adapter, so a provider can be added, run in parallel and switched by configuration.",
      summary: {
        role: "Proposed and built it: one core SDK that runs across back end, front end and mobile, with every vendor behind an adapter",
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
      title: "One payment, step by step",
      caption: "A payment is booked twice on purpose, as two balancing ledger rows under one correlation id, and every step " +
        "can be retried safely. Money paths are tested through the real API, on synthetic data at real volume.",
      summary: {
        role: "Proposed and built the money path end to end, and the tests that prove it",
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
        role: "Built the models and the serving path, and took them live in client products",
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
        role: "Built the game UI for every screen, the new mobile app and the real time logic behind them",
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
    {
      id: "igaming-suite",
      zone: "casino",
      title: "An iGaming suite: slots, bet tables and live games",
      caption: "Games for operators where the result is decided on the server before anything spins, the client only animates " +
        "it, and every bet and win moves through the operator's wallet.",
      summary: {
        role: "Built game interfaces, mobile apps and real time logic across live casino, slots and bet tables",
        scale: "Games served to many operators' players on desktop, tablet and mobile",
        stack: ["JavaScript", "TypeScript", "PixiJS", "WebGL", "Canvas", "Node.js", "WebSockets", "Redux", "RxJS"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "ig-games",
            label: "Game clients",
            place: { col: 1, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ig-slots", label: "Slots", detail: "Reels and bonus rounds, WebGL" },
              { id: "ig-tables", label: "Bet tables", detail: "Roulette and card games on canvas" },
              { id: "ig-live", label: "Live games", detail: "Video with real time bets" },
              { id: "ig-lobby", label: "Lobby", detail: "Inside the operator's site" },
            ],
          },
          {
            id: "ig-server",
            label: "Game server",
            place: { col: 2, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ig-rounds", label: "Round engine", detail: "Bet, outcome, settlement" },
              { id: "ig-rng", label: "Random outcomes", detail: "On the server, before the reels stop" },
              { id: "ig-math", label: "Math models and paytables", detail: "Per game" },
              { id: "ig-bonus", label: "Bonus features", detail: "Free spins, multipliers" },
            ],
          },
          {
            id: "ig-integration",
            label: "Operator integration",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "ig-wallet", label: "Wallet API", detail: "Debit the bet, credit the win, roll back" },
              { id: "ig-onboarding", label: "Onboarding tooling", detail: "Integration automated" },
            ],
          },
          {
            id: "ig-control",
            label: "Control",
            place: { col: 3, row: 2 },
            nodes: [
              { id: "ig-history", label: "Round history", detail: "Every outcome kept for audit" },
              { id: "ig-limits", label: "Responsible gaming limits" },
              { id: "ig-config", label: "Configuration per jurisdiction" },
            ],
          },
          {
            id: "ig-operators",
            label: "Operators",
            isExternal: true,
            place: { col: 4, row: 1, rowSpan: 2 },
            nodes: [
              { id: "ig-sites", label: "Operator sites and apps" },
              { id: "ig-reports", label: "Reports and back office" },
            ],
          },
        ],
        edges: [
          { from: "ig-games", to: "ig-rounds" },
          { from: "ig-rounds", to: "ig-rng" },
          { from: "ig-math", to: "ig-rounds", style: "dashed" },
          { from: "ig-rounds", to: "ig-wallet", label: "debit, credit" },
          { from: "ig-wallet", to: "ig-sites" },
          { from: "ig-rounds", to: "ig-history" },
          { from: "ig-limits", to: "ig-rounds", style: "dashed" },
          { from: "ig-onboarding", to: "ig-sites" },
          { from: "ig-history", to: "ig-reports" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "A slot",
            regions: [
              { kind: "bar", label: "Balance and last win", size: 0.6 },
              { kind: "canvas", label: "Reels, animated to the server's result", size: 2.6 },
              { kind: "bar", label: "Paytable and rules", size: 0.6 },
              { kind: "actions", label: "Bet size, spin, autoplay", size: 0.9 },
            ],
          },
          {
            title: "Bonus round",
            regions: [
              { kind: "canvas", label: "The bonus scene", size: 2.2 },
              { kind: "overlay", label: "Free spins left and the multiplier", size: 1.2 },
              { kind: "stat", label: "Total won in the round" },
            ],
          },
          {
            title: "A roulette table",
            regions: [
              { kind: "canvas", label: "Betting grid, chips by touch", size: 2.4 },
              { kind: "bar", label: "Recent results", size: 0.6 },
              { kind: "actions", label: "Chips, repeat, undo, spin", size: 0.9 },
            ],
          },
          {
            title: "Round history",
            regions: [
              { kind: "list", label: "Each round: bet, outcome, payout", size: 2.4 },
              { kind: "bar", label: "Limits and time played", size: 0.6 },
            ],
          },
        ],
        decision: "The outcome is decided on the server before the client animates anything, so the animation can be as rich as it likes without ever changing a result.",
        outcome: "Rich animation on every screen, results that are always the server's, and every bet and win reconciled through the operator's wallet.",
      },
      journeys: [
        {
          title: "A player spins a slot",
          steps: [
            "Sets the bet and spins",
            "The server takes the bet through the operator's wallet and decides the outcome",
            "The reels animate to that result",
            "A win is credited back through the wallet",
            "A bonus triggers free spins with a multiplier",
          ],
        },
        {
          title: "An operator checks a round",
          steps: ["Opens the round history", "Sees the bet, the outcome and the payout", "Matches it to the wallet transaction"],
        },
      ],
    },
  ],
  mmo: [
    GOZ_BLUEPRINT,
    ARCAVIUM_BLUEPRINT,
    {
      id: "location-game",
      zone: "mmo",
      title: "A location based mobile game",
      caption: "A game played on the real map: rewards spawn near the player, are caught through the camera and land in the " +
        "wallet, while location checks keep spoofers out.",
      summary: {
        role: "Proposed and built the core the app and its game run on",
        scale: "A game inside a large consumer app",
        stack: ["React Native", "Kotlin", "Java", "C/C++", "RxJS", "Maps", "Location services", "Camera"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "lg-client",
            label: "Mobile client",
            place: { col: 1, row: 1, rowSpan: 2 },
            nodes: [
              { id: "lg-map", label: "Map view", detail: "Tiles and the player's position" },
              { id: "lg-gps", label: "Location", detail: "Sampled to save battery" },
              { id: "lg-camera", label: "Camera catch", detail: "AR over the real world" },
              { id: "lg-native", label: "Native modules", detail: "Kotlin, Java, C/C++" },
            ],
          },
          {
            id: "lg-spawns",
            label: "Spawns",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "lg-spawn", label: "Spawn service", detail: "Rewards near each player" },
              { id: "lg-geo", label: "Geo index", detail: "Nearby lookups" },
              { id: "lg-drops", label: "Timed drops", detail: "Events in set places" },
            ],
          },
          {
            id: "lg-fair",
            label: "Fair play",
            place: { col: 2, row: 2 },
            nodes: [
              { id: "lg-spoof", label: "Location checks", detail: "Impossible speed and jumps" },
              { id: "lg-limits", label: "Catch limits", detail: "Per player and area" },
            ],
          },
          {
            id: "lg-play",
            label: "Play",
            place: { col: 3, row: 1, rowSpan: 2 },
            nodes: [
              { id: "lg-catch", label: "Catch", detail: "Validated on the server" },
              { id: "lg-collection", label: "Collection" },
              { id: "lg-push", label: "Real time notifications" },
            ],
          },
          {
            id: "lg-rewards",
            label: "Rewards",
            place: { col: 4, row: 1, rowSpan: 2 },
            nodes: [
              { id: "lg-wallet", label: "In app wallet" },
              { id: "lg-claim", label: "Claim on chain", detail: "Confirmed from the indexer" },
            ],
          },
        ],
        edges: [
          { from: "lg-gps", to: "lg-spawn", label: "position" },
          { from: "lg-spawn", to: "lg-geo" },
          { from: "lg-spawn", to: "lg-map", label: "nearby" },
          { from: "lg-camera", to: "lg-catch" },
          { from: "lg-fair", to: "lg-catch", style: "dashed" },
          { from: "lg-catch", to: "lg-collection" },
          { from: "lg-catch", to: "lg-wallet" },
          { from: "lg-wallet", to: "lg-claim" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Map",
            regions: [
              { kind: "bar", label: "Events nearby", size: 0.6 },
              { kind: "canvas", label: "The real map, the player and rewards nearby", size: 3 },
              { kind: "actions", label: "Collection, wallet", size: 0.8 },
            ],
          },
          {
            title: "Catch",
            regions: [
              { kind: "media", label: "Camera, with the reward over the real world", size: 3 },
              { kind: "actions", label: "Catch", size: 0.8 },
            ],
          },
          {
            title: "Reward",
            regions: [
              { kind: "card", label: "What was caught", size: 1.4 },
              { kind: "steps", label: "In the wallet, then claimed on chain" },
              { kind: "actions", label: "Claim", size: 0.8 },
            ],
          },
          {
            title: "Collection",
            regions: [
              { kind: "stat", label: "Caught so far" },
              { kind: "list", label: "Rewards by event and place", size: 2 },
            ],
          },
        ],
        decision: "Spawns and catches are decided on the server around the player's checked position, so the phone draws the game but cannot invent rewards.",
        outcome: "A game on the real map inside the app, with rewards that land in the wallet and confirm from the chain.",
      },
      journeys: [
        {
          title: "A fan on a walk",
          steps: [
            "Opens the map and sees a reward nearby",
            "Walks to it",
            "Catches it through the camera",
            "The server checks the location and the catch",
            "The reward lands in the wallet and can be claimed on chain",
          ],
        },
      ],
    },
    {
      id: "render-performance",
      zone: "mmo",
      title: "Rendering at frame rate: GPU and heavy animation",
      caption: "Heavy animation on phones and desktops: one loop, sprites drawn once and reused, draws batched for the GPU, " +
        "nothing allocated per frame, and profiling that finds the frame that drops.",
      summary: {
        role: "Built profiling tools for canvas rendering, native modules for mobile and desktop, and the animation engines on this site",
        scale: "Canvas and WebGL games and interfaces on phones, tablets, desktops and launchers",
        stack: ["PixiJS", "WebGL", "Canvas", "C/C++", "Electron", "React Native", "Lighthouse", "Performance traces"],
      },
      architecture: {
        columns: 4,
        groups: [
          {
            id: "rp-loop",
            label: "Frame loop",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "rp-raf", label: "One loop", detail: "A fixed rate, paused off screen" },
              { id: "rp-budget", label: "Frame budget", detail: "Update, then draw" },
              { id: "rp-still", label: "Reduced motion", detail: "A still frame instead" },
            ],
          },
          {
            id: "rp-assets",
            label: "Assets",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "rp-atlas", label: "Sprite and glyph atlases", detail: "Drawn once, reused" },
              { id: "rp-cache", label: "Cached glows and gradients" },
              { id: "rp-pools", label: "Object pools", detail: "Nothing allocated per frame" },
            ],
          },
          {
            id: "rp-gpu",
            label: "GPU",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "rp-batch", label: "Batched draws", detail: "WebGL through PixiJS" },
              { id: "rp-composite", label: "Transforms and opacity", detail: "Composited, never layout" },
              { id: "rp-opaque", label: "Opaque canvases", detail: "Less to blend" },
            ],
          },
          {
            id: "rp-native",
            label: "Native and tools",
            place: { col: 4, row: 1 },
            nodes: [
              { id: "rp-modules", label: "Native modules", detail: "C/C++ for mobile and desktop" },
              { id: "rp-profiler", label: "Profiling tools", detail: "Canvas rendering" },
              { id: "rp-audits", label: "Lighthouse and traces", detail: "On every release" },
            ],
          },
        ],
        edges: [
          { from: "rp-raf", to: "rp-budget" },
          { from: "rp-loop", to: "rp-assets" },
          { from: "rp-assets", to: "rp-gpu" },
          { from: "rp-profiler", to: "rp-gpu", label: "finds the dropped frame", style: "dashed" },
        ],
      },
      journeys: [
        {
          title: "How one frame is spent",
          steps: [
            "The loop wakes at its fixed rate, or not at all off screen",
            "State updates first",
            "Cached sprites are drawn, batched for the GPU",
            "Only transforms and opacity change, so nothing reflows",
            "The rest of the frame stays idle for input",
          ],
        },
        {
          title: "Finding a dropped frame",
          steps: [
            "Profile the scene on a real low end device",
            "Find the long task in the frame",
            "Cache it, move it out of the frame or into a native module",
            "Measure again, on every release",
          ],
        },
      ],
    },
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
        role: "Proposed and built the architecture for web and desktop, and introduced and architected the mobile app",
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
              { id: "gl-hosting", label: "Hosting", detail: "AWS and Vercel", span: 2 },
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
