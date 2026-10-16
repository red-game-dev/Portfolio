import { CSSProperties, FC } from "react";

import tw, { css, styled } from "twin.macro";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { CHIP_GOLD, PAYMENT_LOOKS } from "@/components/Payments/scene/looks";
import { DrawnMark } from "@/components/Payments/scene/Marks";
import { PaymentMethodId } from "@/config/payments";

// The card, the phone and the marks the payments scenes draw, all plain elements: nothing here moves on
// its own, the scenes move them.

const faceStyle = (method: PaymentMethodId): CSSProperties => {
  const [from, to] = PAYMENT_LOOKS[method].face;

  return { "--face-from": from, "--face-to": to, "--mark": PAYMENT_LOOKS[method].mark } as CSSProperties;
};

const IconMark = styled.span(() => [
  tw`inline-flex leading-none`,
  css`
    color: var(--mark);
  `,
]);

// A way to pay's mark at a given height in pixels.
export const Mark: FC<{ method: PaymentMethodId; size: number }> = ({ method, size }) => {
  const { icon, drawn } = PAYMENT_LOOKS[method];

  if (drawn) {
    return <DrawnMark id={drawn} size={size} />;
  }

  if (!icon) {
    return null;
  }

  return (
    <IconMark style={{ ...faceStyle(method), fontSize: size }}>
      <FontAwesomeIcon icon={icon} />
    </IconMark>
  );
};

// The contactless sign: three arcs widening to the right.
const Waves = tw.span`relative inline-block w-[12px] h-[12px]`;

const Arc = styled.span(({ index }: { index: number }) => [
  tw`absolute top-1/2 rounded-full border-solid border-transparent`,
  css`
    left: ${-index * 3}px;
    width: ${6 + index * 6}px;
    height: ${6 + index * 6}px;
    margin-top: ${-(3 + index * 3)}px;
    border-width: 1.5px;
    border-right-color: currentColor;
  `,
]);

export const Contactless: FC<{ className?: string }> = ({ className }) => (
  <Waves className={className} aria-hidden="true">
    {[0, 1, 2].map((index) => <Arc key={index} index={index} />)}
  </Waves>
);

export const CARD_SIZE = { long: 86, short: 54 } as const;

const CardBody = styled.span(({ isUpright }: { isUpright: boolean }) => [
  tw`relative block overflow-hidden rounded-[5px]`,
  css`
    width: ${isUpright ? CARD_SIZE.short : CARD_SIZE.long}px;
    height: ${isUpright ? CARD_SIZE.long : CARD_SIZE.short}px;
    background: linear-gradient(135deg, var(--face-from), var(--face-to));
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
  `,
]);

const Chip = styled.span(() => [
  tw`absolute block rounded-[2px] left-[9px] top-[17px] w-[13px] h-[10px]`,
  css`
    background: linear-gradient(135deg, ${CHIP_GOLD[0]}, ${CHIP_GOLD[1]});

    [data-upright] & {
      top: 9px;
    }

    &::after {
      content: "";
      position: absolute;
      left: 3px;
      right: 3px;
      top: 4px;
      height: 1px;
      background: rgba(0, 0, 0, 0.3);
    }
  `,
]);

const CardWaves = styled(Contactless)(() => [
  tw`absolute left-[27px] top-[16px]`,
  css`
    color: var(--mark);
    opacity: 0.8;

    [data-upright] & {
      left: 9px;
      top: 25px;
    }
  `,
]);

const CardMark = tw.span`absolute right-[6px] bottom-[5px] flex`;

// A payment card in its network's colours: the chip, the contactless sign and the mark. Upright, it is held
// chip first, as a card goes into the reader.
export const PaymentCard: FC<{ method: PaymentMethodId; isUpright?: boolean }> = ({ method, isUpright = false }) => (
  <CardBody isUpright={isUpright} style={faceStyle(method)} data-upright={isUpright ? "" : undefined}>
    <Chip />
    <CardWaves />
    <CardMark>
      <Mark method={method} size={method === "mastercard" ? 14 : 13} />
    </CardMark>
  </CardBody>
);

const PhoneBody = tw.span`relative block w-[40px] h-[72px] rounded-[8px] p-[3px] bg-[#0b0b0b] border-[1px] border-solid border-[#3a3a3a]`;

const PhoneScreen = styled.span(() => [
  tw`relative flex flex-col items-center justify-center gap-[6px] w-full h-full rounded-[5px] overflow-hidden`,
  css`
    background: linear-gradient(160deg, var(--face-from), var(--face-to));
  `,
]);

// What a phone's screen shows besides the mark: the wallet's card waiting to be held to the terminal, or
// the camera's frame round a QR code, which the scene sweeps.
const Viewfinder = tw.span`relative block w-[22px] h-[16px] rounded-[2px] border-[1px] border-solid border-[rgba(255,255,255,0.55)]`;

export const PhoneScanLine = tw.span`absolute left-0 right-0 top-0 h-[1px] bg-[#9fffcf]`;

export const PaymentPhone: FC<{ method: PaymentMethodId; isScanning?: boolean; scanLine?: JSX.Element }> = ({ method, isScanning, scanLine }) => (
  <PhoneBody style={faceStyle(method)}>
    <PhoneScreen>
      <Mark method={method} size={method === "applePay" || method === "googlePay" ? 16 : 18} />
      {isScanning && <Viewfinder>{scanLine}</Viewfinder>}
    </PhoneScreen>
  </PhoneBody>
);
