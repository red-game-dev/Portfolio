import { Blueprint } from "@/types/blueprints";

// How the multi market commerce platform I work on now meets outside systems, ships and is watched: the areas
// beyond the forge, drawn as systems. No company is named. Every drawing is a glance, not the full design.
const blueprints: Blueprint[] = [
  {
    id: "commerce-integrations",
    tab: "Integrations",
    zone: "matrix",
    title: "Integrations at the edge of a commerce platform",
    caption: "Each outside system's boundary is mapped one by one, and content reaches the storefront through one signed, " +
      "versioned adapter, so a content source can change without the storefront noticing.",
    summary: {
      role: "Mapped the integration boundary across eight external systems, and designed and built the content adapter API at its centre",
      scale: "A multi market retailer: shoppers, business buyers, editors and the teams behind them",
      stack: ["TypeScript", "Node.js", "Nuxt", "Headless CMS", "OIDC", "Elasticsearch", "OpenFeature", "C4 model"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "ci-people",
          label: "Who comes in",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ci-shopper", label: "Shopper", kind: "actor" },
            { id: "ci-buyer", label: "Business buyer", detail: "From their procurement system", kind: "actor" },
            { id: "ci-editor", label: "Editor", detail: "Content, media, translations", kind: "actor" },
          ],
        },
        {
          id: "ci-front",
          label: "Storefront",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "ci-ssr", label: "Storefront, SSR" },
            { id: "ci-bff", label: "BFF dispatcher", detail: "One route per need" },
          ],
        },
        {
          id: "ci-adapter",
          label: "Content adapter API",
          place: { col: 2, row: 2 },
          nodes: [
            { id: "ci-registry", label: "Handler registry", detail: "No block type ships unregistered" },
            { id: "ci-contract", label: "Versioned contract", detail: "One typed response" },
            { id: "ci-signed", label: "Signed access", detail: "HMAC requests, versioned preview tokens" },
          ],
        },
        {
          id: "ci-owned",
          label: "Systems we run",
          place: { col: 3, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ci-cms", label: "Headless CMS", detail: "Content and editor preview" },
            { id: "ci-pim", label: "Product information", detail: "Search index" },
            { id: "ci-commerce", label: "Commerce domains", detail: "Checkout and orders, untouched" },
          ],
        },
        {
          id: "ci-facing",
          label: "Outside, shopper facing",
          isExternal: true,
          place: { col: 4, row: 1 },
          nodes: [
            { id: "ci-idp", label: "Identity provider", detail: "OIDC" },
            { id: "ci-personal", label: "Personalisation and A/B tests" },
            { id: "ci-engage", label: "Customer engagement" },
          ],
        },
        {
          id: "ci-ops",
          label: "Outside, behind the scenes",
          isExternal: true,
          place: { col: 4, row: 2 },
          nodes: [
            { id: "ci-procure", label: "Procurement punch-out" },
            { id: "ci-desk", label: "Customer service desk" },
            { id: "ci-tms", label: "Translation management" },
            { id: "ci-mail", label: "Transactional email", detail: "Templated" },
            { id: "ci-dam", label: "Media and video library" },
          ],
        },
        {
          id: "ci-records",
          label: "Decisions on record",
          columns: 4,
          place: { col: 1, row: 3, colSpan: 4 },
          nodes: [
            { id: "ci-adr-adapter", label: "Adapter and versioning", kind: "note" },
            { id: "ci-adr-auth", label: "Sign in and signing", kind: "note" },
            { id: "ci-adr-media", label: "Media handling", kind: "note" },
            { id: "ci-adr-mail", label: "Email templating", kind: "note" },
          ],
        },
      ],
      edges: [
        { from: "ci-shopper", to: "ci-ssr" },
        { from: "ci-ssr", to: "ci-bff" },
        { from: "ci-bff", to: "ci-adapter" },
        { from: "ci-adapter", to: "ci-cms", label: "content" },
        { from: "ci-bff", to: "ci-pim", label: "search" },
        { from: "ci-bff", to: "ci-commerce" },
        { from: "ci-editor", to: "ci-cms" },
        { from: "ci-ssr", to: "ci-idp", label: "sign in" },
        { from: "ci-ssr", to: "ci-personal", style: "dashed" },
        { from: "ci-buyer", to: "ci-procure" },
        { from: "ci-procure", to: "ci-ssr", label: "punch-out", isTwoWay: true },
        { from: "ci-cms", to: "ci-tms", label: "translations", isTwoWay: true },
        { from: "ci-cms", to: "ci-dam", label: "media" },
        { from: "ci-commerce", to: "ci-mail" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "In the buyer's procurement system",
          regions: [
            { kind: "bar", label: "Approved suppliers" },
            { kind: "list", label: "The shop among them", size: 2 },
            { kind: "actions", label: "Punch out to the shop" },
          ],
        },
        {
          title: "Shopping, punched out",
          regions: [
            { kind: "bar", label: "Signed in as the buyer's company" },
            { kind: "list", label: "Products and the cart", size: 2.2 },
            { kind: "actions", label: "Return the cart" },
          ],
        },
        {
          title: "Back in procurement",
          regions: [
            { kind: "list", label: "Cart lines, ready for approval", size: 2.4 },
            { kind: "actions", label: "Approve and order" },
          ],
        },
      ],
      decision: "Every outside system's boundary is mapped before anything is built against it, so the rules that keep a vendor's model " +
        "out of the storefront are set up front.",
      outcome: "Eight external systems mapped at the boundary, content reaching the storefront through one signed, versioned " +
        "contract, and a content source that a flag can switch.",
    },
    journeys: [
      {
        title: "A business buyer orders through their own system",
        steps: [
          "Opens the shop from their procurement system",
          "Shops signed in as their company",
          "Sends the cart back to procurement",
          "The order is approved there and placed",
        ],
      },
      {
        title: "An editor's page reaches every locale",
        steps: [
          "Writes the page once",
          "Copies it across locales in the editor",
          "Translations come back through the translation system",
          "Previews each market before publishing",
        ],
      },
    ],
  },
  {
    id: "commerce-delivery",
    tab: "Delivery",
    zone: "matrix",
    title: "Shipping market by market, with a way back",
    caption: "Code ships from trunk through CI into Kubernetes, and the mesh routes each market on its own, so moving a market " +
      "forward or back is a routing or flag change, not a release.",
    summary: {
      role: "Designed the per market rollout and the feature flag architecture, and wrote the migration roadmap and decision records",
      scale: "A storefront in 16 markets, migrating one market at a time without stopping sales",
      stack: ["Kubernetes", "GKE", "Helm", "Istio", "OpenFeature", "GO Feature Flag", "Cloudflare Workers", "Varnish", "PostgreSQL", "Playwright"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "cd-code",
          label: "Code",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "cd-engineer", label: "Engineer", kind: "actor" },
            { id: "cd-trunk", label: "Trunk", detail: "Small changes, reviewed" },
            { id: "cd-tests", label: "Tests", detail: "Unit and end to end" },
          ],
        },
        {
          id: "cd-pipe",
          label: "CI/CD",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "cd-build", label: "Pipeline", detail: "Build, test, image" },
            { id: "cd-helm", label: "Helm chart", detail: "Versioned release" },
          ],
        },
        {
          id: "cd-edge",
          label: "Edge",
          place: { col: 1, row: 2 },
          nodes: [
            { id: "cd-shopper", label: "Shopper", kind: "actor" },
            { id: "cd-workers", label: "Edge workers", detail: "Per country zone" },
            { id: "cd-varnish", label: "Varnish", detail: "Origin cache" },
          ],
        },
        {
          id: "cd-mesh",
          label: "Service mesh",
          place: { col: 2, row: 2 },
          nodes: [
            { id: "cd-routes", label: "Market routing", detail: "One rule per market" },
            { id: "cd-pick", label: "Moved yet?", kind: "decision" },
          ],
        },
        {
          id: "cd-new",
          label: "New stack on GKE",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "cd-ssr", label: "Storefront, SSR" },
            { id: "cd-adapter", label: "Content adapter" },
          ],
        },
        {
          id: "cd-legacy",
          label: "Legacy path",
          isExternal: true,
          place: { col: 3, row: 2 },
          nodes: [{ id: "cd-old", label: "Legacy storefront", detail: "Until its market moves" }],
        },
        {
          id: "cd-watch",
          label: "Watch and roll back",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "cd-pilot", label: "Pilot markets", detail: "First to move" },
            { id: "cd-monitor", label: "Monitoring", detail: "Errors and speed per market" },
            { id: "cd-back", label: "Rollback", detail: "Flag off, back to the legacy CMS, no redeploy" },
          ],
        },
        {
          id: "cd-flags",
          label: "Flags, three layers on one OpenFeature relay",
          columns: 4,
          place: { col: 1, row: 3, colSpan: 4 },
          nodes: [
            { id: "cd-flag-provider", label: "Content provider", detail: "Per country, read at routing; the kill switch" },
            { id: "cd-flag-schema", label: "Schema soft launch", detail: "Built and hidden until switched on" },
            { id: "cd-flag-pipeline", label: "Pipeline experiments", detail: "Internal, such as a cache strategy" },
            { id: "cd-flag-closed", label: "Fails closed", detail: "Relay down: the legacy CMS serves", kind: "note" },
          ],
        },
        {
          id: "cd-ground",
          label: "Underneath",
          columns: 4,
          place: { col: 1, row: 4, colSpan: 4 },
          nodes: [
            { id: "cd-db", label: "Managed PostgreSQL", kind: "store" },
            { id: "cd-trunk-config", label: "Trunk based config", detail: "Safe because schemas ship dark" },
            { id: "cd-adr", label: "Decision records", detail: "Numbered ADRs, C4 set", kind: "note" },
            { id: "cd-roadmap", label: "Migration roadmap", detail: "Timeline and handover guide", kind: "note" },
          ],
        },
      ],
      edges: [
        { from: "cd-engineer", to: "cd-trunk" },
        { from: "cd-trunk", to: "cd-tests" },
        { from: "cd-code", to: "cd-pipe" },
        { from: "cd-build", to: "cd-helm" },
        { from: "cd-helm", to: "cd-new", label: "deploy" },
        { from: "cd-shopper", to: "cd-workers" },
        { from: "cd-workers", to: "cd-varnish" },
        { from: "cd-varnish", to: "cd-routes" },
        { from: "cd-routes", to: "cd-pick" },
        { from: "cd-pick", to: "cd-ssr", label: "moved" },
        { from: "cd-pick", to: "cd-old", label: "not yet" },
        { from: "cd-flag-provider", to: "cd-pick", style: "dashed" },
        { from: "cd-flag-schema", to: "cd-adapter", style: "dashed" },
        { from: "cd-new", to: "cd-monitor", style: "dashed" },
        { from: "cd-back", to: "cd-flag-provider", style: "dashed" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Release",
          regions: [
            { kind: "bar", label: "Build, tests and chart version" },
            { kind: "list", label: "Environments and what each runs", size: 2 },
            { kind: "actions", label: "Promote to production" },
          ],
        },
        {
          title: "Pilot market watch",
          regions: [
            { kind: "stat", label: "Errors and speed, new path against old" },
            { kind: "list", label: "Pilot markets and where each stands", size: 2 },
            { kind: "actions", label: "Move the next market, or roll back" },
          ],
        },
      ],
      decision: "The content source is a flag read per country as the mesh routes, new schemas ship dark behind flags of their " +
        "own, and the relay fails closed, so moving one market, or every market, back is a flag change, not a release.",
      outcome: "Markets migrate one at a time under monitoring, pilot markets go first, and the analytics are designed to inform " +
        "whether the next one goes or the last one rolls back.",
    },
    journeys: [
      {
        title: "A change reaches production",
        steps: [
          "Merged to trunk after review and tests",
          "Built into an image and released with its Helm chart",
          "Serves the markets already moved; the rest stay on the legacy path",
        ],
      },
      {
        title: "A pilot market moves",
        steps: [
          "Its content provider flag turns on for that country, read as the mesh routes",
          "Monitoring and analytics watch it against the old path",
          "The next market follows, or this one goes back with one change",
        ],
      },
    ],
  },
  {
    id: "commerce-observability",
    tab: "Telemetry",
    zone: "matrix",
    title: "Seeing the storefront, with the shopper's consent",
    caption: "Traces, profiles and front end signals on one side, analytics collected first party and only with consent on the " +
      "other, both read when a market moves forward or back.",
    summary: {
      role: "Designed the analytics integration, from consent through server side tagging to the dashboards behind each market's move",
      scale: "Every market's storefront, read by product, marketing and engineering",
      stack: ["OpenTelemetry", "Grafana", "Faro", "Pyroscope", "Datadog", "GA4", "Server side GTM", "Usercentrics", "BigQuery", "Looker Studio"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "ob-browser",
          label: "In the browser",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ob-shopper", label: "Shopper", kind: "actor" },
            { id: "ob-consent", label: "Consent choices", detail: "Per purpose" },
            { id: "ob-tags", label: "Tag container", detail: "Fires what consent allows" },
            { id: "ob-faro", label: "Front end signals", detail: "Faro" },
          ],
        },
        {
          id: "ob-servers",
          label: "Storefront servers",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "ob-ssr", label: "SSR and adapter", detail: "OpenTelemetry traces" },
            { id: "ob-profiler", label: "Profiler", detail: "Continuous" },
          ],
        },
        {
          id: "ob-tagging",
          label: "Server side tagging",
          place: { col: 2, row: 2 },
          nodes: [{ id: "ob-sgtm", label: "Tagging server", detail: "First party collection" }],
        },
        {
          id: "ob-telemetry",
          label: "Observability",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "ob-traces", label: "Traces and metrics" },
            { id: "ob-profiles", label: "Profiles", detail: "Pyroscope" },
            { id: "ob-alerts", label: "Dashboards and alerts", detail: "Grafana and Datadog" },
          ],
        },
        {
          id: "ob-analytics",
          label: "Analytics",
          place: { col: 3, row: 2 },
          nodes: [
            { id: "ob-ga", label: "Analytics events", detail: "GA4" },
            { id: "ob-bq", label: "Warehouse", detail: "BigQuery", kind: "store" },
          ],
        },
        {
          id: "ob-decide",
          label: "Decisions",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ob-looker", label: "Market dashboards", detail: "Looker Studio" },
            { id: "ob-review", label: "Pilot market review", detail: "Go on, hold or roll back", kind: "decision" },
            { id: "ob-teams", label: "Product, marketing, engineering", kind: "actor" },
          ],
        },
      ],
      edges: [
        { from: "ob-shopper", to: "ob-consent" },
        { from: "ob-consent", to: "ob-tags" },
        { from: "ob-tags", to: "ob-sgtm", label: "first party" },
        { from: "ob-sgtm", to: "ob-ga" },
        { from: "ob-ga", to: "ob-bq" },
        { from: "ob-bq", to: "ob-looker" },
        { from: "ob-looker", to: "ob-review" },
        { from: "ob-teams", to: "ob-review" },
        { from: "ob-faro", to: "ob-alerts", style: "dashed" },
        { from: "ob-ssr", to: "ob-traces" },
        { from: "ob-profiler", to: "ob-profiles" },
        { from: "ob-alerts", to: "ob-review", style: "dashed", label: "health" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Consent first",
          regions: [
            { kind: "media", label: "The storefront, waiting", size: 1.6 },
            { kind: "overlay", label: "What each purpose does, in plain words", size: 1.2 },
            { kind: "actions", label: "Accept, reject, or choose purposes" },
          ],
        },
        {
          title: "Pilot market review",
          regions: [
            { kind: "bar", label: "Market, period, new path against old", area: "header" },
            { kind: "list", label: "Markets in the pilot", area: "left" },
            { kind: "canvas", label: "Conversion, errors and speed over time", area: "main" },
            { kind: "list", label: "Open alerts and slow pages", area: "right" },
            { kind: "actions", label: "Go on, hold or roll back", area: "footer" },
          ],
        },
      ],
      decision: "Analytics are collected first party and only with consent, kept apart from engineering telemetry, and read " +
        "beside it when a pilot market goes on or rolls back.",
      outcome: "Designed so pilot market and rollback decisions read the warehouse's dashboards beside system health, with " +
        "analytics gated by the shopper's consent.",
    },
    journeys: [
      {
        title: "A shopper's visit is measured",
        steps: [
          "Sees the consent choices first",
          "Their choice decides which tags may fire",
          "Events go first party to the tagging server, then to analytics",
          "They land in the warehouse behind the market's dashboards",
        ],
      },
      {
        title: "A pilot market is reviewed",
        steps: [
          "Dashboards set the new path against the old",
          "Alerts, traces and profiles show what to fix",
          "The market goes on, holds or rolls back",
        ],
      },
    ],
  },
];

export default blueprints;
