import { CSSProperties, FC, ReactNode } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Contactless, PaymentCard, PaymentPhone, PhoneScanLine } from "@/components/Payments/scene/Instrument";
import { RECEIPT_PAPER } from "@/components/Payments/scene/looks";
import { PAY_GESTURES, PayGesture, PaymentMethodId } from "@/config/payments";
import { noAnimationWhenReduced } from "@/styles/mixins";

// A countertop card terminal and a way to pay meeting it: a chip card going into the reader at the foot, a
// card or a phone held to the contactless sign, a card swiped down the stripe reader at the side, or a phone
// scanning the QR code on the screen. Everything moves by transform and opacity, timed as shares of
// `--pay-ms`, so one scene serves the switches and the terminal a reader pays at.

export const SCENE = { width: 280, height: 180 } as const;

// Where the terminal stands in the scene.
const TERMINAL = { left: 176, top: 34, width: 76, height: 104 } as const;

const story = (frames: string) => keyframes`${frames}`;

const insertMove = story(`
  0% { transform: translateY(64px); opacity: 0; }
  12% { opacity: 1; }
  36%, 78% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(64px); opacity: 0; }
`);

const tapMove = story(`
  0% { transform: translate(-150px, 46px) rotate(-14deg); opacity: 0; }
  14% { opacity: 1; }
  40% { transform: translate(0, 0) rotate(-4deg); }
  52% { transform: translate(0, 3px) rotate(-4deg); }
  64% { transform: translate(0, 0) rotate(-4deg); opacity: 1; }
  90% { transform: translate(-150px, 46px) rotate(-14deg); opacity: 0.6; }
  100% { transform: translate(-150px, 46px) rotate(-14deg); opacity: 0; }
`);

const swipeMove = story(`
  0% { transform: translateY(-120px); opacity: 0; }
  14% { transform: translateY(-80px); opacity: 1; }
  44% { transform: translateY(70px); opacity: 1; }
  54%, 100% { transform: translateY(110px); opacity: 0; }
`);

const scanMove = story(`
  0% { transform: translate(-60px, 24px) rotate(-12deg); opacity: 0; }
  20% { transform: translate(0, 0) rotate(-6deg); opacity: 1; }
  80% { transform: translate(0, 0) rotate(-6deg); opacity: 1; }
  100% { transform: translate(-60px, 24px) rotate(-12deg); opacity: 0; }
`);

const scanSweep = story(`
  0%, 24% { transform: translateY(0); opacity: 0; }
  28% { opacity: 1; }
  40% { transform: translateY(13px); }
  52% { transform: translateY(0); opacity: 1; }
  56%, 100% { transform: translateY(0); opacity: 0; }
`);

const wavesPulse = story(`
  0%, 38% { opacity: 0.35; transform: scale(1); }
  44% { opacity: 1; transform: scale(1.25); }
  50% { opacity: 0.55; transform: scale(1); }
  56% { opacity: 1; transform: scale(1.25); }
  64%, 100% { opacity: 0.35; transform: scale(1); }
`);

const waiting = story(`
  0%, 46% { opacity: 1; }
  50%, 100% { opacity: 0; }
`);

const processing = story(`
  0%, 46% { opacity: 0; }
  50%, 56% { opacity: 1; }
  60%, 100% { opacity: 0; }
`);

const approved = story(`
  0%, 56% { opacity: 0; transform: scale(0.6); }
  62% { opacity: 1; transform: scale(1.12); }
  68%, 100% { opacity: 1; transform: scale(1); }
`);

const printed = story(`
  0%, 64% { transform: translateY(40px); }
  86%, 100% { transform: translateY(0); }
`);

const MOVES: Record<PayGesture, ReturnType<typeof keyframes>> = {
  insert: insertMove,
  tap: tapMove,
  wallet: tapMove,
  swipe: swipeMove,
  scan: scanMove,
};

// Where each way to pay rests once it has met the terminal; its moves are offsets from here.
const POSITIONS: Record<PayGesture, { left: number; top: number }> = {
  insert: { left: TERMINAL.left + TERMINAL.width / 2 - 27, top: TERMINAL.top + TERMINAL.height - 12 },
  tap: { left: TERMINAL.left - 5, top: TERMINAL.top + 20 },
  wallet: { left: TERMINAL.left + TERMINAL.width / 2 - 20, top: TERMINAL.top + 6 },
  swipe: { left: TERMINAL.left + TERMINAL.width - 26, top: TERMINAL.top + 13 },
  scan: { left: 100, top: TERMINAL.top + 22 },
};

// Every moving part also carries noAnimationWhenReduced on its own class, so the still rule never depends on a prop.
const playing = (move: ReturnType<typeof keyframes>, ease = "cubic-bezier(0.3, 0.7, 0.3, 1)") => css`
  animation: ${move} var(--pay-ms) ${ease} both;
`;

const Stage = tw.div`relative overflow-hidden`;

const Body = styled.div(() => [
  tw`absolute z-[2] rounded-[12px] border-[1px] border-solid border-[#3c3c3c]`,
  css`
    left: ${TERMINAL.left}px;
    top: ${TERMINAL.top}px;
    width: ${TERMINAL.width}px;
    height: ${TERMINAL.height}px;
    background: linear-gradient(180deg, #2b2b2b, #161616);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.55);
  `,
]);

// The chip reader's mouth at the foot, and the stripe reader's groove down the right side.
const Lip = styled.div(() => [
  tw`absolute z-[3] rounded-b-[6px] bg-[#111] border-[1px] border-solid border-[#3c3c3c] border-t-0`,
  css`
    left: ${TERMINAL.left + 10}px;
    top: ${TERMINAL.top + TERMINAL.height - 2}px;
    width: ${TERMINAL.width - 20}px;
    height: 8px;
  `,
]);

const Groove = styled.div(() => [
  tw`absolute z-[3] rounded-[2px] bg-[#0c0c0c]`,
  css`
    left: ${TERMINAL.left + TERMINAL.width - 5}px;
    top: ${TERMINAL.top + 16}px;
    width: 3px;
    height: ${TERMINAL.height - 40}px;
  `,
]);

const Screen = tw.div`absolute left-[8px] top-[9px] w-[58px] h-[36px] rounded-[3px] overflow-hidden bg-[#0d1712]
border-[1px] border-solid border-[#2a3a31] flex items-center justify-center text-center`;

const ScreenLayer = styled.div(({ move }: { move?: ReturnType<typeof keyframes> }) => [
  tw`absolute inset-0 flex flex-col items-center justify-center gap-[4px]`,
  move && playing(move, "linear"),
  noAnimationWhenReduced,
]);

const Bar = styled.span(({ width }: { width: number }) => [
  tw`block h-[3px] rounded-full`,
  css`
    width: ${width}px;
    background: rgba(var(--accent-rgb), 0.55);
  `,
]);

const Dots = tw.span`flex gap-[4px]`;

const Dot = tw.span`block w-[4px] h-[4px] rounded-full bg-[var(--accent)]`;

const Tick = styled.span(({ isStory }: { isStory: boolean }) => [
  tw`flex items-center justify-center w-[18px] h-[18px] rounded-full text-[10px] text-[#0d0d0d] bg-[var(--accent)]`,
  isStory && playing(approved, "ease-out"),
  noAnimationWhenReduced,
]);

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

const TerminalWaves = styled.div(({ isPulsing }: { isPulsing: boolean }) => [
  tw`absolute left-1/2 top-[50px] ml-[-6px] text-[var(--accent)] opacity-[0.35]`,
  isPulsing && playing(wavesPulse, "linear"),
  noAnimationWhenReduced,
]);

const Keys = tw.div`absolute left-[14px] right-[14px] top-[68px] grid grid-cols-3 gap-[4px]`;

const Key = styled.span(({ tone }: { tone?: "red" | "amber" | "green" }) => [
  tw`block h-[5px] rounded-[1px] bg-[#3d3d3d]`,
  tone === "red" && tw`bg-[#9b3030]`,
  tone === "amber" && tw`bg-[#a07a22]`,
  tone === "green" && tw`bg-[#2f7a4c]`,
]);

const KEY_TONES: Array<"red" | "amber" | "green" | undefined> = [...Array<undefined>(9), "red", "amber", "green"];

const Receipt = styled.div(({ isStory }: { isStory: boolean }) => [
  tw`absolute z-[1] rounded-t-[2px] flex flex-col gap-[4px] pt-[6px] px-[5px]`,
  css`
    left: ${TERMINAL.left + TERMINAL.width / 2 - 17}px;
    top: ${TERMINAL.top - 30}px;
    width: 34px;
    height: 44px;
    background: ${RECEIPT_PAPER};
    transform: translateY(40px);
  `,
  isStory && playing(printed, "ease-out"),
  noAnimationWhenReduced,
]);

const ReceiptLine = styled.span(({ width }: { width: number }) => [
  tw`block h-[2px] bg-[#9a968c]`,
  css`
    width: ${width}%;
  `,
]);

const Hold = styled.div(({ gesture }: { gesture: PayGesture }) => [
  tw`absolute`,
  // A card going into a reader passes behind the terminal; everything else is held in front of it.
  gesture === "insert" || gesture === "swipe" ? tw`z-[1]` : tw`z-[4]`,
  css`
    left: ${POSITIONS[gesture].left}px;
    top: ${POSITIONS[gesture].top}px;
    opacity: 0;
  `,
  playing(MOVES[gesture]),
  noAnimationWhenReduced,
]);

const ScanLine = styled(PhoneScanLine)(() => [playing(scanSweep, "ease-in-out"), noAnimationWhenReduced]);

interface SceneProps {
  method: PaymentMethodId;
  // How the method meets the terminal, where a story asks for another way than its own (the POS taps every card).
  gesture?: PayGesture;
  durationMs: number;
  // Whether a way to pay meets the terminal now; the terminal alone stands still otherwise.
  isPlaying: boolean;
  // What the screen shows, where the scene is the terminal a reader pays at; a switch tells it with the story.
  screen?: ReactNode;
  hasReceipt?: boolean;
}

export const Scene: FC<SceneProps> = ({ method, gesture: asked, durationMs, isPlaying, screen, hasReceipt = false }: SceneProps) => {
  const gesture = asked ?? PAY_GESTURES[method];
  const isStory = screen === undefined;
  const isScan = gesture === "scan";
  const style = { "width": SCENE.width, "height": SCENE.height, "--pay-ms": `${durationMs}ms` } as CSSProperties;

  return (
    <Stage style={style} aria-hidden="true">
      {hasReceipt && (
        <Receipt isStory={isStory && isPlaying}>
          {[80, 55, 70, 40].map((width, index) => <ReceiptLine key={index} width={width} />)}
        </Receipt>
      )}
      <Body>
        <Screen>
          {isStory ? (
            <>
              <ScreenLayer move={isPlaying ? waiting : undefined}>
                {isScan ? <Qr /> : <><Bar width={32} /><Bar width={20} /></>}
              </ScreenLayer>
              <ScreenLayer move={isPlaying ? processing : undefined} style={{ opacity: 0 }}>
                <Dots><Dot /><Dot /><Dot /></Dots>
              </ScreenLayer>
              <ScreenLayer>
                <Tick isStory={isPlaying} style={isPlaying ? undefined : { opacity: 0 }}><FontAwesomeIcon icon={faCheck} /></Tick>
              </ScreenLayer>
            </>
          ) : screen}
        </Screen>
        <TerminalWaves isPulsing={isPlaying && (gesture === "tap" || gesture === "wallet")}>
          <Contactless />
        </TerminalWaves>
        <Keys>
          {KEY_TONES.map((tone, index) => <Key key={index} tone={tone} />)}
        </Keys>
      </Body>
      <Lip />
      <Groove />
      {isPlaying && (
        <Hold gesture={gesture}>
          {gesture === "wallet" || gesture === "scan"
            ? <PaymentPhone method={method} isScanning={isScan} scanLine={isScan ? <ScanLine /> : undefined} />
            : <PaymentCard method={method} isUpright={gesture === "insert" || gesture === "swipe"} />}
        </Hold>
      )}
    </Stage>
  );
};

// What the terminal a reader pays at shows on its screen: the amount, then processing, then approved.
export const ScreenText = tw.span`block px-[2px] text-[8px] leading-[1.15] font-semibold text-[var(--accent)]`;

export const ScreenTick: FC = () => (
  <Tick isStory={false}><FontAwesomeIcon icon={faCheck} /></Tick>
);
