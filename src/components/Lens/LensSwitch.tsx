import { FC, KeyboardEvent, MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { LENS_SPRITES } from "@/components/Lens/config";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { useLensStatusHook } from "@/components/Lens/hooks/useLensStatusHook";
import { PixelSprite } from "@/components/PixelSprite";
import { Lens, LENS_ACCENTS, LENSES } from "@/config/lenses";
import { LensContent } from "@/types/lens";

interface LensSwitchProps {
  content: LensContent;
}

const Wrapper = tw.div`relative`;

const Toggle = styled.button(() => [
  tw`flex flex-row items-center gap-[8px] h-[32px] pl-[6px] pr-[10px] cursor-pointer text-xs font-semibold text-white bg-[rgba(16, 16, 16, 0.85)]
     border-[1px] border-solid border-[#2a2a2a] rounded-[2px]`,
  css`
    transition: border-color 0.2s ease;

    &:hover,
    &:focus-visible,
    &[aria-expanded="true"] {
      border-color: var(--lens-accent);
    }
  `,
]);

const Face = styled.span(() => [
  tw`block w-[20px] h-[20px]`,
  css`
    & > svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
]);

const Label = tw.span`hidden sm:inline text-[#888] font-medium`;

const Chevron = styled.span(({ isOpen }: { isOpen: boolean }) => [
  tw`block w-[6px] h-[6px] ml-[2px] border-solid border-[#888] border-t-0 border-l-0 border-r-[1.5px] border-b-[1.5px]`,
  css`
    transform: translateY(${isOpen ? "1px" : "-2px"}) rotate(${isOpen ? 225 : 45}deg);
    transition: transform 0.2s ease;
  `,
]);

const Options = tw.ul`absolute right-0 lg:right-auto lg:left-0 top-[38px] z-[20] list-none m-0 p-[6px] w-[220px] flex flex-col gap-[4px]
bg-[#0d0d0d] border-[1px] border-solid border-[#2a2a2a] rounded-[2px] shadow-[0 10px 30px rgba(0, 0, 0, 0.6)]`;

const Option = styled.button(({ isCurrent }: { isCurrent: boolean }) => [
  tw`flex flex-row items-center gap-[10px] w-full p-[8px] cursor-pointer text-left text-sm text-white bg-transparent
     border-[1px] border-solid border-transparent rounded-[2px]`,
  isCurrent && tw`border-[var(--lens-accent)]`,
  css`
    &:hover,
    &:focus-visible {
      background: rgba(var(--lens-rgb), 0.08);
      outline: none;
    }
  `,
]);

const OptionText = tw.span`flex flex-col`;

const OptionHint = tw.span`text-xs text-[#888]`;

const accentStyle = (lens: Lens) => ({ "--lens-accent": LENS_ACCENTS[lens].color, "--lens-rgb": LENS_ACCENTS[lens].rgb } as React.CSSProperties);

// The header control for changing who the page is written for, at any point.
export const LensSwitch: FC<LensSwitchProps> = ({ content }: LensSwitchProps) => {
  const { lens } = useLensStateHook();
  const { chooseLens } = useLensStatusHook();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const taglines = Object.fromEntries(content.cards.map((card) => [card.lens, card.tagline])) as Record<Lens, string>;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", close);

    return () => document.removeEventListener("pointerdown", close);
  }, [isOpen]);

  // The header toggles the mobile menu on any click, so the switch keeps its clicks to itself.
  const toggle = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    setIsOpen((value) => !value);
  }, []);

  // A new view starts from the top with its own entrance, so the reader sees the immersion they picked.
  const choose = useCallback((event: MouseEvent, next: Lens) => {
    event.stopPropagation();
    setIsOpen(false);

    if (next === lens) {
      toggleRef.current?.focus();

      return;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    chooseLens(next);
  }, [chooseLens, lens]);

  const closeOnEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      toggleRef.current?.focus();
    }
  }, []);

  return (
    <Wrapper ref={wrapperRef} onKeyDown={closeOnEscape} style={accentStyle(lens)}>
      <Toggle
        ref={toggleRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${content.switchLabel}: ${content.names[lens]}`}
        onClick={toggle}
      >
        <Face aria-hidden="true"><PixelSprite {...LENS_SPRITES[lens]} /></Face>
        <Label>{content.switchLabel}</Label>
        <span>{content.names[lens]}</span>
        <Chevron isOpen={isOpen} aria-hidden="true" />
      </Toggle>
      {isOpen && (
        <Options>
          {LENSES.map((option) => (
            <li key={option} style={accentStyle(option)}>
              <Option type="button" isCurrent={option === lens} aria-pressed={option === lens} onClick={(event) => choose(event, option)}>
                <Face aria-hidden="true"><PixelSprite {...LENS_SPRITES[option]} /></Face>
                <OptionText>
                  <span>{content.names[option]}</span>
                  <OptionHint>{taglines[option]}</OptionHint>
                </OptionText>
              </Option>
            </li>
          ))}
        </Options>
      )}
    </Wrapper>
  );
};
