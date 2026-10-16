import { Blueprint } from "@/types/blueprints";

// Payments, from the till to the bank: the POS and the gateway of my own payments company, and the card
// systems built at companies I worked for. No company is named, my own included. Parties I did not build,
// such as the card networks and the payout rails, are drawn as outside the system. Every drawing is a
// glance, not the full design.
const blueprints: Blueprint[] = [
  {
    id: "pos-counter",
    tab: "POS",
    zone: "matrix",
    motion: "tap",
    title: "A POS for shops, restaurants and chains, in store and online",
    caption: "Tills on Android, iOS, desktop and the payment terminal itself, joined to the card terminal four ways, " +
      "tables, tabs and split bills, one stock across every outlet and the online store, and fiscal receipts where the " +
      "law asks for them.",
    summary: {
      role: "Founder, CEO and CTO of my own payments company: built the POS end to end, from the till apps to the back office",
      scale: "Retail shops, restaurants, cafés, bars and chains with many outlets, in Malta, across the EU and beyond, live with merchants",
      stack: ["C/C++", "Python", "PHP", "JavaScript", "Java", "Kotlin", "Swift", "React Native", "React", "TypeScript", "Node.js",
        "PostgreSQL", "Redis"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "pos-till",
          label: "At the counter",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "pos-apps", label: "Till apps", detail: "Android, iOS and desktop" },
            { id: "pos-on-terminal", label: "On the terminal", detail: "The POS beside the payment app on an Android terminal" },
            { id: "pos-web", label: "Web back office", detail: "For the owner and head office" },
          ],
        },
        {
          id: "pos-hardware",
          label: "Hardware",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "pos-printer", label: "Receipt printer", detail: "USB, network or Bluetooth" },
            { id: "pos-drawer", label: "Cash drawer", detail: "Opened on a cash sale" },
            { id: "pos-scanner", label: "Scanner and scale", detail: "Barcodes, and goods sold by weight" },
            { id: "pos-display", label: "Customer display", detail: "The basket and the total" },
          ],
        },
        {
          id: "pos-terminal",
          label: "Card terminal, four ways",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "pos-semi", label: "Semi-integrated", detail: "The till sends the amount, the terminal reads the card" },
            { id: "pos-cloud", label: "Cloud terminal API", detail: "The amount pushed to the terminal over the internet" },
            { id: "pos-softpos", label: "SoftPOS", detail: "The phone itself takes contactless cards" },
            { id: "pos-scope", label: "No card data at the till", detail: "Only approved or declined comes back", kind: "decision" },
          ],
        },
        {
          id: "pos-money",
          label: "Payments",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "pos-gateway", label: "My gateway", detail: "Routing, tokens and the ledger, on a tab of its own" },
            { id: "pos-offline", label: "Offline queue", detail: "Selling through an outage, on a tab of its own" },
          ],
        },
        {
          id: "pos-sale",
          label: "A sale",
          columns: 2,
          place: { col: 1, row: 2, colSpan: 2 },
          nodes: [
            { id: "pos-basket", label: "Basket and pricing", detail: "Discounts, VAT per item and country" },
            { id: "pos-tables", label: "Tables and floor plan", detail: "An open tab per table" },
            { id: "pos-split", label: "Tabs and split bills", detail: "By item or by person" },
            { id: "pos-tips", label: "Tips and service charge", detail: "On the terminal or at the till" },
            { id: "pos-pay", label: "Ways to pay", detail: "Cash, cards, phone wallets and QR codes" },
            { id: "pos-receipt", label: "Receipts", detail: "Printed or emailed, fiscal where the law asks" },
          ],
        },
        {
          id: "pos-shift",
          label: "Shift and end of day",
          place: { col: 3, row: 2 },
          nodes: [
            { id: "pos-open", label: "Till opened and closed", detail: "With a cash count" },
            { id: "pos-refunds", label: "Refunds and voids", detail: "Only for the roles allowed" },
            { id: "pos-z", label: "Z report", detail: "Matched to the terminal's batch" },
          ],
        },
        {
          id: "pos-office",
          label: "Back office",
          place: { col: 4, row: 2 },
          nodes: [
            { id: "pos-menus", label: "Central menus and prices", detail: "Pushed to every outlet, local overrides kept" },
            { id: "pos-stock", label: "One stock", detail: "Every outlet and the online store", kind: "store" },
            { id: "pos-staff", label: "Staff, roles and shifts", detail: "PINs, what each role may do, clock in and out" },
            { id: "pos-reports", label: "Reports", detail: "Per outlet and for the whole chain" },
            { id: "pos-fiscal", label: "Fiscal receipts", detail: "Signed or reported where the law asks" },
          ],
        },
      ],
      edges: [
        { from: "pos-apps", to: "pos-hardware", label: "drives" },
        { from: "pos-till", to: "pos-sale" },
        { from: "pos-pay", to: "pos-terminal", label: "the amount" },
        { from: "pos-terminal", to: "pos-gateway", label: "approved or declined" },
        { from: "pos-sale", to: "pos-offline", style: "dashed", label: "no connection" },
        { from: "pos-sale", to: "pos-shift" },
        { from: "pos-z", to: "pos-reports" },
        { from: "pos-menus", to: "pos-till", style: "dashed", label: "menus and prices" },
        { from: "pos-basket", to: "pos-stock", isTwoWay: true },
        { from: "pos-receipt", to: "pos-fiscal" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Floor plan",
          regions: [
            { kind: "bar", label: "Outlet, shift and staff on the till", size: 0.6 },
            { kind: "canvas", label: "Tables, each with its open tab", size: 2.2 },
          ],
        },
        {
          title: "Order",
          regions: [
            { kind: "list", label: "Items and quantities", size: 1.6 },
            { kind: "bar", label: "VAT per item, discounts", size: 0.6 },
            { kind: "actions", label: "Split the bill, by item or by person", size: 0.7 },
          ],
        },
        {
          title: "Pay",
          regions: [
            { kind: "stat", label: "Total, tip and service charge" },
            { kind: "list", label: "Card, phone wallet, QR code or cash", size: 1.2 },
            { kind: "overlay", label: "Waiting on the terminal", size: 1 },
          ],
        },
        {
          title: "Close the shift",
          regions: [
            { kind: "form", label: "Cash counted", size: 0.9 },
            { kind: "list", label: "The terminal's batch against the Z report", size: 1.3 },
            { kind: "actions", label: "Close and print", size: 0.7 },
          ],
        },
      ],
      decision: "The till never sees a card number: however the terminal is joined, the till sends the amount and gets back " +
        "approved or declined, so the POS stays out of the card data's PCI scope.",
      outcome: "One POS ran a shop, a restaurant or a chain, in store and online, and kept selling through an outage.",
    },
    journeys: [
      {
        title: "A table",
        steps: [
          "A table is seated on the floor plan and its tab opens",
          "Orders are added through the meal",
          "The bill is split by person, each paying their own way",
          "A tip on the terminal, and a receipt printed or emailed",
        ],
      },
      {
        title: "A chain",
        steps: [
          "Head office changes a price once",
          "Every outlet gets it, keeping its own overrides",
          "A sale online and one in store take from the same stock",
          "Reports show each outlet and the whole chain",
        ],
      },
      {
        title: "Closing time",
        steps: [
          "The till is closed with a cash count",
          "The terminal closes its batch",
          "The Z report matches the two",
        ],
      },
    ],
  },
  {
    id: "pos-offline",
    tab: "Offline",
    zone: "matrix",
    motion: "sync",
    title: "Selling through an outage, each sale counted once",
    caption: "With no internet the till keeps selling: every sale waits on the device and syncs once when the connection " +
      "returns, the terminal approves cards offline under a floor limit and sends them on later, and a late decline is " +
      "flagged to the merchant.",
    summary: {
      role: "Designed and built the offline mode and the sync, on the tills and through the terminals",
      scale: "Every till and terminal of every merchant, shops and restaurants alike",
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "off-till",
          label: "On the till",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "off-sale", label: "Sale", detail: "Written on the device first, under its own key" },
            { id: "off-local", label: "Local store", detail: "Sales, receipts and cash", kind: "store" },
            { id: "off-outbox", label: "Outbox", detail: "Every change in order, until the server acknowledges it", kind: "store" },
          ],
        },
        {
          id: "off-terminal",
          label: "On the terminal",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "off-limit", label: "Floor limit", detail: "Set per merchant, caps what an outage can cost", kind: "decision" },
            { id: "off-approve", label: "Approved offline", detail: "Under the limit, by the card and the terminal" },
            { id: "off-forward", label: "Store and forward", detail: "Held encrypted until online", kind: "store" },
          ],
        },
        {
          id: "off-online",
          label: "Back online",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "off-sync", label: "Sync", detail: "Sends the outbox in order" },
            { id: "off-key", label: "Idempotency key", detail: "A sale sent twice is booked once", kind: "decision" },
            { id: "off-declines", label: "Late declines", detail: "Flagged to the merchant to collect another way" },
          ],
        },
        {
          id: "off-server",
          label: "Server",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "off-ledger", label: "Sales and ledger", kind: "store" },
            { id: "off-gateway", label: "My gateway", detail: "On to the acquirer or PSP" },
          ],
        },
        {
          id: "off-close",
          label: "Closing the day",
          columns: 2,
          place: { col: 1, row: 2, colSpan: 2 },
          nodes: [
            { id: "off-batch", label: "Terminal batch close" },
            { id: "off-z", label: "Till Z report" },
          ],
        },
        {
          id: "off-banks",
          label: "Acquirer or PSP",
          isExternal: true,
          place: { col: 4, row: 2 },
          nodes: [
            { id: "off-issuer", label: "The card's bank", detail: "Approves or declines when it finally hears" },
          ],
        },
      ],
      edges: [
        { from: "off-sale", to: "off-local" },
        { from: "off-local", to: "off-outbox" },
        { from: "off-outbox", to: "off-sync", label: "when online" },
        { from: "off-sync", to: "off-key" },
        { from: "off-key", to: "off-ledger" },
        { from: "off-limit", to: "off-approve" },
        { from: "off-approve", to: "off-forward" },
        { from: "off-forward", to: "off-gateway", label: "when online" },
        { from: "off-gateway", to: "off-banks" },
        { from: "off-banks", to: "off-declines", style: "dashed", label: "declined late" },
        { from: "off-batch", to: "off-z", isTwoWay: true, label: "matched" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Offline",
          regions: [
            { kind: "bar", label: "No connection: selling on", size: 0.6 },
            { kind: "list", label: "Sales waiting to sync", size: 1.4 },
            { kind: "stat", label: "Cards held under the floor limit" },
          ],
        },
        {
          title: "Back online",
          regions: [
            { kind: "steps", label: "Each sale sent once, in order", size: 1.2 },
            { kind: "list", label: "Synced, each with the server's number", size: 1.4 },
          ],
        },
        {
          title: "Close",
          regions: [
            { kind: "list", label: "The terminal's batch against the Z report", size: 1.4 },
            { kind: "card", label: "Late declines to collect", size: 1 },
          ],
        },
      ],
      decision: "Every sale is written on the device first under a key of its own, so sending it twice books it once, and " +
        "the terminal's floor limit caps what an outage can cost.",
      outcome: "Outlets kept selling through an outage, and a sale sent twice was booked once.",
    },
    journeys: [
      {
        title: "An outage",
        steps: [
          "The connection drops in the middle of service",
          "Sales and cash carry on, kept on the till",
          "Cards under the floor limit are approved on the terminal",
          "The connection returns and each sale syncs once",
        ],
      },
      {
        title: "A late decline",
        steps: [
          "A card approved offline is sent on",
          "The card's bank declines it",
          "The merchant sees it flagged, to collect another way",
        ],
      },
    ],
  },
  {
    id: "payment-gateway",
    tab: "Gateway",
    zone: "matrix",
    motion: "route",
    title: "A payment gateway of my own, across PSPs and an acquirer",
    caption: "One API and SDKs for merchants and developers in front of PSPs and an acquirer: routing by method and by " +
      "merchant with fail over, PSP and network tokens, a payment state machine on a double entry ledger, signed webhooks, " +
      "settlement files read back and reconciled, and chargebacks booked.",
    summary: {
      role: "Founder, CEO and CTO of my own payments company: designed and built the gateway, its API and SDKs, and the money behind it",
      scale: "Every major card network, Apple Pay, Google Pay, PayPal, Alipay, WeChat Pay and crypto, for merchants in Malta, " +
        "across the EU and beyond",
      stack: ["C/C++", "Python", "PHP", "JavaScript", "TypeScript", "Node.js", "PostgreSQL", "Redis", ".NET", "Vue", "Angular"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "gw-merchants",
          label: "Merchants and developers",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "gw-api", label: "Merchant API", detail: "An idempotency key on every write" },
            { id: "gw-sdks", label: "SDKs", detail: ".NET, Vue, Angular, PHP frameworks and more" },
            { id: "gw-hosted", label: "Hosted checkout and links", detail: "Card data never reaches the merchant" },
            { id: "gw-dashboard", label: "Dashboard", detail: "Payments, refunds, payouts and reports" },
          ],
        },
        {
          id: "gw-risk",
          label: "Risk and identity",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "gw-kyb", label: "Merchant onboarding", detail: "KYB here, or at the PSP" },
            { id: "gw-limits", label: "Limits and reserves", detail: "Per merchant, raised as it proves itself" },
            { id: "gw-fraud", label: "Fraud rules", detail: "Checked before a payment is sent" },
            { id: "gw-3ds", label: "3-D Secure and SCA", detail: "For online cards in the EU" },
          ],
        },
        {
          id: "gw-routing",
          label: "Routing",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "gw-router", label: "Router", detail: "By method and by merchant", kind: "decision" },
            { id: "gw-failover", label: "Fail over", detail: "On a provider's error, never on the bank's decline" },
            { id: "gw-tokens", label: "Tokens", detail: "PSP tokens and network tokens, never a card number", kind: "store" },
          ],
        },
        {
          id: "gw-providers",
          label: "Providers",
          isExternal: true,
          place: { col: 4, row: 1 },
          nodes: [
            { id: "gw-psps", label: "PSPs", detail: "Cards, wallets, PayPal and local methods" },
            { id: "gw-acquirer", label: "Acquirer", detail: "Authorisations to the bank's host" },
            { id: "gw-banks", label: "Bank rails", detail: "SEPA and SEPA Instant" },
            { id: "gw-crypto", label: "Crypto rails", detail: "On chain, at the till or online" },
          ],
        },
        {
          id: "gw-core",
          label: "Payment core",
          columns: 2,
          place: { col: 1, row: 2, colSpan: 2 },
          nodes: [
            { id: "gw-state", label: "State machine", detail: "Authorised, captured, settled, refunded" },
            { id: "gw-events", label: "Event log", detail: "Append only, every change kept", kind: "store" },
            { id: "gw-ledger", label: "Double entry ledger", detail: "Every movement as balancing rows", kind: "store" },
            { id: "gw-fees", label: "Fees per payment", detail: "Interchange, scheme fees and mine, booked apart" },
          ],
        },
        {
          id: "gw-merchant-events",
          label: "After a payment",
          place: { col: 3, row: 2 },
          nodes: [
            { id: "gw-webhooks", label: "Signed webhooks", detail: "Retried with backoff until acknowledged" },
            { id: "gw-refunds", label: "Refunds and voids", detail: "A void before settlement, a refund after" },
            { id: "gw-chargebacks", label: "Chargebacks", detail: "Evidence sent, the outcome booked" },
          ],
        },
        {
          id: "gw-day",
          label: "After the day",
          place: { col: 4, row: 2 },
          nodes: [
            { id: "gw-files", label: "Settlement files", detail: "Read from the acquirer and each PSP" },
            { id: "gw-recon", label: "Reconciliation", detail: "Every payment against what was paid, gaps flagged" },
            { id: "gw-payouts", label: "Payouts", detail: "On a tab of their own" },
          ],
        },
      ],
      edges: [
        { from: "gw-merchants", to: "gw-risk" },
        { from: "gw-risk", to: "gw-router" },
        { from: "gw-router", to: "gw-tokens", style: "link" },
        { from: "gw-failover", to: "gw-providers", label: "authorise" },
        { from: "gw-router", to: "gw-state" },
        { from: "gw-state", to: "gw-events", label: "each change" },
        { from: "gw-events", to: "gw-ledger", label: "posted" },
        { from: "gw-fees", to: "gw-ledger" },
        { from: "gw-state", to: "gw-webhooks" },
        { from: "gw-chargebacks", to: "gw-ledger", style: "dashed" },
        { from: "gw-providers", to: "gw-files", style: "dashed", label: "files" },
        { from: "gw-files", to: "gw-recon" },
        { from: "gw-recon", to: "gw-ledger", style: "dashed", label: "gaps" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Integrate",
          regions: [
            { kind: "list", label: "An SDK for each stack", size: 1.2 },
            { kind: "card", label: "Keys, and where webhooks go", size: 1 },
          ],
        },
        {
          title: "Payments",
          regions: [
            { kind: "bar", label: "Filters: method, provider, state", size: 0.6 },
            { kind: "list", label: "Each payment, the route it took and every change", size: 1.8 },
          ],
        },
        {
          title: "A payment",
          regions: [
            { kind: "steps", label: "Authorised, captured, settled" },
            { kind: "card", label: "Fees: interchange, scheme and mine", size: 0.9 },
            { kind: "actions", label: "Void or refund", size: 0.7 },
          ],
        },
        {
          title: "Reconcile",
          regions: [
            { kind: "stat", label: "Matched, and gaps to look at" },
            { kind: "list", label: "Settlement lines against the ledger", size: 1.6 },
          ],
        },
      ],
      decision: "The merchant talks to one API with an idempotency key on every write, and the router behind it fails over " +
        "only on a provider's error: a card its bank declined is never sent again elsewhere.",
      outcome: "Merchants took every method through one integration, and every payment could be followed from the request " +
        "to the line in the settlement file.",
    },
    journeys: [
      {
        title: "A payment",
        steps: [
          "The merchant sends it with an idempotency key",
          "Fraud rules and the merchant's limits pass",
          "The router picks the provider for the method and the merchant",
          "That provider errors, so the next one takes it",
          "Authorised, and a signed webhook tells the merchant",
        ],
      },
      {
        title: "The next morning",
        steps: [
          "Settlement files arrive from the acquirer and each PSP",
          "Every line is matched to the ledger",
          "Fees are booked apart, and any gap is flagged",
        ],
      },
      {
        title: "A chargeback",
        steps: [
          "The dispute arrives from the provider",
          "Evidence is gathered and sent",
          "The outcome is booked on the ledger",
        ],
      },
    ],
  },
  {
    id: "card-payment",
    tab: "Card payment",
    zone: "matrix",
    motion: "authorise",
    title: "One card payment, end to end, at enterprise scale",
    caption: "From a tap at the terminal to money in the merchant's account: the terminal encrypts the card, the HSM decrypts " +
      "it and translates the PIN, the authorisation crosses the card network to the issuer and back over ISO 8583, and " +
      "clearing, settlement and disputes run on their own cycle.",
    summary: {
      role: "Built across the acquiring, issuing, gateway and merchant sides at companies I worked for, inside their PCI DSS " +
        "Level 1 certified environments",
      scale: "Card present and online, every major network and the phone wallets, in systems still in use",
      stack: ["C/C++", "Java", "Kotlin", "C# (.NET)", "Go", "Node.js", "PHP", "ISO 8583", "EMV", "HSM"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "cp-estate",
          label: "Terminal estate",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "cp-terminal", label: "Terminal", detail: "EMV chip and contactless, P2PE" },
            { id: "cp-rkl", label: "Remote key loading", detail: "Keys put in without a visit" },
            { id: "cp-tms", label: "Terminal management", detail: "Software and settings pushed to the estate" },
          ],
        },
        {
          id: "cp-acquiring",
          label: "Gateway and acquiring",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "cp-switch", label: "Authorisation switch", detail: "Routes each request" },
            { id: "cp-hsm", label: "HSM", detail: "Decrypts P2PE, translates the PIN" },
            { id: "cp-vault", label: "Token vault", detail: "Card numbers swapped for tokens", kind: "store" },
          ],
        },
        {
          id: "cp-networks",
          label: "Card networks",
          isExternal: true,
          place: { col: 3, row: 1 },
          nodes: [
            { id: "cp-network", label: "Visa, Mastercard and the others", detail: "Carry the authorisation between banks" },
            { id: "cp-standin", label: "Stand-in", detail: "Approves within limits when the issuer cannot answer" },
            { id: "cp-tokens", label: "Token services", detail: "Network tokens and phone wallet cards" },
          ],
        },
        {
          id: "cp-issuing",
          label: "Issuing",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "cp-issuer", label: "Issuer authorisation", detail: "Balance, limits and rules, in real time", kind: "decision" },
            { id: "cp-cards", label: "Card management", detail: "Virtual and physical cards, freeze, limits, PIN" },
            { id: "cp-3ds", label: "3-D Secure, issuer side", detail: "The cardholder approves in the app" },
            { id: "cp-wallets", label: "Wallet provisioning", detail: "A card added to Apple Pay or Google Pay" },
          ],
        },
        {
          id: "cp-cde",
          label: "PCI DSS Level 1 environment",
          columns: 2,
          place: { col: 1, row: 2, colSpan: 2 },
          nodes: [
            { id: "cp-scope", label: "Card data only in here", detail: "Everything outside holds a token", kind: "decision" },
            { id: "cp-iso", label: "ISO 8583 links", detail: "Request and response, per network" },
          ],
        },
        {
          id: "cp-merchant",
          label: "Merchant",
          place: { col: 3, row: 2 },
          nodes: [
            { id: "cp-pos", label: "POS and checkout", detail: "Told approved or declined" },
            { id: "cp-account", label: "Merchant account", detail: "Paid net of fees" },
          ],
        },
        {
          id: "cp-after",
          label: "After the payment",
          place: { col: 4, row: 2 },
          nodes: [
            { id: "cp-clearing", label: "Clearing", detail: "The day's payments sent to the network as files" },
            { id: "cp-settlement", label: "Settlement", detail: "Net amounts moved between the banks, fees taken" },
            { id: "cp-disputes", label: "Disputes", detail: "Chargebacks through the network's dispute system" },
          ],
        },
      ],
      edges: [
        { from: "cp-terminal", to: "cp-switch", label: "encrypted card" },
        { from: "cp-rkl", to: "cp-terminal", style: "dashed", label: "keys" },
        { from: "cp-switch", to: "cp-hsm", isTwoWay: true },
        { from: "cp-switch", to: "cp-vault", style: "link" },
        { from: "cp-switch", to: "cp-iso" },
        { from: "cp-iso", to: "cp-network", isTwoWay: true, label: "authorisation" },
        { from: "cp-network", to: "cp-issuer", isTwoWay: true },
        { from: "cp-standin", to: "cp-issuer", style: "dashed", label: "issuer down" },
        { from: "cp-tokens", to: "cp-wallets", style: "link" },
        { from: "cp-switch", to: "cp-pos", style: "dashed", label: "approved or declined" },
        { from: "cp-clearing", to: "cp-settlement" },
        { from: "cp-settlement", to: "cp-account" },
        { from: "cp-disputes", to: "cp-network", isTwoWay: true },
      ],
    },
    wireframe: {
      device: "phone",
      screens: [
        {
          title: "Terminal",
          regions: [
            { kind: "stat", label: "Amount" },
            { kind: "canvas", label: "Tap, insert or swipe", size: 1.4 },
            { kind: "bar", label: "Approved, with the authorisation code", size: 0.7 },
          ],
        },
        {
          title: "Approve online",
          regions: [
            { kind: "card", label: "Merchant and amount", size: 0.9 },
            { kind: "overlay", label: "Approve this payment?", size: 1.2 },
            { kind: "actions", label: "Approve or decline", size: 0.7 },
          ],
        },
        {
          title: "Cards",
          regions: [
            { kind: "list", label: "Virtual and physical cards", size: 1.3 },
            { kind: "actions", label: "Freeze, limits, PIN", size: 0.8 },
            { kind: "actions", label: "Add to Apple Pay or Google Pay", size: 0.8 },
          ],
        },
        {
          title: "Merchant",
          regions: [
            { kind: "list", label: "Settled payments, net of fees", size: 1.4 },
            { kind: "list", label: "Disputes, each with its deadline", size: 1.1 },
          ],
        },
      ],
      decision: "The card leaves the terminal encrypted and is decrypted only inside the card data environment, the PIN is " +
        "translated from the terminal's keys to the network's inside the HSM and never in the clear, and every system " +
        "outside holds a token.",
      outcome: "Both sides of a card payment, built end to end and still in use, with the card data kept to the smallest " +
        "part of each system.",
    },
    journeys: [
      {
        title: "A tap",
        steps: [
          "The cardholder taps a card or a phone",
          "The terminal encrypts the card and sends it on",
          "The HSM decrypts it and translates the PIN",
          "The network carries the request to the issuer",
          "The issuer approves on the balance and the rules",
          "Approved shows on the terminal",
        ],
      },
      {
        title: "Overnight",
        steps: [
          "The day's payments are cleared through the network",
          "The banks settle the net amounts",
          "The merchant is paid, net of fees",
        ],
      },
      {
        title: "A dispute",
        steps: [
          "The cardholder disputes a payment with the issuer",
          "The chargeback reaches the acquirer through the network",
          "Evidence is sent before the deadline",
          "The outcome is booked",
        ],
      },
    ],
  },
  {
    id: "payouts-splits",
    tab: "Payouts",
    zone: "matrix",
    motion: "split",
    title: "Splits and payouts for merchants, sellers and developers",
    caption: "Each payment split between the platform's fee and every seller or developer in the basket, booked on the " +
      "ledger, then paid out on a schedule or at once, to a bank, a card, through the PSP or to a crypto wallet, with a " +
      "refund after a payout made up from the next one or the reserve.",
    summary: {
      role: "Designed and built the splits and payouts in my own payments company, my gamified platform's developer platform, " +
        "a business to business marketplace and at companies I worked for",
      scale: "Merchants, sellers and developers in Malta, across the EU and beyond, paid out on four rails",
      stack: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "Stripe Connect", "Double entry ledger"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "po-in",
          label: "Where money comes from",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "po-sales", label: "POS and checkout sales" },
            { id: "po-apps", label: "In-app sales", detail: "Members buying from developers" },
            { id: "po-baskets", label: "Marketplace baskets", detail: "Several sellers, one checkout" },
            { id: "po-api", label: "Payments API", detail: "Developers taking payments, test keys beside live" },
          ],
        },
        {
          id: "po-split",
          label: "Split",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "po-rules", label: "Split rules", detail: "Decided before any money moves", kind: "decision" },
            { id: "po-fee", label: "Platform fee" },
            { id: "po-shares", label: "Seller and developer shares", detail: "Each paid their own part of a basket" },
          ],
        },
        {
          id: "po-ledger",
          label: "Ledger",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "po-entries", label: "Double entry ledger", detail: "Each share as balancing rows", kind: "store" },
            { id: "po-balances", label: "Balances", detail: "Pending, available, reserved" },
            { id: "po-reserve", label: "Reserve", detail: "Held back against refunds and chargebacks", kind: "store" },
          ],
        },
        {
          id: "po-rails",
          label: "Payout rails",
          isExternal: true,
          place: { col: 4, row: 1 },
          nodes: [
            { id: "po-bank", label: "Bank accounts", detail: "SEPA on a schedule, SEPA Instant at once" },
            { id: "po-card", label: "Push to card", detail: "Visa Direct and Mastercard Send" },
            { id: "po-psp", label: "PSP payouts", detail: "Stripe Connect and the like" },
            { id: "po-crypto", label: "Crypto wallets", detail: "In a stablecoin or crypto" },
          ],
        },
        {
          id: "po-engine",
          label: "Payouts",
          columns: 2,
          place: { col: 1, row: 2, colSpan: 2 },
          nodes: [
            { id: "po-schedule", label: "On a schedule", detail: "Daily, weekly or monthly, once settled" },
            { id: "po-instant", label: "Instant", detail: "At once, for a fee" },
            { id: "po-negative", label: "Negative balance", detail: "Made up from the next payout or the reserve", kind: "decision" },
          ],
        },
        {
          id: "po-holders",
          label: "Who holds the money",
          isExternal: true,
          place: { col: 3, row: 2, colSpan: 2 },
          columns: 2,
          nodes: [
            { id: "po-own", label: "The merchant's own account", detail: "Paid by its acquirer or PSP" },
            { id: "po-platform", label: "A PSP's platform product", detail: "Splits and pays out for the platform" },
            { id: "po-partner", label: "A licensed partner", detail: "Holds the funds, told whom to pay" },
          ],
        },
      ],
      edges: [
        { from: "po-in", to: "po-rules" },
        { from: "po-rules", to: "po-fee" },
        { from: "po-rules", to: "po-shares" },
        { from: "po-split", to: "po-entries" },
        { from: "po-entries", to: "po-balances" },
        { from: "po-reserve", to: "po-balances", style: "link" },
        { from: "po-balances", to: "po-engine" },
        { from: "po-engine", to: "po-rails" },
        { from: "po-negative", to: "po-reserve", style: "dashed" },
        { from: "po-holders", to: "po-rails", style: "link" },
      ],
    },
    wireframe: {
      device: "phone",
      screens: [
        {
          title: "Earnings",
          regions: [
            { kind: "stat", label: "Pending, available, reserved" },
            { kind: "list", label: "Each sale and its split", size: 1.6 },
          ],
        },
        {
          title: "Get paid",
          regions: [
            { kind: "list", label: "Bank, card, PSP or crypto wallet", size: 1.3 },
            { kind: "bar", label: "On the schedule, or now for a fee", size: 0.7 },
            { kind: "actions", label: "Pay out", size: 0.7 },
          ],
        },
        {
          title: "Developer",
          regions: [
            { kind: "list", label: "Apps and items sold, with the revenue share", size: 1.4 },
            { kind: "bar", label: "Test keys beside live ones", size: 0.7 },
          ],
        },
      ],
      decision: "Every split is booked on the ledger before any money moves, so a payout is only ever the sum of what was " +
        "earned, less what is held.",
      outcome: "Every payout could be traced back to the sales it was made of, and a refund after a payout was covered by the " +
        "next one or the reserve.",
    },
    journeys: [
      {
        title: "A basket with two sellers",
        steps: [
          "A buyer pays once for items from two sellers",
          "The platform's fee and each seller's share are booked",
          "Each seller sees theirs pending, then available",
          "Each is paid out on their own schedule",
        ],
      },
      {
        title: "A refund after the payout",
        steps: [
          "A buyer is refunded after the seller was paid",
          "The seller's balance goes negative",
          "The next payout or the reserve makes it up",
        ],
      },
      {
        title: "A developer",
        steps: [
          "Builds against test keys and test cards",
          "Sells an app or an item to members",
          "Gets their share, paid out on the schedule",
        ],
      },
    ],
  },
];

export default blueprints;
