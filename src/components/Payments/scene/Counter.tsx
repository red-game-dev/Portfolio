import { CSSProperties, FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faCheck, faCoins, faCreditCard, faQrcode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Contactless, PaymentCard, PaymentPhone, PhoneScanLine } from "@/components/Payments/scene/Instrument";
import { RECEIPT_PAPER } from "@/components/Payments/scene/looks";
import { PAY_APPS, PAY_GESTURES, PayApp, payAppOf, PayGesture, PaymentMethodId } from "@/config/payments";
import { noAnimationWhenReduced } from "@/styles/mixins";

// A shop counter seen from the side: the cashier behind it at the till, the smart terminal on it facing the
// customer, and the customer, played by the reader, paying the way they chose. In the full story the cashier
// rings the basket up, opens the app that fits the way to pay and sends the total to the terminal, then the
// customer's arm brings the card or the phone to it; the quick story, for a drawing's switch, starts with the
// total already on the terminal. Arms turn at the shoulder and reach by length, nested so the hand always meets
// the end of the arm. Everything moves by transform and opacity, timed as shares of `--pay-ms`.

export const COUNTER = { width: 300, height: 210 } as const;

interface Point { x: number; y: number }

const SURFACE = { top: 150, end: 238 } as const;

const TILL = { left: 74, top: 100, width: 56, height: 38 } as const;

const TERMINAL = { left: 170, top: 58, width: 42, height: 90 } as const;

const CASHIER = { head: { x: 42, y: 70 }, shoulder: { x: 58, y: 100 } } as const;

const CUSTOMER = { head: { x: 266, y: 62 }, shoulder: { x: 250, y: 94 } } as const;

const SKIN = { cashier: "#c8956d", customer: "#8a5a3c" } as const;

const CLOTHES = { cashier: "#2b2b2b", customer: "#3d4b6e" } as const;

// The arm's bar is drawn this long and stretched to the reach it needs.
const BAR = 40;

// Where the hands rest, and where the customer's meets the terminal for each way to pay.
const REST = { cashier: { x: 60, y: 142 }, customer: { x: 252, y: 142 } } as const;

const REACH: Record<PayGesture, Point[]> = {
  // Held to the contactless sign on the screen, pressed in a moment, held.
  tap: [{ x: 206, y: 96 }, { x: 204, y: 97 }],
  wallet: [{ x: 206, y: 94 }, { x: 204, y: 95 }],
  // Brought to the chip reader at the foot, then pushed in.
  insert: [{ x: 224, y: 140 }, { x: 216, y: 140 }],
  // Run down the stripe reader at the side.
  swipe: [{ x: 220, y: 72 }, { x: 220, y: 128 }],
  // Held up to the screen while its camera reads the QR code.
  scan: [{ x: 232, y: 94 }, { x: 232, y: 95 }],
};

// Where the cashier taps: the basket's items, then the app for the way to pay.
const TILL_TAPS: Point[] = [{ x: 92, y: 110 }, { x: 104, y: 116 }, { x: 116, y: 110 }];

const APP_AT: Record<PayApp, Point> = {
  card: { x: 87, y: 130 },
  qr: { x: 102, y: 130 },
  crypto: { x: 117, y: 130 },
};

// The two stories' timings, as shares of the whole (percent).
type Variant = "full" | "quick";

interface Timing {
  // The customer's arm: leaving its rest, reaching the terminal, done there, back at rest.
  reachFrom: number;
  reach: number;
  done: number;
  back: number;
  // The terminal's screen: asking to pay from, processing, approved from.
  ask: number;
  processing: number;
  approved: number;
  printed: [number, number];
}

const TIMINGS: Record<Variant, Timing> = {
  full: { reachFrom: 50, reach: 62, done: 74, back: 92, ask: 50, processing: 72, approved: 78, printed: [80, 94] },
  quick: { reachFrom: 0, reach: 30, done: 50, back: 86, ask: 0, processing: 50, approved: 58, printed: [62, 84] },
};

// The share of the full story at which the payment is approved.
export const APPROVED_AT = TIMINGS.full.approved / 100;

type Pose = [number, Point];

const degrees = (radians: number) => (radians * 180) / Math.PI;

// The keyframes that turn an arm at its shoulder, stretch it and keep the hand at its end, the hand's own turn
// undone so a card stays the right way up. Angles are unwrapped so the arm never swings the long way round.
const armFrames = (shoulder: Point, poses: Pose[]) => {
  let previous: number | null = null;
  const steps = poses.map(([at, point]) => {
    let angle = degrees(Math.atan2(point.y - shoulder.y, point.x - shoulder.x));

    while (previous !== null && angle - previous > 180) {
      angle -= 360;
    }

    while (previous !== null && previous - angle > 180) {
      angle += 360;
    }

    previous = angle;

    return { at, angle: Math.round(angle * 10) / 10, length: Math.round(Math.hypot(point.x - shoulder.x, point.y - shoulder.y) * 10) / 10 };
  });
  const frames = (write: (step: typeof steps[number]) => string) => steps.map((step) => `${step.at}% { transform: ${write(step)}; }`).join("\n");

  return {
    pivot: keyframes`${frames(({ angle }) => `rotate(${angle}deg)`)}`,
    bar: keyframes`${frames(({ length }) => `scaleX(${Math.round((length / BAR) * 1000) / 1000})`)}`,
    mount: keyframes`${frames(({ angle, length }) => `translateX(${length}px) rotate(${-angle}deg)`)}`,
    rest: steps[0],
  };
};

type ArmFrames = ReturnType<typeof armFrames>;

const memo = <T,>(make: (key: string) => T) => {
  const made = new Map<string, T>();

  return (key: string) => {
    if (!made.has(key)) {
      made.set(key, make(key));
    }

    return made.get(key) as T;
  };
};

const customerPoses = (gesture: PayGesture, { reachFrom, reach, done, back }: Timing): Pose[] => {
  const [first, second] = REACH[gesture];
  const middle = Math.round((reach + done) / 2);

  return [
    [0, REST.customer],
    [reachFrom, REST.customer],
    [reach, first],
    [gesture === "swipe" ? done : middle, second],
    [done, second],
    [back, REST.customer],
    [100, REST.customer],
  ].filter(([at], index, all) => index === 0 || at !== all[index - 1][0]) as Pose[];
};

const cashierPoses = (app: PayApp): Pose[] => {
  const [one, two, three] = TILL_TAPS;
  const tile = APP_AT[app];
  const pressed = (point: Point) => ({ x: point.x, y: point.y + 2 });

  return [
    [0, REST.cashier],
    [6, one],
    [10, pressed(one)],
    [14, two],
    [18, pressed(two)],
    [22, three],
    [26, pressed(three)],
    [32, tile],
    [35, pressed(tile)],
    [40, tile],
    [50, REST.cashier],
    [100, REST.cashier],
  ];
};

const customerArm = memo((key) => {
  const [gesture, variant] = key.split(":") as [PayGesture, Variant];

  return armFrames(CUSTOMER.shoulder, customerPoses(gesture, TIMINGS[variant]));
});

const cashierArm = memo((app) => armFrames(CASHIER.shoulder, cashierPoses(app as PayApp)));

const RESTING = { cashier: armFrames(CASHIER.shoulder, [[0, REST.cashier]]).rest, customer: armFrames(CUSTOMER.shoulder, [[0, REST.customer]]).rest };

// Shows between two shares of the story, fading in and out over a step either side.
const between = memo((key) => {
  const [from, to] = key.split("-").map(Number);
  const fadeIn = Math.max(from - 2, 0);
  const fadeOut = Math.min(to + 2, 100);

  return keyframes`
    0% { opacity: ${from === 0 ? 1 : 0}; }
    ${fadeIn}% { opacity: ${from === 0 ? 1 : 0}; }
    ${from}% { opacity: 1; }
    ${to}% { opacity: 1; }
    ${fadeOut}% { opacity: ${to === 100 ? 1 : 0}; }
    100% { opacity: ${to === 100 ? 1 : 0}; }
  `;
});

const showing = (from: number, to: number) => between(`${from}-${to}`);

const printed = memo((key) => {
  const [from, to] = key.split("-").map(Number);

  return keyframes`
    0%, ${from}% { transform: translateY(34px); }
    ${to}%, 100% { transform: translateY(0); }
  `;
});

const sent = keyframes`
  0%, 42% { transform: translateX(0); opacity: 0; }
  43% { opacity: 1; }
  50% { transform: translateX(42px) translateY(-14px); opacity: 1; }
  51%, 100% { transform: translateX(42px) translateY(-14px); opacity: 0; }
`;

const scanSweep = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(13px); }
  100% { transform: translateY(0); }
`;

// What a moving part plays while the story runs; every one also carries noAnimationWhenReduced on its own class.
const playing = (frames: ReturnType<typeof keyframes>, ease = "ease-in-out") => css`
  animation: ${frames} var(--pay-ms) ${ease} both;
`;

const Stage = styled.div(() => [
  tw`relative overflow-hidden`,
  css`
    width: ${COUNTER.width}px;
    height: ${COUNTER.height}px;
  `,
]);

const at = (left: number, top: number, width?: number, height?: number): CSSProperties => ({ left, top, width, height });

const Part = tw.div`absolute`;

// The people: a head, hair and shoulders, flat and faceless; the counter hides what is below it.
const Head = styled.div(({ skin }: { skin: string }) => [
  tw`absolute rounded-full`,
  css`
    background: ${skin};
  `,
]);

const Hair = styled.div(({ colour }: { colour: string }) => [
  tw`absolute rounded-t-full`,
  css`
    background: ${colour};
  `,
]);

const Torso = styled.div(({ colour }: { colour: string }) => [
  tw`absolute rounded-t-[18px]`,
  css`
    background: ${colour};
  `,
]);

const Apron = tw.div`absolute rounded-t-[4px] bg-[var(--accent)] opacity-[0.85]`;

const Figure: FC<{ who: "cashier" | "customer" }> = ({ who }) => {
  const { head } = who === "cashier" ? CASHIER : CUSTOMER;
  const torsoTop = head.y + 16;

  return (
    <>
      <Torso colour={CLOTHES[who]} style={at(head.x - 22, torsoTop, 44, COUNTER.height - torsoTop)} />
      {who === "cashier" && <Apron style={at(head.x - 11, torsoTop + 12, 22, COUNTER.height - torsoTop)} />}
      <Head skin={SKIN[who]} style={at(head.x - 4, head.y + 8, 8, 10)} />
      <Head skin={SKIN[who]} style={at(head.x - 13, head.y - 13, 26, 26)} />
      <Hair colour={who === "cashier" ? "#2a1c12" : "#141414"} style={at(head.x - 14, head.y - 15, 28, 13)} />
    </>
  );
};

const Pivot = styled.div(({ frames, rest }: { frames?: ArmFrames["pivot"]; rest: ArmFrames["rest"] }) => [
  tw`absolute w-0 h-0`,
  css`
    transform: rotate(${rest.angle}deg);
  `,
  frames && playing(frames),
  noAnimationWhenReduced,
]);

const Bar = styled.div(({ frames, rest, colour }: { frames?: ArmFrames["bar"]; rest: ArmFrames["rest"]; colour: string }) => [
  tw`absolute left-0 top-[-4px] h-[8px] rounded-full origin-left`,
  css`
    width: ${BAR}px;
    background: ${colour};
    transform: scaleX(${rest.length / BAR});
  `,
  frames && playing(frames),
  noAnimationWhenReduced,
]);

const Mount = styled.div(({ frames, rest }: { frames?: ArmFrames["mount"]; rest: ArmFrames["rest"] }) => [
  tw`absolute left-0 top-0 w-0 h-0`,
  css`
    transform: translateX(${rest.length}px) rotate(${-rest.angle}deg);
  `,
  frames && playing(frames),
  noAnimationWhenReduced,
]);

const Hand = styled.div(({ skin }: { skin: string }) => [
  tw`absolute left-[-5px] top-[-5px] w-[10px] h-[10px] rounded-full`,
  css`
    background: ${skin};
  `,
]);

// What the customer holds, scaled from the full size card and phone, shown only while they pay.
const Held = styled.div(({ frames, heldAt }: { frames?: ReturnType<typeof keyframes>; heldAt: Point }) => [
  tw`absolute origin-top-left opacity-0`,
  css`
    left: ${heldAt.x}px;
    top: ${heldAt.y}px;
    transform: scale(0.38);
  `,
  frames && playing(frames, "linear"),
  noAnimationWhenReduced,
]);

const HELD_AT: Record<PayGesture, Point> = {
  tap: { x: -31, y: -10 },
  wallet: { x: -16, y: -14 },
  insert: { x: -31, y: -10 },
  swipe: { x: -19, y: -16 },
  scan: { x: -16, y: -16 },
};

const ScanLine = styled(PhoneScanLine)(() => [
  css`
    animation: ${scanSweep} 600ms ease-in-out infinite;
  `,
  noAnimationWhenReduced,
]);

const Arm: FC<{ who: "cashier" | "customer"; frames?: ArmFrames; children?: JSX.Element }> = ({ who, frames, children }) => {
  const { shoulder } = who === "cashier" ? CASHIER : CUSTOMER;
  const rest = RESTING[who];

  return (
    <Pivot frames={frames?.pivot} rest={rest} style={at(shoulder.x, shoulder.y)}>
      <Bar frames={frames?.bar} rest={rest} colour={CLOTHES[who]} />
      <Mount frames={frames?.mount} rest={rest}>
        {children}
        <Hand skin={SKIN[who]} />
      </Mount>
    </Pivot>
  );
};

// The counter: its top, its front, and the edge catching the light.
const Surface = tw.div`absolute z-[2] bg-[#343434] border-t-[1px] border-solid border-[var(--accent-muted)]`;

const Front = tw.div`absolute z-[2] bg-[#1b1b1b]`;

// The till: a tablet on a stand, facing the cashier.
const Tablet = tw.div`absolute z-[3] rounded-[4px] p-[2px] bg-[#0f0f0f] border-[1px] border-solid border-[#3a3a3a]`;

const TabletScreen = tw.div`relative w-full h-full rounded-[2px] overflow-hidden bg-[#141c18]`;

const Stand = tw.div`absolute z-[3] bg-[#2a2a2a]`;

const Layer = styled.div(({ frames, isShown }: { frames?: ReturnType<typeof keyframes>; isShown: boolean }) => [
  tw`absolute inset-0`,
  isShown ? tw`opacity-100` : tw`opacity-0`,
  frames && playing(frames, "linear"),
  noAnimationWhenReduced,
]);

interface ItemLineProps {
  frames?: ReturnType<typeof keyframes>;
  isShown: boolean;
  lineWidth: number;
  lineTop: number;
}

const ItemLine = styled.div(({ frames, isShown, lineWidth, lineTop }: ItemLineProps) => [
  tw`absolute left-[4px] h-[3px] rounded-full`,
  isShown ? tw`opacity-100` : tw`opacity-0`,
  css`
    top: ${lineTop}px;
    width: ${lineWidth}px;
    background: rgba(var(--accent-rgb), 0.5);
  `,
  frames && playing(frames, "linear"),
  noAnimationWhenReduced,
]);

const Total = tw.div`absolute left-[4px] right-[4px] bottom-[3px] flex items-center justify-between text-[7px] font-semibold
leading-none text-[var(--accent)]`;

const Apps = tw.div`absolute left-[4px] right-[4px] bottom-[2px] flex justify-between`;

const AppTile = styled.div(({ isChosen, frames }: { isChosen: boolean; frames?: ReturnType<typeof keyframes> }) => [
  tw`relative flex items-center justify-center w-[13px] h-[11px] rounded-[2px] text-[6px] text-[#0d0d0d] bg-[var(--accent-muted)]`,
  isChosen && tw`bg-[var(--accent)]`,
  frames && playing(frames, "linear"),
  noAnimationWhenReduced,
]);

const APP_ICONS = { card: faCreditCard, qr: faQrcode, crypto: faCoins } as const;

// The link from the till to the terminal, and the total travelling along it.
const Link = tw.div`absolute z-[2] h-0 border-t-[1px] border-dashed border-[var(--accent-muted)] origin-left`;

const Packet = styled.div(({ isPlaying }: { isPlaying: boolean }) => [
  tw`absolute z-[4] w-[6px] h-[6px] rounded-full bg-[var(--accent)] opacity-0`,
  isPlaying && playing(sent, "ease-in-out"),
  noAnimationWhenReduced,
]);

// The smart terminal: a touchscreen, the chip reader's mouth at its foot, the stripe reader down its side and the
// printer at its top.
const TerminalBody = tw.div`absolute z-[4] rounded-[7px] bg-[#1e1e20] border-[1px] border-solid border-[#454548]`;

const TerminalScreen = tw.div`absolute left-[4px] top-[7px] right-[4px] h-[56px] rounded-[3px] overflow-hidden bg-[#0e1612]
border-[1px] border-solid border-[#2a3a31]`;

const ScreenLayer = styled(Layer)(() => [tw`flex flex-col items-center justify-center gap-[3px] text-center`]);

const ScreenAmount = tw.span`block text-[8px] leading-none font-semibold text-[var(--accent)]`;

// Where there is no amount to show, a bar stands for it.
const AmountBar = tw.span`block w-[18px] h-[3px] rounded-full bg-[var(--accent)]`;

const Amount: FC<{ amount?: string }> = ({ amount }) => (amount ? <ScreenAmount>{amount}</ScreenAmount> : <AmountBar />);

const PromptIcons = tw.span`flex items-center gap-[3px] text-[var(--accent)]`;

const ChipGlyph = tw.span`block w-[9px] h-[6px] rounded-[1px] border-[1px] border-solid border-[var(--accent)]`;

const Dots = tw.span`flex gap-[3px]`;

const Dot = tw.span`block w-[3px] h-[3px] rounded-full bg-[var(--accent)]`;

const Tick = tw.span`flex items-center justify-center w-[16px] h-[16px] rounded-full text-[9px] text-[#0d0d0d] bg-[var(--accent)]`;

const Mouth = tw.div`absolute z-[8] h-[3px] rounded-[1px] bg-[#0a0a0a]`;

const Groove = tw.div`absolute z-[5] w-[2px] rounded-[1px] bg-[#0b0b0b]`;

const Receipt = styled.div(({ frames, isOut }: { frames?: ReturnType<typeof keyframes>; isOut: boolean }) => [
  tw`absolute z-[3] flex flex-col gap-[3px] pt-[5px] px-[4px] rounded-t-[1px]`,
  css`
    background: ${RECEIPT_PAPER};
    transform: translateY(${isOut ? 0 : 34}px);
  `,
  frames && playing(frames, "ease-out"),
  noAnimationWhenReduced,
]);

const ReceiptLine = tw.span`block h-[1.5px] bg-[#9a968c]`;

// A QR code drawn from a fixed pattern of cells, with the three finder squares in its corners.
const QR_CELLS = 9;
const QR_FINDERS = [[0, 0], [0, 6], [6, 0]];

const isFinder = (row: number, column: number) =>
  QR_FINDERS.some(([top, left]) => row >= top && row < top + 3 && column >= left && column < left + 3);

const isDark = (row: number, column: number) => (isFinder(row, column) ? !(row % 6 === 1 && column % 6 === 1) : (row * 7 + column * 3) % 5 < 2);

const QrGrid = styled.span(() => [
  tw`grid gap-0 p-[2px] bg-white`,
  css`
    grid-template-columns: repeat(${QR_CELLS}, 3px);
    grid-template-rows: repeat(${QR_CELLS}, 3px);
  `,
]);

const QrCell = styled.span(({ isOn }: { isOn: boolean }) => [tw`block`, isOn ? tw`bg-[#111]` : tw`bg-white`]);

export const Qr: FC = () => (
  <QrGrid aria-hidden="true">
    {Array.from({ length: QR_CELLS * QR_CELLS }, (_, index) => (
      <QrCell key={index} isOn={isDark(Math.floor(index / QR_CELLS), index % QR_CELLS)} />
    ))}
  </QrGrid>
);

export type CounterMode = "idle" | "playing" | "approved";

interface CounterProps {
  method: PaymentMethodId;
  // The full story (the cashier rings up first) for the terminal a reader pays at, the quick one for a switch.
  variant: Variant;
  // Waiting for a payment, telling one, or showing one approved without moving (with less motion asked for).
  mode: CounterMode;
  durationMs: number;
  // What the till and the terminal's screen show as the total; a switch, which has no words, shows a bar instead.
  amount?: string;
  // How the method meets the terminal, where a story asks for another way than its own (the POS taps every card).
  gesture?: PayGesture;
}

export const Counter: FC<CounterProps> = ({ method, variant, mode, durationMs, amount, gesture: asked }: CounterProps) => {
  const gesture = asked ?? PAY_GESTURES[method];
  const app = payAppOf(method);
  const timing = TIMINGS[variant];
  const isPlaying = mode === "playing";
  const isApproved = mode === "approved";
  const isScan = gesture === "scan";
  const isFull = variant === "full";
  const style = { "width": COUNTER.width, "height": COUNTER.height, "--pay-ms": `${durationMs}ms` } as CSSProperties;
  const customer = isPlaying ? customerArm(`${gesture}:${variant}`) : undefined;
  const cashier = isPlaying && isFull ? cashierArm(app) : undefined;
  // The till rings the basket up line by line, offers the apps, then shows the total sent.
  const itemsShown = !isFull || !isPlaying;
  const askFrames = isPlaying ? showing(timing.ask, timing.processing) : undefined;

  return (
    <Stage style={style} aria-hidden="true">
      <Part style={{ zIndex: 1 }}><Figure who="cashier" /></Part>
      <Part style={{ zIndex: 5 }}><Figure who="customer" /></Part>
      <Surface style={at(0, SURFACE.top, SURFACE.end, 8)} />
      <Front style={at(0, SURFACE.top + 8, SURFACE.end, COUNTER.height - SURFACE.top - 8)} />
      <Stand style={at(TILL.left + TILL.width / 2 - 5, TILL.top + TILL.height, 10, SURFACE.top - TILL.top - TILL.height)} />
      <Tablet style={at(TILL.left, TILL.top, TILL.width, TILL.height)}>
        <TabletScreen>
          {[[0, 34, 4, 10], [1, 26, 10, 18], [2, 30, 16, 26]].map(([index, width, top, from]) => (
            <ItemLine
              key={index}
              lineWidth={width}
              lineTop={top}
              isShown={itemsShown}
              frames={isPlaying && isFull ? showing(from, 100) : undefined}
            />
          ))}
          <Layer isShown={!isFull || !isPlaying} frames={isPlaying && isFull ? between("28-30") : undefined}>
            <Total><span>&#8721;</span><Amount amount={amount} /></Total>
          </Layer>
          <Layer isShown={false} frames={isPlaying && isFull ? between("31-42") : undefined}>
            <Apps>
              {PAY_APPS.map((candidate) => (
                <AppTile key={candidate} isChosen={candidate === app}>
                  <FontAwesomeIcon icon={APP_ICONS[candidate]} />
                </AppTile>
              ))}
            </Apps>
          </Layer>
          <Layer isShown={false} frames={isPlaying && isFull ? between("43-100") : undefined}>
            <Total><span>&#8594;</span><Amount amount={amount} /></Total>
          </Layer>
        </TabletScreen>
      </Tablet>
      <Link style={{ ...at(TILL.left + TILL.width, TILL.top + 18, TERMINAL.left - TILL.left - TILL.width), transform: "rotate(-18deg)" }} />
      {isFull && <Packet isPlaying={isPlaying} style={at(TILL.left + TILL.width - 3, TILL.top + 15)} />}
      <Receipt
        isOut={isApproved}
        frames={isPlaying ? printed(timing.printed.join("-")) : undefined}
        style={at(TERMINAL.left + 9, TERMINAL.top - 28, 24, 34)}
      >
        {[80, 55, 70, 45].map((width) => <ReceiptLine key={width} style={{ width: `${width}%` }} />)}
      </Receipt>
      <TerminalBody style={at(TERMINAL.left, TERMINAL.top, TERMINAL.width, TERMINAL.height)}>
        <TerminalScreen>
          <ScreenLayer isShown={mode === "idle" && isFull} frames={isPlaying && isFull ? showing(0, timing.ask - 2) : undefined}>
            <Dots><Dot /><Dot /><Dot /></Dots>
          </ScreenLayer>
          <ScreenLayer isShown={mode === "idle" && !isFull} frames={askFrames}>
            {isScan ? <Qr /> : (
              <>
                <Amount amount={amount} />
                <PromptIcons><Contactless /><ChipGlyph /></PromptIcons>
              </>
            )}
          </ScreenLayer>
          <ScreenLayer isShown={false} frames={isPlaying ? showing(timing.processing, timing.approved - 2) : undefined}>
            <Dots><Dot /><Dot /><Dot /></Dots>
          </ScreenLayer>
          <ScreenLayer isShown={isApproved} frames={isPlaying ? showing(timing.approved, 100) : undefined}>
            <Tick><FontAwesomeIcon icon={faCheck} /></Tick>
            <Amount amount={amount} />
          </ScreenLayer>
        </TerminalScreen>
      </TerminalBody>
      <Mouth style={at(TERMINAL.left + 6, TERMINAL.top + TERMINAL.height - 12, TERMINAL.width - 12)} />
      <Groove style={at(TERMINAL.left + TERMINAL.width - 4, TERMINAL.top + 16, undefined, TERMINAL.height - 40)} />
      <Part style={{ zIndex: 6 }}><Arm who="cashier" frames={cashier} /></Part>
      <Part style={{ zIndex: 7 }}>
        <Arm who="customer" frames={customer}>
          <Held heldAt={HELD_AT[gesture]} frames={isPlaying ? showing(timing.reachFrom + 1, timing.back - 2) : undefined}>
            {gesture === "wallet" || isScan
              ? <PaymentPhone method={method} isScanning={isScan} scanLine={isScan ? <ScanLine /> : undefined} />
              : <PaymentCard method={method} isUpright={gesture === "swipe"} />}
          </Held>
        </Arm>
      </Part>
    </Stage>
  );
};
