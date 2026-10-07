import { githubActivity } from "@/data/githubActivity";
import { PortfolioData } from "@/types/portfolio";

// The domain sections: Web3, iGaming and code review.
export const domainsContent: Pick<PortfolioData, "web3" | "igaming" | "codeReview"> = {
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
        name: "Crypto deposits and withdrawals",
        detail: "A crypto cashier on several chains: an address per player, confirmations that credit the balance, and checked withdrawals.",
        places: ["My crypto casino"],
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
    table: {
      phrases: {
        place: "Place your bets",
        final: "Final bets",
        closed: "No more bets",
        reveal: "Good luck. Next game starting",
      },
      refused: "No more bets. Wait for the next round to place that card.",
      placed: "{card} is on the table.",
      hint: "Your hand holds what I have built in iGaming. Tap a card to throw it on the table while bets are open.",
      handLabel: "Your hand",
      tableLabel: "On the table",
      emptyTable: "Your bets land here.",
      redeal: "Pick your cards back up",
      dealerLabel: "Change the dealer's outfit",
      outfits: ["Red evening gown", "Emerald satin gown", "Black sequin dress", "Waistcoat and bow tie", "Neon"],
      roundLabel: "Round {n}",
      cardsLabel: "Every card in the hand",
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
    achievements: {
      title: "Achievements unlocked",
      dayStreak: "{n} day streak",
      weekStreak: "{n} weeks in a row",
      activeDays: "{n} active days",
      perfectWeeks: "{n} perfect weeks, all seven days",
      busiestMonth: "Busiest month: {month} {year}",
      streakLegend: "Each year's longest streak, outlined",
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    },
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
        points: ["91 pull requests reviewed on my own platform's repository"],
      },
    ],
  },
};
