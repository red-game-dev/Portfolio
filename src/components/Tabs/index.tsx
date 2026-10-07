import tw, { css, styled } from "twin.macro";

// The look shared by every row of tabs on the page. Pair with useTabs for the behaviour.

interface TabListProps {
  // "row" scrolls sideways at every width; "column" scrolls sideways on a phone and stacks beside its panel
  // on a desktop.
  layout?: "row" | "column";
}

export const TabList = styled.div(({ layout = "row" }: TabListProps) => [
  tw`flex flex-row gap-[6px] overflow-x-auto pb-[4px]`,
  layout === "column" && tw`lg:flex-col lg:overflow-visible lg:pb-0 lg:w-[240px] flex-shrink-0`,
  css`
    scrollbar-width: thin;
  `,
  // Stacked in a narrow column, long names wrap instead of widening it.
  layout === "column" && css`
    @media (min-width: 1024px) {
      & > [role="tab"] {
        white-space: normal;
      }
    }
  `,
]);

export const Tab = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`relative flex flex-row items-center justify-between gap-[10px] flex-shrink-0 min-h-[36px] px-[14px] py-[7px] cursor-pointer text-left
     text-xs md:text-sm font-semibold whitespace-nowrap rounded-[2px] border-[1px] border-solid`,
  isOn ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[#ccc] bg-[#0d0d0d] border-[#262626]`,
  css`
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--accent);
      color: ${isOn ? "#101010" : "#fff"};
    }
  `,
]);

// How many items a tab holds, beside its name.
export const TabCount = styled.span(({ isOn }: { isOn: boolean }) => [tw`text-[11px] font-medium`, isOn ? tw`text-[#101010]` : tw`text-[#777]`]);

// Closed panels keep `hidden`, which a display set by a class would otherwise override.
export const hiddenPanel = css`
  &[hidden] {
    display: none;
  }
`;
