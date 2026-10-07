import { Blueprint } from "@/types/blueprints";

// Web3 kinds of architecture, drawn in the chain zone. No company is named. Every drawing is a glance, not the full design.
const blueprints: Blueprint[] = [
  {
    id: "web3-exchange",
    tab: "Trading",
    zone: "chain",
    title: "A Web3 exchange: trading across chains",
    caption: "Tokens and NFTs traded across chains: deposits and withdrawals per chain, pairs that are supported or not, " +
      "routes from one token to another, settlement on chain, and balances confirmed from node providers and indexers.",
    summary: {
      role: "Proposed and built exchange and trading flows across chains, inside apps and products",
      scale: "Large consumer user bases, many chains and many tokens",
      stack: ["TypeScript", "React Native", "Node.js", "Ethers", "Web3.js", "WalletConnect", "Alchemy", "The Graph", "Solidity", "Rust"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "tr-clients",
          label: "Clients",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "tr-apps", label: "Web and mobile apps", detail: "One shared core" },
            { id: "tr-partners", label: "Partner API" },
            { id: "tr-prices", label: "Live prices", detail: "Streamed to every client" },
          ],
        },
        {
          id: "tr-markets",
          label: "Markets",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "tr-pairs", label: "Supported pairs", detail: "Each token listed against bases" },
            { id: "tr-route", label: "Routing", detail: "Token to token through supported pairs" },
            { id: "tr-match", label: "Matching", detail: "Order book or pool" },
            { id: "tr-nfts", label: "NFT markets", detail: "Listings, bids, transfers" },
          ],
        },
        {
          id: "tr-settlement",
          label: "Settlement",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "tr-settle", label: "Settlement", detail: "On chain, or on the internal ledger" },
            { id: "tr-ledger", label: "Internal ledger", detail: "Every trade balanced", kind: "store" },
            { id: "tr-fees", label: "Fees" },
          ],
        },
        {
          id: "tr-wallets",
          label: "Wallets per chain",
          place: { col: 2, row: 2, colSpan: 2 },
          columns: 2,
          nodes: [
            { id: "tr-deposit", label: "Deposits", detail: "Credited after confirmations" },
            { id: "tr-withdraw", label: "Withdrawals", detail: "To whitelisted addresses" },
            { id: "tr-hot", label: "Hot wallets", detail: "For daily flow" },
            { id: "tr-cold", label: "Cold storage", detail: "For reserves" },
          ],
        },
        {
          id: "tr-chains",
          label: "Chains and data",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "tr-btc", label: "Bitcoin" },
            { id: "tr-eth", label: "Ethereum and EVM chains" },
            { id: "tr-sol", label: "Solana" },
            { id: "tr-dot", label: "Polkadot and others" },
            { id: "tr-indexers", label: "Node providers and indexers", detail: "Alchemy, The Graph, our own" },
          ],
        },
      ],
      edges: [
        { from: "tr-clients", to: "tr-markets" },
        { from: "tr-pairs", to: "tr-route" },
        { from: "tr-route", to: "tr-match" },
        { from: "tr-match", to: "tr-settle" },
        { from: "tr-settle", to: "tr-ledger" },
        { from: "tr-wallets", to: "tr-chains" },
        { from: "tr-indexers", to: "tr-deposit", label: "confirmed" },
        { from: "tr-hot", to: "tr-cold", style: "link" },
      ],
    },
    wireframe: {
      device: "phone",
      screens: [
        {
          title: "Markets",
          regions: [
            { kind: "bar", label: "Search, and the base to trade against", size: 0.7 },
            { kind: "list", label: "Pairs with price and change; unsupported pairs not offered", size: 2.4 },
          ],
        },
        {
          title: "Swap",
          regions: [
            { kind: "form", label: "From one token, to another" },
            { kind: "card", label: "The route, through supported pairs" },
            { kind: "bar", label: "Fee and slippage", size: 0.7 },
            { kind: "actions", label: "Confirm once", size: 0.8 },
          ],
        },
        {
          title: "Deposit",
          regions: [
            { kind: "list", label: "Pick the chain" },
            { kind: "media", label: "Address and code for that chain", size: 1.4 },
            { kind: "bar", label: "Confirmations needed", size: 0.7 },
          ],
        },
        {
          title: "Withdraw",
          regions: [
            { kind: "form", label: "Chain and whitelisted address" },
            { kind: "stat", label: "Amount and network fee" },
            { kind: "steps", label: "Checks, then sent on chain" },
          ],
        },
        {
          title: "An NFT",
          regions: [
            { kind: "media", label: "The NFT", size: 1.6 },
            { kind: "list", label: "Bids and history" },
            { kind: "actions", label: "Buy, bid, list", size: 0.8 },
          ],
        },
      ],
      decision: "Every token is listed against supported bases, so any two tokens can trade through a route even without a " +
        "direct pair, and the app only offers routes that exist.",
      outcome: "Tokens and NFTs traded across chains in an ordinary app flow, with deposits credited only once the chain confirms them.",
    },
    journeys: [
      {
        title: "Swap one token for another",
        steps: [
          "Picks the token to sell and the token to buy",
          "With no direct pair, the route goes through a supported base",
          "Sees the quote with fees and slippage",
          "Confirms once, and the trade settles",
          "Both balances update",
        ],
      },
      {
        title: "In on one chain, out on another",
        steps: [
          "Deposits on one chain",
          "It is credited once the node provider reports enough confirmations",
          "Trades into a token on another chain",
          "Withdraws to a whitelisted address after the checks",
        ],
      },
    ],
  },
  {
    id: "exchange-risk",
    tab: "Listing and risk",
    zone: "chain",
    title: "Exchange onboarding, listing and risk",
    caption: "How an account gets verified, how a token gets reviewed or listed automatically on volume, and how payments " +
      "and withdrawals pause themselves when something looks fraudulent, until a person decides.",
    summary: {
      role: "Proposed and built the onboarding, listing and risk flows",
      scale: "Exchanges and token platforms with many listings",
      stack: ["TypeScript", "Node.js", "PostgreSQL", "Identity verification providers", "Sanctions screening", "Event streams"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "rk-kyc",
          label: "Account verification",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "rk-signup", label: "Sign up" },
            { id: "rk-identity", label: "Identity checks", detail: "Documents and liveness" },
            { id: "rk-screening", label: "Screening", detail: "Sanctions and politically exposed" },
            { id: "rk-tier", label: "KYC tier", detail: "Unlocks limits" },
          ],
        },
        {
          id: "rk-listing",
          label: "Listing",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "rk-apply", label: "Application", detail: "Project, contracts, team" },
            { id: "rk-review", label: "Review", detail: "Contracts and team checked" },
            { id: "rk-auto", label: "Auto listing", detail: "When volume and holders pass thresholds" },
            { id: "rk-delist", label: "Delisting", detail: "When a token fails the bar" },
          ],
        },
        {
          id: "rk-signals",
          label: "Fraud signals",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "rk-velocity", label: "Velocity and volume spikes" },
            { id: "rk-disputes", label: "Card disputes and chargebacks" },
            { id: "rk-chainflags", label: "On chain flags", detail: "Known bad addresses" },
            { id: "rk-device", label: "Device and location changes" },
          ],
        },
        {
          id: "rk-actions",
          label: "Actions",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "rk-score", label: "Risk score" },
            { id: "rk-pause", label: "Auto pause", detail: "Payments and withdrawals held" },
            { id: "rk-human", label: "Manual review", detail: "A person decides" },
            { id: "rk-outcome", label: "Release or freeze", detail: "Logged" },
          ],
        },
      ],
      edges: [
        { from: "rk-signup", to: "rk-identity" },
        { from: "rk-identity", to: "rk-screening" },
        { from: "rk-screening", to: "rk-tier" },
        { from: "rk-apply", to: "rk-review" },
        { from: "rk-auto", to: "rk-delist", style: "dashed" },
        { from: "rk-signals", to: "rk-score" },
        { from: "rk-score", to: "rk-pause", label: "over threshold" },
        { from: "rk-pause", to: "rk-human" },
        { from: "rk-human", to: "rk-outcome" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Verify your identity",
          regions: [
            { kind: "steps", label: "Document, selfie, address" },
            { kind: "media", label: "Capture", size: 1.6 },
            { kind: "bar", label: "Status: checking, approved or more needed" },
          ],
        },
        {
          title: "Listing queue",
          regions: [
            { kind: "bar", label: "Applications and auto listing candidates" },
            { kind: "list", label: "Each token: volume, holders, contract checks, status", size: 2.2 },
            { kind: "actions", label: "Approve, reject, delist" },
          ],
        },
        {
          title: "Risk queue",
          regions: [
            { kind: "bar", label: "Alerts by risk score" },
            { kind: "list", label: "Paused payments and withdrawals, with the signals behind each", size: 2.2 },
            { kind: "actions", label: "Release or freeze, with a reason" },
          ],
        },
      ],
      decision: "Limits follow the KYC tier, listings follow rules rather than favours, and anything that looks fraudulent pauses itself first and waits for a person.",
      outcome: "Money stops before it leaves when something looks wrong, and every release or freeze is a logged human decision.",
    },
    journeys: [
      {
        title: "A new account",
        steps: ["Signs up", "Passes document and liveness checks", "Is screened", "The KYC tier unlocks deposits, trading and its limits"],
      },
      {
        title: "A token gets listed",
        steps: [
          "The project applies, or crosses the volume and holder thresholds",
          "Contracts and team are reviewed, or it lists automatically",
          "It is watched against the bar",
          "It is delisted if it fails",
        ],
      },
      {
        title: "A suspicious payment",
        steps: [
          "Signals spike and the risk score passes its threshold",
          "Payments and withdrawals for the account pause on their own",
          "A person reviews the signals",
          "The money is released or frozen, and the decision is logged",
        ],
      },
    ],
  },
  {
    id: "web3-assets",
    tab: "Asset management",
    zone: "chain",
    title: "On chain asset management for large investors",
    caption: "Funds for whales and institutions: managers run vaults under policies investors can read, deposits mint " +
      "shares at the vault's value, positions span DeFi protocols, and fees, limits and reporting are enforced by contracts.",
    summary: {
      role: "Worked on on chain asset management for large investors, and built wallet and asset flows across products",
      scale: "Funds for whales and institutions, across protocols and chains",
      stack: ["Solidity", "Ethers", "Wagmi", "The Graph", "Alchemy", "Price oracles", "Multi signature wallets", "TypeScript"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "am-people",
          label: "People",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "am-investors", label: "Investors", detail: "Whales and institutions", kind: "actor" },
            { id: "am-manager", label: "Fund manager", kind: "actor" },
            { id: "am-signers", label: "Multi signature", detail: "Several keys to change the rules" },
          ],
        },
        {
          id: "am-vault",
          label: "Vault",
          place: { col: 2, row: 1, rowSpan: 2 },
          nodes: [
            { id: "am-shares", label: "Shares", detail: "Minted at the vault's value" },
            { id: "am-valuation", label: "Valuation", detail: "Prices from oracles" },
            { id: "am-policies", label: "Policies", detail: "Allowed assets, limits, who may deposit" },
            { id: "am-fees", label: "Fees", detail: "Management and performance" },
          ],
        },
        {
          id: "am-positions",
          label: "Positions",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "am-tokens", label: "Tokens and stablecoins" },
            { id: "am-defi", label: "DeFi positions", detail: "Lending, staking, liquidity pools" },
            { id: "am-nfts", label: "NFTs" },
          ],
        },
        {
          id: "am-reporting",
          label: "Reporting and risk",
          place: { col: 3, row: 2 },
          nodes: [
            { id: "am-report", label: "Reporting", detail: "Holdings and performance" },
            { id: "am-risk", label: "Risk limits", detail: "Concentration and drawdown" },
          ],
        },
        {
          id: "am-chain",
          label: "Chain",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "am-adapters", label: "Protocol adapters", detail: "One contract per protocol" },
            { id: "am-oracles", label: "Price oracles" },
            { id: "am-index", label: "Indexers", detail: "Positions read from the chain" },
            { id: "am-networks", label: "Ethereum and EVM chains" },
          ],
        },
      ],
      edges: [
        { from: "am-investors", to: "am-shares", label: "deposit" },
        { from: "am-signers", to: "am-policies", style: "dashed" },
        { from: "am-policies", to: "am-adapters", label: "allowed only" },
        { from: "am-adapters", to: "am-positions" },
        { from: "am-oracles", to: "am-valuation" },
        { from: "am-valuation", to: "am-shares" },
        { from: "am-index", to: "am-report" },
        { from: "am-risk", to: "am-policies", style: "dashed" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Vault overview",
          regions: [
            { kind: "stat", label: "Value and share price" },
            { kind: "list", label: "Holdings by protocol and chain", size: 2 },
            { kind: "card", label: "The policies, readable by every investor" },
          ],
        },
        {
          title: "Deposit",
          regions: [
            { kind: "form", label: "Amount" },
            { kind: "stat", label: "Shares received at today's value" },
            { kind: "bar", label: "Policy checks: allowed depositor, limits" },
            { kind: "actions", label: "Deposit" },
          ],
        },
        {
          title: "Manager console",
          regions: [
            { kind: "form", label: "A trade or a position change", size: 1.4 },
            { kind: "overlay", label: "Blocked if it breaks a policy" },
            { kind: "actions", label: "Execute through the protocol adapter" },
          ],
        },
        {
          title: "Reporting",
          regions: [
            { kind: "canvas", label: "Performance over time", size: 1.6 },
            { kind: "list", label: "Fees taken and risk limits" },
          ],
        },
      ],
      decision: "The rules live in contracts: what a manager may trade, who may deposit and what fees apply are enforced on " +
        "chain, so a large investor does not have to take the manager's word for it.",
      outcome: "Funds large investors can audit at any moment, with shares priced from oracles and positions read back from the chain.",
    },
    journeys: [
      {
        title: "An investor",
        steps: [
          "Reads the vault's policies",
          "Deposits, and shares are minted at the vault's value",
          "Follows holdings and performance",
          "Redeems shares when they choose",
        ],
      },
      {
        title: "A manager rebalances",
        steps: [
          "Proposes a trade",
          "The policies check it on chain",
          "It executes through the protocol's adapter",
          "The valuation updates for every investor",
        ],
      },
    ],
  },
  {
    id: "web3-infra",
    tab: "Infrastructure",
    zone: "chain",
    title: "Web3 infrastructure as a service",
    caption: "Nodes for the top chains run as a service behind one gateway: API keys, rate limits and usage metering, token " +
      "and NFT APIs, webhooks and indexing, across regions with failover.",
    summary: {
      role: "Proposed and ran the infrastructure layer: chains, nodes, indexers, bridges and the release pipeline",
      scale: "Many chains, many regions, many products building on it",
      stack: ["Rust", "Substrate", "Node.js", "Alchemy", "Infura", "The Graph", "Kubernetes", "AWS"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "ia-devs",
          label: "Developers",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ia-sdk", label: "SDKs" },
            { id: "ia-apps", label: "dApps and back ends" },
            { id: "ia-dashboard", label: "Dashboard", detail: "Keys, usage, alerts" },
          ],
        },
        {
          id: "ia-gateway",
          label: "Gateway",
          place: { col: 2, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ia-keys", label: "API keys", detail: "Per project" },
            { id: "ia-limits", label: "Rate limits", detail: "Per key and method" },
            { id: "ia-router", label: "Request router", detail: "Healthiest node per chain" },
            { id: "ia-cache", label: "Response cache", detail: "For repeat reads" },
            { id: "ia-metering", label: "Usage metering", detail: "Billed by compute" },
          ],
        },
        {
          id: "ia-apis",
          label: "APIs",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "ia-rpc", label: "JSON RPC" },
            { id: "ia-enhanced", label: "Token and NFT APIs" },
            { id: "ia-webhooks", label: "Webhooks", detail: "Address and contract events" },
          ],
        },
        {
          id: "ia-data",
          label: "Data",
          place: { col: 3, row: 2 },
          nodes: [
            { id: "ia-indexers", label: "Indexers", detail: "Subgraphs and our own" },
            { id: "ia-archive", label: "Archive data", detail: "Full history" },
          ],
        },
        {
          id: "ia-fleet",
          label: "Node fleet",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ia-btc", label: "Bitcoin" },
            { id: "ia-evm", label: "Ethereum and EVM chains" },
            { id: "ia-solana", label: "Solana" },
            { id: "ia-substrate", label: "Polkadot and Substrate" },
            { id: "ia-regions", label: "Several regions", detail: "Failover between them" },
          ],
        },
      ],
      edges: [
        { from: "ia-devs", to: "ia-keys" },
        { from: "ia-keys", to: "ia-limits" },
        { from: "ia-limits", to: "ia-router" },
        { from: "ia-router", to: "ia-fleet" },
        { from: "ia-cache", to: "ia-router", style: "dashed" },
        { from: "ia-gateway", to: "ia-apis" },
        { from: "ia-fleet", to: "ia-data" },
        { from: "ia-indexers", to: "ia-webhooks" },
        { from: "ia-metering", to: "ia-dashboard" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Dashboard",
          regions: [
            { kind: "bar", label: "Project and API key" },
            { kind: "stat", label: "Requests, errors and latency" },
            { kind: "list", label: "Usage by chain and method", size: 1.8 },
            { kind: "card", label: "Alerts" },
          ],
        },
        {
          title: "Webhooks",
          regions: [
            { kind: "form", label: "Address or contract to watch, and the chain" },
            { kind: "list", label: "Deliveries, with status and retries", size: 2 },
          ],
        },
      ],
      decision: "One gateway in front of every chain, so a developer has one key, one bill and one API while each call goes to the healthiest node.",
      outcome: "Products build on many chains without running nodes, with usage they can see and limits that protect everyone.",
    },
    journeys: [
      {
        title: "A request",
        steps: [
          "The key is checked",
          "The rate limit for that key and method applies",
          "A cached answer is returned, or the router picks the healthiest node",
          "The response comes back and the call is metered",
        ],
      },
      {
        title: "An event to a webhook",
        steps: ["A block arrives", "The indexer decodes it", "It matches a subscription", "The webhook is delivered, with retries"],
      },
    ],
  },
  {
    id: "creator-launchpad",
    tab: "Launchpad",
    zone: "chain",
    title: "A creator coin launchpad on its own stablecoin",
    caption: "A pegged stablecoin underneath, creator coins on top that only ever trade against it, priced on a curve, with NFTs, " +
      "DeFi and engagement rewards around them, built for exchange volume from day one.",
    summary: {
      role: "Co-founded it and proposed the architecture, then built it from zero across web, mobile, back end and chain with a team of 10+",
      scale: "Influencers and creators launching coins for their fans, built from zero for exchange and DeFi scale",
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
            { id: "lp-trade", label: "Trade", detail: "Only against the stablecoin, matched at volume" },
            { id: "lp-defi", label: "DeFi", detail: "Liquidity pools, staking and lending" },
            { id: "lp-nft", label: "NFTs", detail: "Minted for fans" },
            { id: "lp-engage", label: "Engagement rewards" },
            { id: "lp-onramp", label: "Fiat on ramp", detail: "Into the stablecoin" },
            { id: "lp-queue", label: "Event queue", detail: "Services scale apart, nothing blocks a trade", span: 2 },
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
        { from: "lp-defi", to: "lp-stable" },
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
    tab: "NFT lending",
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
];

export default blueprints;
