import { PortfolioData } from "@/types/portfolio";

// The DevOps universe: the hosts I run on and when I pick each, the stacks I set up from scratch, the CLI that moved them,
// and how I run them in production, each point drawn from what the rest of the page shows. Costs are only ever relative.
export const devopsContent: Pick<PortfolioData, "devops"> = {
  devops: {
    guide: {
      title: "Where should it run?",
      intro: "Answer four questions about a product and see where I would run each part of it, and why.",
      questions: {
        traffic: { label: "Traffic", options: { steady: "Steady", spiky: "Spiky", global: "Worldwide" } },
        budget: { label: "Budget", options: { lean: "Lean", balanced: "Balanced", generous: "Generous" } },
        team: { label: "Team", options: { solo: "Just me", small: "A small team", platform: "A platform team" } },
        latency: { label: "What it serves", options: { realtime: "Real time", web: "The web", batch: "Background work" } },
      },
      layers: { edge: "Edge", front: "Front end", services: "Services", realtime: "Real time", jobs: "Background jobs", data: "Data" },
      reasons: {
        edge: "In front of everything: DNS, caching and protection, whichever host is behind.",
        frontEdge: "A preview for every branch, rendering near the reader, a rollback in one step.",
        frontServers: "Steady traffic on a lean budget: served from the same servers, cached at the edge.",
        cluster: "Many services and markets: canary rollouts per market and autoscaling, worth a cluster's daily cost.",
        managed: "Spikes and a team to keep: managed services cost less than the people they replace.",
        steady: "Steady load: the most compute for the money, set up from scratch with Docker and my CLI.",
        small: "One person shipping: deploy by build id with no downtime, pay only for what runs.",
        regions: "Small to medium services a region at a time, quick to set up and to move.",
        realtimeSteady: "Real time on a steady load: dedicated servers per region, the way the game and the social network ran.",
        autoscale: "Real time with spikes: servers added in seconds, removed when the spike is over.",
        workers: "Background work: workers deployed by build id with no downtime, away from the web.",
        selfRun: "PostgreSQL and Redis in containers on the servers, backed up and moved with the same tools.",
        managedData: "PostgreSQL on RDS or Aurora and Redis on ElastiCache: backups, replicas and failover handled.",
      },
      result: "Where each part runs",
    },
    console: {
      title: "Ship it",
      intro: "Ship each universe's stack to where the guide put it, or move one to another host, the way I move them: build, ship, check its health, switch.",
      label: "The DevOps console",
      prompt: "deploy@redgame",
      stacks: {
        matrix: "This site",
        ai: "Ask Red",
        chain: "The exchange",
        casino: "The live tables",
        mmo: "The game servers",
        beyond: "The daily board",
      },
      deploy: "Deploy",
      deployAll: "Deploy every universe",
      move: "Move",
      shipped: "{stack}: live on {host}.",
      moved: "{stack}: moved from {from} to {to}, with no downtime.",
      idle: "Pick where it runs, then ship a universe.",
      steps: {
        dedicated: [
          "docker build -t {slug}:release .",
          "./deploy.sh {slug} --servers fsn1,gra1",
          "ssh deploy@fsn1 'docker compose up -d {slug}'",
          "curl -fsS https://{slug}.internal/healthz  200 OK",
        ],
        digitalocean: [
          "docker build -t {slug}:release .",
          "./deploy.sh {slug} --region ams3",
          "ssh deploy@ams3 'docker compose up -d {slug}'",
          "curl -fsS https://{slug}.internal/healthz  200 OK",
        ],
        aws: [
          "docker push ecr/{slug}:release",
          "aws ecs update-service --service {slug} --force-new-deployment",
          "aws ecs wait services-stable --services {slug}",
          "health checks passing behind the load balancer",
        ],
        gcp: [
          "docker push gcr/{slug}:release",
          "helm upgrade {slug} ./charts/{slug} --set canary.weight=10",
          "kubectl rollout status deploy/{slug}",
          "canary healthy, promoting to every market",
        ],
        vercel: [
          "vercel build --prod",
          "vercel deploy --prebuilt --prod",
          "preview checked, aliased to production",
          "rollback ready: the last build is one step away",
        ],
        railway: [
          "railway up --service {slug} --detach",
          "build {slug} ready, swapping with no downtime",
          "curl -fsS https://{slug}.up.railway.app/healthz  200 OK",
          "previous build kept for rollback",
        ],
        cloudflare: [
          "wrangler deploy {slug}",
          "cache purged for {slug}",
          "curl -fsS https://{slug}.workers.dev/healthz  200 OK",
          "live at the edge in every region",
        ],
      },
      moveSteps: [
        "./move.sh {slug} --from {from} --to {to}",
        "replica on {to} in sync with {from}",
        "both live, traffic shifting to {to}",
        "{from} drained and retired",
      ],
    },
    terminal: {
      hostsSummary: "See where I run things, and when",
      deploySummary: "Ship a universe's stack",
      migrateSummary: "Move a universe's stack to another host",
      hostsTitle: "Where I run things, and when:",
      hostRow: "{slug}: {name}, {kind}. {reach}",
      stacksTitle: "The universes you can ship:",
      stackRow: "{slug}: {name}",
      usage: "Usage: deploy <universe> [host], migrate <universe> <host>. For example: deploy game, migrate board aws",
      unknownStack: "There is no universe called {input}. Type deploy to see them.",
      unknownHost: "There is no host called {input}. Type hosts to see them.",
      sameHost: "{stack}: already runs on {host}.",
    },
    hosts: {
      title: "Where it runs, and when",
      intro: "No host is right for everything. This is how I choose, and where each one stops paying.",
      labels: { reach: "When I reach for it", stops: "Where it stops paying", cost: "Cost" },
      items: [
        {
          id: "dedicated",
          name: "OVH and Hetzner",
          kind: "Dedicated servers",
          reach: "Steady, heavy load: game servers, real time and databases I tune myself, set up from scratch with Docker and my own CLI.",
          stops: "Sudden spikes and teams with nobody on call: adding a server takes hours, not seconds.",
          cost: "The most compute and bandwidth for the money once the load is steady.",
        },
        {
          id: "digitalocean",
          name: "DigitalOcean",
          kind: "Virtual servers per region",
          reach: "The web and small services beside the dedicated machines, a region at a time, quick to set up and to move.",
          stops: "Heavy compute and large databases, which belong on dedicated servers.",
          cost: "Cheap and predictable at small to medium scale.",
        },
        {
          id: "aws",
          name: "AWS",
          kind: "Cloud, set up in full",
          reach: "When managed services pay for themselves: PostgreSQL on RDS and Aurora, ElastiCache, queues and Step Functions, " +
            "Bedrock, and Cognito and IAM where identity and compliance matter.",
          stops: "Bandwidth and per request pricing at steady high volume: I set budgets and move hot paths off when they cost more than they save.",
          cost: "Dearer per unit than servers, cheaper than the people a managed service replaces.",
        },
        {
          id: "gcp",
          name: "GCP",
          kind: "Kubernetes on GKE",
          reach: "Many services and markets: Helm, Istio canary rollouts per market, autoscaling and many environments.",
          stops: "A small team: a cluster costs money and attention every day it runs.",
          cost: "Pays off with many services sharing one cluster, not with a few.",
        },
        {
          id: "vercel",
          name: "Vercel",
          kind: "Front ends at the edge",
          reach: "Web apps: a preview for every branch, rendering near the reader, a rollback in one step.",
          stops: "Long running work and heavy compute, which go to workers on Railway or to servers.",
          cost: "Cheap for front ends, dear for heavy compute and bandwidth at scale.",
        },
        {
          id: "railway",
          name: "Railway",
          kind: "Workers and services",
          reach: "Workers and background jobs deployed by build id with no downtime.",
          stops: "Large steady fleets, where servers cost less.",
          cost: "Pay for what runs, so cheap while small.",
        },
        {
          id: "cloudflare",
          name: "Cloudflare",
          kind: "In front of everything",
          reach: "DNS, caching, Workers at the edge and protection from attacks, in front of whichever host is behind.",
          stops: "Where state lives, which stays with the host behind it.",
          cost: "Little or nothing for what it saves the hosts behind it.",
        },
      ],
    },
    scratch: {
      title: "From scratch, many times",
      points: [
        "The social network and the game ran on servers I set up from scratch on OVH and DigitalOcean, with no AWS: servers per region, switched by " +
          "hand before load balancers were common.",
        "Every service in Docker, the same containers on every server and in every environment: a bit more costly back then, but tuned, with no vendor " +
          "lock-in and an easy move to another host.",
        "Databases, Redis and every other service in containers, started, backed up and moved with the same tools.",
        "My own build runners and shell scripts that build, migrate, deploy, check health and roll back, so I never paid for build minutes.",
      ],
    },
    cli: {
      title: "The CLI my startups ran on",
      points: [
        "A CLI of my own that most of my startups ran on: it set up servers, started the containers, databases and Redis among them, kept every " +
          "environment the same across hosts, and moved a whole stack from one host to another.",
        "On the platform I build now it is an infrastructure package: one CLI where a new host is one adapter, designed through 84 recorded decisions " +
          "covering provisioning, moving between hosts with a cost comparison, build runners and secrets.",
        "The same cut over for any host: add it, run both, switch, retire.",
      ],
    },
    practice: {
      title: "In production",
      intro: "AWS, releases, PostgreSQL and agents, as I run them.",
      topics: [
        {
          id: "aws",
          title: "AWS",
          points: [
            "Compute: EC2, ECS and EKS, Lambda, Auto Scaling and load balancers.",
            "Data: PostgreSQL on RDS and Aurora, DynamoDB, ElastiCache for Redis, S3 and CloudFront.",
            "Integration: API Gateway, SQS and SNS, Step Functions and EventBridge.",
            "AI and identity: Bedrock, Cognito, IAM, Secrets Manager and KMS. Set up in full and tuned for cost.",
          ],
        },
        {
          id: "deploy",
          title: "Releases and rollback",
          points: [
            "CI/CD with audit logs, permission controls and rollback, and database migrations verified on staging and production first.",
            "On Kubernetes, canary rollouts per market through Istio, so one market moves at a time under monitoring and rolls back alone.",
            "Workers deployed by build id with no downtime, so rolling back is deploying the last good build again; on servers of my own, shell scripts" +
              " that deploy, check health and roll back.",
          ],
        },
        {
          id: "postgres",
          title: "PostgreSQL",
          points: [
            "On the platform I build now: a job scheduler written over Postgres, with idempotency at three layers and no message broker or queue library.",
            "In Freight Delay Notifications, open source: Temporal workflows over PostgreSQL and Supabase, with PL/pgSQL.",
          ],
        },
        {
          id: "agent",
          title: "Agents and workflows",
          points: [
            "Freight Delay Notifications: Temporal workflows fetch traffic, check a delay threshold, have a model write the message and send it by " +
              "email or SMS, with a fallback for every provider.",
            "Ask Red, on this site: answers streamed from the site's own content across several AI providers, behind limits, a cache and a daily budget.",
          ],
        },
      ],
    },
  },
};
