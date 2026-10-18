import {
  Point, StoryCoin, StoryFrame, StoryId, StoryNode, StoryPacket, StoryReceipt, StoryWire, Tone,
} from "../domain/types";
import { along, flash, glide, settle, span } from "./motion";

// Each story as a pure function of its share of the switch (0 to 1), in a panel 300 by 210. The panel shows from
// about 0.06 to 0.84, so each is told inside that.

const node = (id: string, at: Point, icon: StoryNode["icon"], extra: Partial<StoryNode> = {}): StoryNode => ({
  id, at, icon, glow: 0, tone: "idle", shake: 0, mark: null, ...extra,
});

const wire = (from: Point, to: Point, bend: number, lit = 0, tone: Tone = "lit"): StoryWire => ({ from, to, bend, lit, tone });

const packet = (on: StoryWire, at: number, tone: Tone = "lit", size = 1, heading: 1 | -1 = 1): StoryPacket => ({ wire: on, at, heading, tone, size });

const EMPTY: Omit<StoryFrame, "wires" | "nodes"> = { packets: [], bursts: [], receipts: [], coins: [], signal: null };

// The gateway sends the payment to the first provider, which errors; it comes back and goes to the next, which
// approves, and the answer comes back. Only a provider's error is tried again, never a bank's decline.
const ROUTE = {
  gateway: { x: 58, y: 105 },
  providers: [{ x: 238, y: 50 }, { x: 238, y: 105 }, { x: 238, y: 160 }],
  out: [0.06, 0.24], failed: [0.24, 0.36], back: [0.36, 0.46], retry: [0.46, 0.62], approved: [0.62, 0.72], answer: [0.72, 0.82],
} as const;

export const routeAt = (t: number): StoryFrame => {
  const { gateway, providers } = ROUTE;
  const toFirst = span(t, ...ROUTE.out);
  const back = span(t, ...ROUTE.back);
  const retry = span(t, ...ROUTE.retry);
  const answer = span(t, ...ROUTE.answer);
  const isFailing = t >= ROUTE.failed[0];
  const isApproved = t >= ROUTE.approved[0];
  // Each wire lit as far as its payment has got.
  const first = wire(gateway, providers[0], -18, glide(toFirst) * (1 - glide(back)), isFailing ? "failed" : "lit");
  const second = wire(gateway, providers[1], 0, glide(retry), isApproved ? "approved" : "lit");
  const third = wire(gateway, providers[2], 18, 0);
  const packets: StoryPacket[] = [];

  if (t >= ROUTE.out[0] && t < ROUTE.failed[0]) {
    packets.push(packet(first, glide(toFirst)));
  } else if (t >= ROUTE.back[0] && t < ROUTE.back[1]) {
    packets.push(packet(first, 1 - glide(back), "failed", 0.8, -1));
  } else if (t >= ROUTE.retry[0] && t < ROUTE.retry[1]) {
    packets.push(packet(second, glide(retry)));
  } else if (t >= ROUTE.answer[0] && t < ROUTE.answer[1]) {
    packets.push(packet(second, 1 - glide(answer), "approved", 0.85, -1));
  }

  return {
    ...EMPTY,
    packets,
    wires: [first, second, third],
    nodes: [
      node("gateway", gateway, "gateway", { glow: Math.max(flash(t, 0.02, 0.12), flash(t, 0.42, 0.52), flash(t, 0.78, 0.9)), tone: t >= 0.8 ? "approved" : "lit" }),
      node("first", providers[0], "bank", {
        glow: flash(t, 0.22, 0.4),
        tone: isFailing ? "failed" : "idle",
        shake: flash(t, ROUTE.failed[0], ROUTE.failed[1]),
        mark: isFailing ? { kind: "cross", progress: span(t, ROUTE.failed[0], ROUTE.failed[0] + 0.06) } : null,
      }),
      node("second", providers[1], "bank", {
        glow: flash(t, 0.6, 0.8),
        tone: isApproved ? "approved" : retry > 0 ? "lit" : "idle",
        mark: isApproved ? { kind: "tick", progress: span(t, ROUTE.approved[0], ROUTE.approved[0] + 0.06) } : null,
      }),
      node("third", providers[2], "bank"),
    ],
    bursts: [
      ...(isFailing ? [{ at: providers[0], progress: span(t, ROUTE.failed[0], ROUTE.failed[0] + 0.14), tone: "failed" as Tone }] : []),
      ...(isApproved ? [{ at: providers[1], progress: span(t, ROUTE.approved[0], ROUTE.approved[0] + 0.16), tone: "approved" as Tone }] : []),
    ],
  };
};

// The authorisation leaves the terminal, crosses the acquirer and the network to the issuer, which approves, and the
// answer comes back the same way to the terminal.
const AUTHORISE = {
  stops: [{ x: 40, y: 112 }, { x: 113, y: 112 }, { x: 187, y: 112 }, { x: 260, y: 112 }],
  icons: ["till", "gateway", "network", "bank"] as const,
  hops: [[0.06, 0.17], [0.17, 0.28], [0.28, 0.39]],
  approved: [0.39, 0.48], answer: [0.48, 0.72], home: [0.72, 0.8],
} as const;

export const authoriseAt = (t: number): StoryFrame => {
  const { stops } = AUTHORISE;
  const answer = span(t, ...AUTHORISE.answer);
  const isApproved = t >= AUTHORISE.approved[0];
  const isHome = t >= AUTHORISE.home[0];
  // Each hop bows up on the way out and down on the way back.
  const wires = AUTHORISE.hops.map(([from, to], index) => {
    const out = glide(span(t, from, to));
    const backLit = glide(span(answer, (2 - index) / 3, (3 - index) / 3));

    return wire(stops[index], stops[index + 1], -14, Math.max(out, backLit), backLit > 0 ? "approved" : "lit");
  });
  const packets: StoryPacket[] = [];
  const hop = AUTHORISE.hops.findIndex(([from, to]) => t >= from && t < to);

  if (hop >= 0) {
    const [from, to] = AUTHORISE.hops[hop];

    packets.push(packet(wires[hop], glide(span(t, from, to))));
  } else if (t >= AUTHORISE.answer[0] && t < AUTHORISE.answer[1]) {
    const leg = Math.min(2, Math.floor(answer * 3));
    const within = answer * 3 - leg;

    packets.push(packet(wires[2 - leg], 1 - glide(within), "approved", 0.9, -1));
  }

  return {
    ...EMPTY,
    packets,
    wires,
    nodes: stops.map((at, index) => {
      const reached = index === 0 ? 0.06 : AUTHORISE.hops[index - 1][1];
      const isIssuer = index === stops.length - 1;
      const isTerminal = index === 0;

      return node(`stop-${index}`, at, AUTHORISE.icons[index], {
        glow: Math.max(flash(t, reached - 0.03, reached + 0.12), isTerminal ? flash(t, AUTHORISE.home[0] - 0.02, 0.9) : 0),
        tone: (isIssuer && isApproved) || (isTerminal && isHome) ? "approved" : t >= reached ? "lit" : "idle",
        mark: isIssuer && isApproved
          ? { kind: "tick", progress: span(t, AUTHORISE.approved[0], AUTHORISE.approved[0] + 0.06) }
          : isTerminal && isHome ? { kind: "tick", progress: span(t, AUTHORISE.home[0], AUTHORISE.home[0] + 0.06) } : null,
      });
    }),
    bursts: [
      ...(isApproved ? [{ at: stops[3], progress: span(t, AUTHORISE.approved[0], AUTHORISE.approved[0] + 0.16), tone: "approved" as Tone }] : []),
      ...(isHome ? [{ at: stops[0], progress: span(t, AUTHORISE.home[0], AUTHORISE.home[0] + 0.14), tone: "approved" as Tone }] : []),
    ],
  };
};

// No signal: the till keeps selling, its receipts piling up beside it; the signal comes back, and each receipt goes up
// to the cloud once.
const SYNC = {
  till: { x: 58, y: 138 },
  cloud: { x: 236, y: 62 },
  receipts: 4,
  printed: [0.06, 0.3], back: [0.3, 0.37], flights: [0.37, 0.72],
  // How long each receipt's flight takes, in its share of the flights' window.
  flight: 1.35,
} as const;

const RECEIPT_STACK = (index: number): Point => ({ x: 98 + index * 9, y: 150 - index * 7 });

export const syncAt = (t: number): StoryFrame => {
  const { till, cloud, receipts } = SYNC;
  const signalBack = span(t, ...SYNC.back);
  const up = wire(till, cloud, -36, signalBack > 0 ? glide(span(t, SYNC.back[1], SYNC.flights[1])) : 0, "lit");
  const each = (SYNC.flights[1] - SYNC.flights[0]) / receipts;
  const items: StoryReceipt[] = [];
  let landed = 0;

  for (let index = 0; index < receipts; index += 1) {
    const printedAt = SYNC.printed[0] + index * ((SYNC.printed[1] - SYNC.printed[0]) / receipts);
    const shown = settle(span(t, printedAt, printedAt + 0.06));
    const leaves = SYNC.flights[0] + index * each;
    const flight = span(t, leaves, leaves + each * SYNC.flight);

    if (flight >= 1) {
      landed += 1;
    } else if (shown > 0) {
      const stack = RECEIPT_STACK(index);
      const lift = { x: stack.x, y: stack.y - (1 - shown) * 12 };
      const route = wire(lift, cloud, -28 - index * 4, 0);
      const at = flight > 0 ? along(route, glide(flight)) : lift;

      items.push({ at, turn: (index - 1.5) * 0.08 * (1 - flight), opacity: shown * (1 - span(flight, 0.85, 1)) });
    }
  }

  return {
    ...EMPTY,
    wires: [up],
    nodes: [
      node("till", till, "till", { glow: flash(t, SYNC.back[0], SYNC.back[1] + 0.1), tone: signalBack > 0 ? "lit" : "idle" }),
      node("cloud", cloud, "cloud", {
        glow: Math.min(1, landed * 0.25 + flash(t, 0.72, 0.84)),
        tone: landed === receipts ? "approved" : landed > 0 ? "lit" : "idle",
        mark: landed === receipts ? { kind: "tick", progress: span(t, 0.76, 0.82) } : null,
      }),
    ],
    receipts: items,
    bursts: Array.from({ length: landed }, (_, index) => {
      const lands = SYNC.flights[0] + index * each + each * SYNC.flight;

      return { at: cloud, progress: span(t, lands, lands + 0.1), tone: "lit" as Tone };
    }).filter((burst) => burst.progress < 1),
    signal: { at: { x: till.x, y: till.y - 36 }, isLost: signalBack === 0, bars: Math.round(signalBack * 4) },
  };
};

// One payment comes in and splits three ways: the platform's fee, the seller's share and the developer's, each coin
// as large as its share.
const SPLIT = {
  from: { x: -12, y: 105 },
  hub: { x: 104, y: 105 },
  shares: [{ x: 238, y: 48, icon: "platform", share: 0.1 }, { x: 238, y: 105, icon: "seller", share: 0.7 }, { x: 238, y: 162, icon: "developer", share: 0.2 }],
  arrive: [0.06, 0.28], burst: [0.28, 0.36], flights: [0.36, 0.7], landed: 0.7,
} as const;

export const SPLIT_SHARES = SPLIT.shares.map(({ share }) => share);

export const splitAt = (t: number): StoryFrame => {
  const { from, hub, shares } = SPLIT;
  const arrive = span(t, ...SPLIT.arrive);
  const isSplit = t >= SPLIT.burst[0];
  const incoming = wire(from, hub, 0, arrive);
  const branches = shares.map((share, index) => {
    const leaves = SPLIT.flights[0] + index * 0.04;

    return wire(hub, share, (index - 1) * 16, span(t, leaves, leaves + 0.26), "approved");
  });
  const coins: StoryCoin[] = [];

  if (!isSplit) {
    coins.push({ at: along(incoming, glide(arrive)), radius: 9, spin: t * 26, opacity: span(t, 0.05, 0.09) });
  } else if (t < SPLIT.flights[0]) {
    coins.push({ at: hub, radius: 9 + flash(t, ...SPLIT.burst) * 3, spin: t * 30, opacity: 1 - span(t, SPLIT.burst[1] - 0.02, SPLIT.burst[1]) });
  }

  shares.forEach((share, index) => {
    const leaves = SPLIT.flights[0] + index * 0.04;
    const flight = span(t, leaves, leaves + 0.26);

    if (flight > 0 && flight < 1) {
      coins.push({ at: along(branches[index], glide(flight)), radius: 4 + share.share * 8, spin: t * 30 + index, opacity: 1 });
    }
  });

  const landedAt = (index: number) => SPLIT.flights[0] + index * 0.04 + 0.26;

  return {
    ...EMPTY,
    wires: [incoming, ...branches],
    nodes: [
      node("hub", hub, "gateway", { glow: flash(t, 0.24, 0.42), tone: isSplit ? "lit" : "idle" }),
      ...shares.map((share, index) => node(`share-${index}`, share, share.icon, {
        glow: flash(t, landedAt(index) - 0.02, landedAt(index) + 0.14),
        tone: t >= landedAt(index) ? "approved" : "idle",
        mark: t >= landedAt(index) ? { kind: "tick", progress: span(t, landedAt(index), landedAt(index) + 0.06) } : null,
      })),
    ],
    coins,
    bursts: [
      ...(isSplit ? [{ at: hub, progress: span(t, SPLIT.burst[0], SPLIT.burst[0] + 0.14), tone: "approved" as Tone }] : []),
      ...shares.map((share, index) => ({ at: share as Point, progress: span(t, landedAt(index), landedAt(index) + 0.12), tone: "approved" as Tone }))
        .filter((burst, index) => t >= landedAt(index) && burst.progress < 1),
    ],
  };
};

export const STORY_AT: Record<StoryId, (t: number) => StoryFrame> = { route: routeAt, authorise: authoriseAt, sync: syncAt, split: splitAt };
