import { Blueprint } from "@/types/blueprints";

// Kinds of architecture built more than once, shown in the engineering section. No company is named. Every drawing is a glance, not the full design.
const blueprints: Blueprint[] = [
  {
    id: "financial-system",
    tab: "Financial system",
    zone: "matrix",
    title: "A full financial system, end to end, Web2 and Web3",
    caption: "Web2 and Web3 on the same rails: cards through Stripe and bank transfers in, multi currency wallets on double " +
      "entry ledgers, payouts to banks or wallets under dual approval, on and off ramps between fiat and a stablecoin, and " +
      "reconciliation across all of it.",
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
            { id: "fin-cards", label: "Cards", detail: "Stripe behind a gateway adapter, tokenised" },
            { id: "fin-bank", label: "Bank transfers", detail: "In from and out to bank accounts" },
            { id: "fin-local", label: "Local payment methods", detail: "Routed with risk checks and fallback" },
            { id: "fin-subs", label: "Plans and subscriptions", detail: "Multi provider pricing" },
          ],
        },
        {
          id: "fin-web3",
          label: "Web3 rails",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "fin-ramps", label: "On and off ramps", detail: "Fiat to stablecoin and back" },
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
            { id: "fin-withdraw", label: "Withdrawals", detail: "To a bank or a wallet, in installments" },
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
        { from: "fin-ramps", to: "fin-stable" },
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
    tab: "Headless commerce",
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
    tab: "Modular core",
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
    tab: "One payment",
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
    tab: "Ranking",
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
];

export default blueprints;
