import { FC, ReactNode } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBuildingColumns, faCashRegister, faCheck, faCloud, faCode, faGlobe, faLayerGroup, faServer, faStore, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { RECEIPT_PAPER } from "@/components/Payments/scene/looks";
import { SCENE } from "@/components/Payments/scene/Scene";
import { noAnimationWhenReduced } from "@/styles/mixins";

// The subjects the payments drawings open with, each told in under a second and a half: a payment routed
// past a failing provider, an authorisation round the card networks and back, sales waiting out an outage
// and syncing once each, and a payment split into its shares. Boxes stand where the drawings' own boxes
// would; only transform and opacity move.

type Frames = ReturnType<typeof keyframes>;

const NODE = 36;

// The stories are drawn in a band of their own, centred in the panel the terminal's scene sets.
const STORY_HEIGHT = 180;

const Stage = styled.div(() => [
  tw`relative`,
  css`
    width: ${SCENE.width}px;
    height: ${STORY_HEIGHT}px;
    margin-top: ${(SCENE.height - STORY_HEIGHT) / 2}px;
  `,
]);

const moving = (frames: Frames, ease = "cubic-bezier(0.35, 0.6, 0.3, 1)") => css`
  animation: ${frames} var(--pay-ms) ${ease} both;
`;

const NodeBox = styled.span(() => [
  tw`absolute flex items-center justify-center rounded-[6px] text-[15px] text-[var(--accent)] bg-[#121212]
  border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    width: ${NODE}px;
    height: ${NODE}px;
  `,
]);

// A badge on a box: a tick when a step goes through, a cross when it fails.
const Badge = styled.span(({ frames, isFailure }: { frames: Frames; isFailure?: boolean }) => [
  tw`absolute right-[-6px] top-[-6px] flex items-center justify-center w-[16px] h-[16px] rounded-full text-[9px] text-[#0d0d0d] opacity-0`,
  isFailure ? tw`bg-[#ff6b6b]` : tw`bg-[var(--accent)]`,
  moving(frames, "ease-out"),
  noAnimationWhenReduced,
]);

const Node: FC<{ icon: IconDefinition; left: number; top: number; children?: ReactNode }> = ({ icon, left, top, children }) => (
  <NodeBox style={{ left, top }}>
    <FontAwesomeIcon icon={icon} />
    {children}
  </NodeBox>
);

// Shows from a share of the story on, popping in.
const showFrom = (share: number) => keyframes`
  0%, ${share}% { opacity: 0; transform: scale(0.5); }
  ${Math.min(share + 6, 100)}% { opacity: 1; transform: scale(1.15); }
  ${Math.min(share + 12, 100)}%, 100% { opacity: 1; transform: scale(1); }
`;

// When each badge pops in, as a share of the story, made once rather than on every render.
const BADGE_AT = {
  routeFailed: showFrom(28),
  routeApproved: showFrom(70),
  issuerApproved: showFrom(42),
  terminalApproved: showFrom(86),
  synced: showFrom(80),
  shared: showFrom(68),
};

const Wires: FC<{ lines: Array<[number, number, number, number]> }> = ({ lines }) => (
  <svg width={SCENE.width} height={STORY_HEIGHT} style={{ position: "absolute", inset: 0 }} aria-hidden="true" focusable="false">
    {lines.map(([x1, y1, x2, y2]) => (
      <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: "var(--accent-muted)", strokeWidth: 1.5, strokeDasharray: "4 3" }} />
    ))}
  </svg>
);

const Packet = styled.span(({ frames }: { frames: Frames }) => [
  tw`absolute block w-[10px] h-[10px] rounded-full bg-[var(--accent)] opacity-0`,
  css`
    box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.8);
  `,
  moving(frames),
  noAnimationWhenReduced,
]);

// The gateway sends the payment to the first provider, which errors; it comes back and goes to the next,
// which approves. A bank's decline would end there: only a provider's error is tried again.
const ROUTE = { gateway: { left: 20, top: 72 }, providers: [16, 72, 128], providerLeft: 224 } as const;

const routeTrip = keyframes`
  0% { transform: translate(0, 0); opacity: 0; }
  5% { opacity: 1; }
  28%, 38% { transform: translate(162px, -56px); }
  50% { transform: translate(0, 0); }
  70%, 100% { transform: translate(162px, 0); opacity: 1; }
`;

const RouteStory: FC = () => {
  const from = ROUTE.gateway.left + NODE;
  const middle = ROUTE.gateway.top + NODE / 2;

  return (
    <Stage>
      <Wires lines={ROUTE.providers.map((top) => [from, middle, ROUTE.providerLeft, top + NODE / 2])} />
      <Node icon={faServer} {...ROUTE.gateway} />
      {ROUTE.providers.map((top, index) => (
        <Node key={top} icon={faBuildingColumns} left={ROUTE.providerLeft} top={top}>
          {index === 0 && <Badge frames={BADGE_AT.routeFailed} isFailure><FontAwesomeIcon icon={faXmark} /></Badge>}
          {index === 1 && <Badge frames={BADGE_AT.routeApproved}><FontAwesomeIcon icon={faCheck} /></Badge>}
        </Node>
      ))}
      <Packet frames={routeTrip} style={{ left: from - 5, top: middle - 5 }} />
    </Stage>
  );
};

// The authorisation leaves the terminal, crosses the acquirer and the network to the issuer, which
// approves, and the answer comes back the same way.
const AUTHORISE = { lefts: [16, 88, 160, 232], top: 72 } as const;

const authoriseTrip = keyframes`
  0% { transform: translateX(0); opacity: 0; }
  5% { opacity: 1; }
  40%, 50% { transform: translateX(176px); }
  86%, 100% { transform: translateX(0); opacity: 1; }
`;

const AUTHORISE_ICONS = [faCashRegister, faServer, faGlobe, faBuildingColumns];

const AuthoriseStory: FC = () => {
  const [first] = AUTHORISE.lefts;
  const middle = AUTHORISE.top + NODE / 2;

  return (
    <Stage>
      <Wires lines={[[first + NODE, middle, AUTHORISE.lefts[3], middle]]} />
      {AUTHORISE.lefts.map((left, index) => (
        <Node key={left} icon={AUTHORISE_ICONS[index]} left={left} top={AUTHORISE.top}>
          {index === 3 && <Badge frames={BADGE_AT.issuerApproved}><FontAwesomeIcon icon={faCheck} /></Badge>}
          {index === 0 && <Badge frames={BADGE_AT.terminalApproved}><FontAwesomeIcon icon={faCheck} /></Badge>}
        </Node>
      ))}
      <Packet frames={authoriseTrip} style={{ left: first + NODE - 5, top: middle - 5 }} />
    </Stage>
  );
};

// No signal: the till keeps selling, receipts pile up beside it; the signal returns and each goes up once.
const SYNC = { till: { left: 16, top: 72 }, cloud: { left: 232, top: 72 }, receipts: 4, firstReceipt: 92, gap: 15 } as const;

const signalBack = keyframes`
  0%, 26% { opacity: 0.25; }
  32%, 100% { opacity: 1; }
`;

const signalLost = keyframes`
  0%, 24% { opacity: 1; }
  30%, 100% { opacity: 0; }
`;

const receiptFlights = Array.from({ length: SYNC.receipts }, (_, index) => {
  const start = 32 + index * 9;
  const distance = SYNC.cloud.left + 12 - (SYNC.firstReceipt + index * SYNC.gap);

  return keyframes`
    0%, ${start}% { transform: translate(0, 0); opacity: 1; }
    ${start + 14}% { transform: translate(${distance}px, -4px); opacity: 0.3; }
    ${start + 16}%, 100% { transform: translate(${distance}px, -4px); opacity: 0; }
  `;
});

const Signal = tw.span`absolute flex items-end gap-[2px]`;

const SignalBar = styled.span(({ height }: { height: number }) => [
  tw`block w-[3px] rounded-[1px] bg-[var(--accent)]`,
  css`
    height: ${height}px;
    animation: ${signalBack} var(--pay-ms) linear both;
  `,
  noAnimationWhenReduced,
]);

const Slash = styled.span(() => [
  tw`absolute block w-[20px] h-[2px] bg-[#ff6b6b] left-[-3px] top-[6px]`,
  css`
    transform: rotate(-40deg);
    animation: ${signalLost} var(--pay-ms) linear both;
  `,
  noAnimationWhenReduced,
]);

// A receipt, with two printed lines so it reads as one.
const Slip = styled.span(({ frames }: { frames: Frames }) => [
  tw`absolute block w-[11px] h-[15px] rounded-[1px]`,
  css`
    background: ${RECEIPT_PAPER};

    &::before,
    &::after {
      content: "";
      position: absolute;
      left: 2px;
      height: 1px;
      background: #9a968c;
    }

    &::before {
      top: 4px;
      right: 2px;
    }

    &::after {
      top: 8px;
      right: 4px;
    }
  `,
  moving(frames, "ease-in"),
  noAnimationWhenReduced,
]);

const SyncStory: FC = () => (
  <Stage>
    <Node icon={faCashRegister} {...SYNC.till} />
    <Signal style={{ left: 60, top: 74 }}>
      {[6, 10, 14].map((height) => <SignalBar key={height} height={height} />)}
      <Slash />
    </Signal>
    {receiptFlights.map((frames, index) => (
      <Slip key={index} frames={frames} style={{ left: SYNC.firstReceipt + index * SYNC.gap, top: SYNC.till.top + 11 }} />
    ))}
    <Node icon={faCloud} {...SYNC.cloud}>
      <Badge frames={BADGE_AT.synced}><FontAwesomeIcon icon={faCheck} /></Badge>
    </Node>
  </Stage>
);

// One coin comes in and splits three ways: the platform's fee, the seller's share and the developer's.
const SPLIT = { coin: { left: 34, top: 76, size: 28 }, slots: [20, 72, 124], slotLeft: 224, share: 16 } as const;

const coinIn = keyframes`
  0% { transform: translateX(-30px); opacity: 0; }
  12%, 28% { transform: translateX(0) scale(1); opacity: 1; }
  34%, 100% { transform: translateX(0) scale(0.4); opacity: 0; }
`;

const shareFlights = SPLIT.slots.map((top) => {
  const fromLeft = SPLIT.coin.left + SPLIT.coin.size / 2 - SPLIT.share / 2;
  const fromTop = SPLIT.coin.top + SPLIT.coin.size / 2 - SPLIT.share / 2;
  const x = SPLIT.slotLeft + NODE / 2 - SPLIT.share / 2 - fromLeft;
  const y = top + NODE / 2 - SPLIT.share / 2 - fromTop;

  return keyframes`
    0%, 28% { transform: translate(0, 0) scale(0.6); opacity: 0; }
    34% { transform: translate(0, 0) scale(1); opacity: 1; }
    66% { transform: translate(${x}px, ${y}px) scale(1); opacity: 1; }
    72%, 100% { transform: translate(${x}px, ${y}px) scale(0.5); opacity: 0; }
  `;
});

const coinFace = css`
  background: radial-gradient(circle at 35% 30%, #fff1b8, #f5c542 45%, #b8860b);
  border: 1px solid #8a6508;
`;

const Coin = styled.span(({ size, frames }: { size: number; frames: Frames }) => [
  tw`absolute block rounded-full opacity-0`,
  coinFace,
  css`
    width: ${size}px;
    height: ${size}px;
  `,
  moving(frames),
  noAnimationWhenReduced,
]);

const SPLIT_ICONS = [faLayerGroup, faStore, faCode];

const SplitStory: FC = () => (
  <Stage>
    <Wires lines={SPLIT.slots.map((top) => [SPLIT.coin.left + SPLIT.coin.size, SPLIT.coin.top + SPLIT.coin.size / 2, SPLIT.slotLeft, top + NODE / 2])} />
    <Coin size={SPLIT.coin.size} frames={coinIn} style={{ left: SPLIT.coin.left, top: SPLIT.coin.top }} />
    {SPLIT.slots.map((top, index) => (
      <Node key={top} icon={SPLIT_ICONS[index]} left={SPLIT.slotLeft} top={top}>
        <Badge frames={BADGE_AT.shared}><FontAwesomeIcon icon={faCheck} /></Badge>
      </Node>
    ))}
    {shareFlights.map((frames, index) => (
      <Coin
        key={index}
        size={SPLIT.share}
        frames={frames}
        style={{ left: SPLIT.coin.left + SPLIT.coin.size / 2 - SPLIT.share / 2, top: SPLIT.coin.top + SPLIT.coin.size / 2 - SPLIT.share / 2 }}
      />
    ))}
  </Stage>
);

export const STORIES = { route: RouteStory, authorise: AuthoriseStory, sync: SyncStory, split: SplitStory } as const;
