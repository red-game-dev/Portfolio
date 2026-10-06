import { FC } from "react";

import tw from "twin.macro";

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

// Assistive tech and crawlers get the real text straight away; the bits are decoration.
export const DecodedText: FC<DecodedTextProps> = ({ text, isActive, delay = 0, duration, variant = "heading" }: DecodedTextProps) => {
  const { settings } = useLensStateHook();
  const isInstant = settings.decode === "off" || (settings.decode === "headings" && variant === "body");
  const visibleText = useDecodedText(text, isActive, delay, duration, isInstant);

  return (
    <>
      <ReadableText>{text}</ReadableText>
      <span aria-hidden="true">{visibleText}</span>
    </>
  );
};
