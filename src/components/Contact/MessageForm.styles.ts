import tw, { css, styled } from "twin.macro";

import { focusRing, media } from "@/styles/mixins";

export const Form = tw.form`flex flex-col gap-[14px] m-0`;

export const Heading = tw.h4`m-0 text-base font-semibold text-white`;

export const Intro = tw.p`m-0 text-sm text-[#a3aca7]`;

export const Field = tw.div`flex flex-col gap-[6px]`;

export const Label = tw.label`text-sm text-[#d6dcd9]`;

// Whether the field must be filled, in words beside its label rather than a mark alone.
export const Marker = tw.span`ml-[6px] text-xs text-[#8a948f]`;

const control = [
  tw`w-full box-border px-[12px] py-[10px] text-sm text-white bg-[#101411] rounded-[2px] border-[1px] border-solid border-[#2c3530]`,
  css`
    font: inherit;
    min-height: 44px;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: #44514a;
    }

    &[aria-invalid="true"] {
      border-color: #ff8a8a;
    }

    ${media.reducedMotion} {
      transition: none;
    }
  `,
  focusRing("var(--accent)", 2),
];

export const Input = styled.input(() => control);

export const TextArea = styled.textarea(() => [...control, css`
  min-height: 132px;
  resize: vertical;
`]);

export const Problem = tw.p`m-0 text-sm text-[#ff9e9e]`;

export const Row = styled.div(() => [
  tw`flex flex-col gap-[10px] items-start`,
  css`
    ${media.md} {
      flex-direction: row;
      align-items: center;
    }
  `,
]);

export const Note = tw.p`m-0 text-xs text-[#8a948f]`;

// What became of the message, said as it changes.
export const Status = tw.p`m-0 text-sm text-[#d6dcd9]`;

// A field people never see, for a bot to fill in: off the screen rather than hidden, which a bot would notice.
export const Trap = styled.div(() => [
  css`
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `,
]);
