import { Blueprint } from "@/types/blueprints";

// iGaming kinds of architecture, drawn in the casino zone. No company is named. Every drawing is a glance, not the full design.
const blueprints: Blueprint[] = [
  {
    id: "live-dealer",
    tab: "Live dealer",
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
    tab: "Slots and tables",
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
];

export default blueprints;
