import { BlueprintContent } from "@/types/blueprints";

// Architecture drawings and product wireframes, each shown in the zone it belongs to. Structure only:
// no hosts, addresses, versions, amounts or traffic figures, and the platform stays unnamed.
export const blueprintContent: BlueprintContent = {
  labels: {
    architecture: "Architecture",
    productFlow: "Product flow",
    decision: "Product decision",
    outcome: "Outcome",
  },
  ai: [
    {
      id: "ai-workflow",
      zone: "ai",
      title: "My AI workflow, with its guardrails",
      caption: "The agent works inside a contract: policy, scoped tools, verification and a person's review. Nothing merges on its own.",
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
    },
  ],
  chain: [
    {
      id: "coinon-chain",
      zone: "chain",
      title: "CoinOn: from cross chain to a chain of its own",
      caption: "Bridges and indexers connected three ecosystems first; then the team built a chain of its own.",
      architecture: {
        columns: 1,
        groups: [
          {
            id: "coinon-product",
            label: "Product",
            columns: 3,
            place: { col: 1, row: 1 },
            nodes: [
              { id: "coinon-app", label: "Mobile app", detail: "Flutter" },
              { id: "coinon-web", label: "Web platform", detail: "Next.js and Nuxt" },
              { id: "coinon-sdk", label: "Partner SDKs and APIs" },
              { id: "coinon-backend", label: "Microservice backend", detail: "Node.js", span: 3 },
            ],
          },
          {
            id: "coinon-links",
            columns: 4,
            place: { col: 1, row: 2 },
            nodes: [
              { id: "coinon-indexers", label: "Indexers", span: 2 },
              { id: "coinon-bridges", label: "Custom bridges" },
            ],
          },
          {
            id: "coinon-chains",
            label: "Chains",
            columns: 4,
            place: { col: 1, row: 3 },
            nodes: [
              { id: "solana", label: "Solana" },
              { id: "evm", label: "EVM chains" },
              { id: "polkadot", label: "Polkadot", detail: "Parachains first" },
              { id: "own-chain", label: "Own chain", detail: "Rust on Substrate" },
            ],
          },
        ],
        edges: [
          { from: "coinon-app", to: "coinon-backend" },
          { from: "coinon-web", to: "coinon-backend" },
          { from: "coinon-sdk", to: "coinon-backend" },
          { from: "coinon-backend", to: "coinon-indexers" },
          { from: "coinon-indexers", to: "solana" },
          { from: "coinon-indexers", to: "evm" },
          { from: "coinon-indexers", to: "polkadot" },
          { from: "coinon-bridges", to: "solana", style: "link" },
          { from: "coinon-bridges", to: "evm", style: "link" },
          { from: "coinon-bridges", to: "polkadot", style: "link" },
          { from: "polkadot", to: "own-chain", label: "replaced by" },
          { from: "coinon-backend", to: "own-chain" },
        ],
      },
    },
    {
      id: "chiliz-core",
      zone: "chain",
      title: "Chiliz: one mobile core for seven squads",
      caption: "State, routing and lifecycle solved once, in a core every squad builds on, with on chain features inside ordinary app flows.",
      architecture: {
        columns: 4,
        groups: [
          {
            id: "chiliz-top",
            columns: 2,
            place: { col: 1, row: 1, colSpan: 4 },
            nodes: [
              { id: "squads", label: "Seven product squads", detail: "Features built on the core" },
              { id: "tdd", label: "Test first", detail: "95%+ coverage", kind: "note" },
            ],
          },
          {
            id: "chiliz-core-group",
            label: "V2 core, shared",
            columns: 3,
            place: { col: 1, row: 2, colSpan: 4 },
            nodes: [
              { id: "routing", label: "Routing" },
              { id: "lifecycle", label: "App lifecycle", detail: "Back press, resume" },
              { id: "errors", label: "Error reporting" },
              { id: "design-system", label: "Design system", detail: "Component library" },
              { id: "native", label: "Native modules", detail: "C/C++, Java, Kotlin" },
              { id: "state", label: "Reactive state", detail: "RxJS orchestration" },
            ],
          },
          {
            id: "chiliz-surfaces",
            label: "Surfaces",
            columns: 3,
            place: { col: 1, row: 3, colSpan: 3 },
            nodes: [
              { id: "chiliz-mobile", label: "Mobile app" },
              { id: "chiliz-web", label: "Marketing website" },
              { id: "chiliz-office", label: "Back office" },
            ],
          },
          {
            id: "chiliz-chain",
            place: { col: 4, row: 3 },
            nodes: [{ id: "on-chain", label: "On chain integrations" }],
          },
        ],
        edges: [
          { from: "squads", to: "chiliz-core-group" },
          { from: "tdd", to: "chiliz-core-group", style: "link" },
          { from: "chiliz-core-group", to: "chiliz-surfaces" },
          { from: "state", to: "on-chain" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "Club home",
            regions: [
              { kind: "stat", label: "Token balance" },
              { kind: "list", label: "Open actions", size: 2 },
              { kind: "card", label: "Rewards" },
            ],
          },
          {
            title: "Take part",
            regions: [
              { kind: "card", label: "The question" },
              { kind: "list", label: "Options", size: 2 },
              { kind: "bar", label: "Cost in tokens, closing time", size: 0.7 },
              { kind: "actions", label: "Confirm", size: 0.8 },
            ],
          },
          {
            title: "Confirm on chain",
            regions: [
              { kind: "card", label: "Signed from the app" },
              { kind: "overlay", label: "Pending, with a clear status", size: 2 },
              { kind: "bar", label: "Error state if it fails", size: 0.7 },
            ],
          },
          {
            title: "Result",
            regions: [
              { kind: "stat", label: "Outcome" },
              { kind: "card", label: "Your reward", size: 1.5 },
              { kind: "actions", label: "Share", size: 0.8 },
            ],
          },
        ],
        decision: "On chain actions sit inside an ordinary app flow, with explicit pending and error states, on a core rebuilt for stability.",
        outcome: "The app went from critically unstable to a shared core seven squads build on, with on chain integrations in " +
          "production. The platform reached 1.5M+ users in 167 countries.",
      },
    },
  ],
  platform: [
    {
      id: "conrad-cms",
      zone: "matrix",
      title: "Conrad: the CMS migration target",
      caption: "One storefront, two content sources behind one adapter, switched per country by a feature flag, so the legacy system retires market by market.",
      architecture: {
        columns: 3,
        groups: [
          {
            id: "conrad-shopper",
            place: { col: 1, row: 1 },
            nodes: [{ id: "shopper", label: "Shopper", kind: "actor" }],
          },
          {
            id: "conrad-edge",
            label: "Edge and cache",
            place: { col: 1, row: 2 },
            nodes: [
              { id: "cdn", label: "CDN and WAF", detail: "Edge cache per country" },
              { id: "origin-cache", label: "Origin cache" },
            ],
          },
          {
            id: "conrad-store",
            label: "Storefront, Nuxt",
            place: { col: 2, row: 1, rowSpan: 2 },
            nodes: [
              { id: "browser", label: "Browser client", detail: "Vue, hydration" },
              { id: "ssr", label: "Server runtime", detail: "SSR and BFF routes" },
              { id: "adapter", label: "CMS adapter", detail: "One typed contract" },
              { id: "flag-sdk", label: "Feature flag SDK", detail: "Provider per country" },
            ],
          },
          {
            id: "conrad-flags",
            place: { col: 2, row: 3 },
            nodes: [{ id: "flag-relay", label: "Flag relay", detail: "Company standard" }],
          },
          {
            id: "conrad-cms-group",
            label: "New CMS",
            columns: 2,
            place: { col: 3, row: 1 },
            nodes: [
              { id: "headless", label: "Headless CMS", detail: "Admin UI and REST API; publishing bans the cache", span: 2 },
              { id: "cms-db", label: "PostgreSQL", detail: "Managed", kind: "store" },
              { id: "preview", label: "Editor preview", detail: "Viewport, audience, market" },
            ],
          },
          {
            id: "conrad-legacy",
            label: "Legacy, runs in parallel",
            isExternal: true,
            place: { col: 3, row: 2 },
            nodes: [{ id: "legacy-cms", label: "Legacy CMS", detail: "Retires on a fixed date" }],
          },
        ],
        edges: [
          { from: "shopper", to: "cdn" },
          { from: "cdn", to: "origin-cache" },
          { from: "origin-cache", to: "ssr" },
          { from: "ssr", to: "browser" },
          { from: "ssr", to: "adapter" },
          { from: "flag-sdk", to: "adapter" },
          { from: "flag-relay", to: "flag-sdk" },
          { from: "adapter", to: "headless", label: "new" },
          { from: "adapter", to: "legacy-cms", label: "legacy" },
          { from: "headless", to: "cms-db" },
          { from: "headless", to: "preview" },
          { from: "headless", to: "origin-cache", style: "dashed" },
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
        ],
        decision: "Targeting is set per block, not per page, and the editor sees every variant before publishing.",
        outcome: "One page serves several markets and audiences from one place, and a phone preview inside a desktop editor " +
          "renders as a real phone would, through container queries.",
      },
    },
    {
      id: "platform-core",
      zone: "matrix",
      title: "My platform: a core behind adapters",
      caption: "One core package holds the business logic and the apps are thin shells. Every vendor and host sits behind an " +
        "adapter, so a provider can be added, run in parallel and switched by configuration.",
      architecture: {
        columns: 1,
        groups: [
          {
            id: "platform-apps",
            label: "Apps, thin shells",
            columns: 4,
            place: { col: 1, row: 1 },
            nodes: [
              { id: "consumer-web", label: "Consumer web app", detail: "PWA" },
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
              { id: "events", label: "Event bus", detail: "Typed, in process" },
              { id: "engines", label: "Engines and registries", span: 4 },
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
      title: "My platform: how money moves",
      caption: "A payment is booked twice on purpose, as two balancing ledger rows under one correlation id, and every step " +
        "can be retried safely. Money paths are tested through the real API, on synthetic data at real volume.",
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
    },
  ],
  casino: [
    {
      id: "live-tables",
      zone: "casino",
      title: "Authentic Gaming: live tables to operators",
      caption: "Real tables streamed from casino floors to operators' players, with a real time path for bets and results.",
      architecture: {
        columns: 4,
        groups: [
          {
            id: "casino-floor",
            label: "Casino floor",
            place: { col: 1, row: 1 },
            nodes: [{ id: "live-table", label: "Live table", detail: "Wide angle HD stream" }],
          },
          {
            id: "casino-platform",
            label: "Provider platform",
            columns: 2,
            place: { col: 2, row: 1, colSpan: 2 },
            nodes: [
              { id: "streaming", label: "Video streaming" },
              { id: "game-ui", label: "Game UI", detail: "Desktop and mobile, canvas" },
              { id: "realtime", label: "Real time service", detail: "Node.js and WebSockets" },
              { id: "casino-app", label: "Mobile app" },
              { id: "onboarding", label: "Operator onboarding tools", detail: "Integration automated", span: 2 },
            ],
          },
          {
            id: "casino-operators",
            label: "Operators",
            isExternal: true,
            place: { col: 4, row: 1 },
            nodes: [
              { id: "operator-site", label: "Operator site" },
              { id: "operator-app", label: "Operator app" },
            ],
          },
        ],
        edges: [
          { from: "live-table", to: "streaming" },
          { from: "streaming", to: "game-ui" },
          { from: "live-table", to: "realtime" },
          { from: "realtime", to: "game-ui", isTwoWay: true, label: "bets and results" },
          { from: "game-ui", to: "operator-site" },
          { from: "casino-app", to: "operator-app" },
          { from: "onboarding", to: "casino-operators" },
        ],
      },
      wireframe: {
        device: "phone",
        screens: [
          {
            title: "A live table in portrait",
            regions: [
              { kind: "media", label: "Live video of the real table", size: 2.6 },
              { kind: "bar", label: "Bets open, bets closed, result, timer", size: 0.6 },
              { kind: "canvas", label: "Bet table on canvas, chips by touch", size: 2.6 },
              { kind: "actions", label: "Balance, chips, repeat, undo, confirm", size: 0.9 },
            ],
          },
        ],
        decision: "The table is drawn on canvas with a real time channel for round state, so bets and results stay in step with the stream.",
        outcome: "The CTO credits the desktop and mobile game UI with letting the company deliver the most innovative user " +
          "experience in the industry, and the new mobile app shipped. Profiling tools kept canvas rendering smooth.",
      },
    },
  ],
  mmo: [
    {
      id: "goz-engine",
      zone: "mmo",
      title: "Gods of Zushin: engine to live operations",
      caption: "A custom engine and its own protocol, with the launcher, payments and operations tooling around it.",
      architecture: {
        columns: 4,
        groups: [
          {
            id: "goz-client",
            label: "Player side",
            place: { col: 1, row: 1 },
            nodes: [
              { id: "launcher", label: "Launcher", detail: "Electron and C#" },
              { id: "game-client", label: "Game client", detail: "C/C++ engine" },
            ],
          },
          {
            id: "goz-wire",
            label: "Wire",
            place: { col: 2, row: 1 },
            nodes: [
              { id: "crypto", label: "Own cryptography", detail: "And compression" },
              { id: "anti-tamper", label: "Anti tamper", detail: "Accounts and inventory" },
            ],
          },
          {
            id: "goz-server",
            label: "Server side",
            place: { col: 3, row: 1 },
            nodes: [
              { id: "patching", label: "Live patching" },
              { id: "game-server", label: "Game server", detail: "C/C++ with Lua scripts" },
              { id: "game-db", label: "Game database", kind: "store" },
              { id: "goz-web", label: "Website and account API", detail: "Vue and Laravel" },
            ],
          },
          {
            id: "goz-ops",
            label: "Operations",
            place: { col: 4, row: 1 },
            nodes: [
              { id: "moderation", label: "Moderation tools" },
              { id: "analytics", label: "Analytics dashboards" },
              { id: "goz-payments", label: "Payments", detail: "Purchases and subscriptions" },
            ],
          },
        ],
        edges: [
          { from: "launcher", to: "patching" },
          { from: "patching", to: "game-client", label: "updates", style: "dashed" },
          { from: "game-client", to: "crypto" },
          { from: "crypto", to: "game-server" },
          { from: "anti-tamper", to: "game-server" },
          { from: "game-server", to: "game-db" },
          { from: "goz-web", to: "game-db" },
          { from: "goz-web", to: "goz-payments" },
          { from: "moderation", to: "game-server" },
          { from: "analytics", to: "game-db" },
        ],
      },
    },
    {
      id: "goz-hardening",
      zone: "mmo",
      title: "My game server, before and after hardening",
      caption: "Before, the origin answered the internet directly. After, only the CDN and expected game traffic reach it. " +
        "Anti cheat is not anti DDoS: a flood that never signs in has to be stopped before the game.",
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
      id: "hyperplay-clients",
      zone: "mmo",
      title: "HyperPlay: one platform, three clients",
      caption: "A game store and developer portal on the web, a desktop launcher and a mobile app, sharing one back end and one design system.",
      architecture: {
        columns: 4,
        groups: [
          {
            id: "hp-shared",
            label: "Shared",
            columns: 2,
            place: { col: 1, row: 1, colSpan: 4 },
            nodes: [
              { id: "hp-design", label: "Design system", detail: "Storybook and tests" },
              { id: "hp-tooling", label: "Developer tooling", detail: "CLI and scaffolders" },
            ],
          },
          {
            id: "hp-clients",
            label: "Clients",
            columns: 4,
            place: { col: 1, row: 2, colSpan: 4 },
            nodes: [
              { id: "hp-store", label: "Website and game store", detail: "Next.js" },
              { id: "hp-portal", label: "Developer portal" },
              { id: "hp-launcher", label: "Desktop launcher", detail: "Electron, native modules" },
              { id: "hp-mobile", label: "Mobile app", detail: "React Native" },
            ],
          },
          {
            id: "hp-backend",
            label: "Back end",
            columns: 2,
            place: { col: 1, row: 3, colSpan: 2 },
            nodes: [
              { id: "hp-api", label: "Services", detail: "Node.js, GraphQL" },
              { id: "hp-db", label: "PostgreSQL", kind: "store" },
            ],
          },
          {
            id: "hp-web3",
            label: "Web3",
            columns: 2,
            place: { col: 3, row: 3, colSpan: 2 },
            nodes: [
              { id: "hp-wallets", label: "Wallets", detail: "EVM chains" },
              { id: "hp-contracts", label: "Smart contracts", detail: "Audited for attack paths" },
            ],
          },
        ],
        edges: [
          { from: "hp-shared", to: "hp-clients" },
          { from: "hp-clients", to: "hp-api" },
          { from: "hp-api", to: "hp-db" },
          { from: "hp-launcher", to: "hp-wallets" },
          { from: "hp-wallets", to: "hp-contracts" },
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
              { kind: "list", label: "Files", size: 1.4 },
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
    },
  ],
};
