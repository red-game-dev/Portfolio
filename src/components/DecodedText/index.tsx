import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { useDecodedText } from "@/components/DecodedText/hooks/useDecodedText";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";

interface DecodedTextProps {
  text: string;
  isActive: boolean;
  delay?: number;
  duration?: number;
  // Headings decode in the guided view too; body text only in the full one.
  variant?: "heading" | "body";
}

const ReadableText = tw.span`sr-only`;

// The bits are drawn from an attribute rather than written as text, so the page's text, which search engines and
// AI crawlers read from the server HTML, holds only the real words. Anything that decodes from binary uses it.
export const Bits = styled.span(() => [
  css`
    &::before {
      content: attr(data-bits);
    }
  `,
]);

// Assistive tech and crawlers get the real text straight away; the bits are decoration. Once decoded, the
// visible copy is plain text again, so it can be selected.
export const DecodedText: FC<DecodedTextProps> = ({ text, isActive, delay = 0, duration, variant = "heading" }: DecodedTextProps) => {
  const { settings } = useLensStateHook();
  const isInstant = settings.decode === "off" || (settings.decode === "headings" && variant === "body");
  const visibleText = useDecodedText(text, isActive, delay, duration, isInstant);

  return (
    <>
      <ReadableText>{text}</ReadableText>
      {visibleText === text ? <span aria-hidden="true">{text}</span> : <Bits aria-hidden="true" data-bits={visibleText} />}
    </>
  );
};
