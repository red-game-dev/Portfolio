import tw, { css, styled } from "twin.macro";

interface ActionProps {
  isPrimary: boolean;
}

// The buttons a dialog or the finale ends on: the first filled, the rest outlined. In the zone's accent,
// or in --action and --action-muted where a surrounding element sets them (a project region's own colour).
export const actionStyle = (isPrimary: boolean) => [
  tw`inline-flex flex-row items-center gap-[8px] h-[40px] px-[16px] cursor-pointer text-sm font-semibold no-underline rounded-[2px]
     border-[1px] border-solid`,
  css`
    transition: filter 0.2s ease, border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
      border-color: var(--action, var(--accent));
    }
  `,
  isPrimary
    ? css`
      color: #101010;
      background: var(--action, var(--accent));
      border-color: var(--action, var(--accent));
    `
    : css`
      color: var(--action, var(--accent));
      background: transparent;
      border-color: var(--action-muted, var(--accent-muted));
    `,
];

export const ActionLink = styled.a(({ isPrimary }: ActionProps) => actionStyle(isPrimary));

export const ActionButton = styled.button(({ isPrimary }: ActionProps) => actionStyle(isPrimary));

// One option of a filter row: outlined, filled while selected.
export const FilterChip = styled.button(({ isSelected }: { isSelected: boolean }) => [
  tw`cursor-pointer text-xs leading-none py-[8px] px-[12px] rounded-full border-[1px] border-solid border-[var(--accent-muted)] bg-[#1d1d1d]
     text-[var(--accent)]`,
  css`
    transition: color 0.2s ease, background-color 0.2s ease;
  `,
  isSelected && tw`bg-[var(--accent)] text-[#101010]`,
]);

interface TagProps {
  // Tighter, inside cards.
  isCompact?: boolean;
  // Room between lines, for tags long enough to wrap.
  isWrapping?: boolean;
}

// A row of tags, wrapping onto as many lines as it needs.
export const TagList = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

// A small pill in a list of tags: a stack, a skill, an area.
export const Tag = styled.li(({ isCompact = false, isWrapping = false }: TagProps) => [
  tw`text-xs text-[var(--accent)] bg-[#1d1d1d] rounded-full border-[1px] border-solid border-[var(--accent-muted)]`,
  isCompact ? tw`py-[6px] px-[10px]` : tw`py-[7px] px-[11px]`,
  isWrapping ? tw`leading-snug` : tw`leading-none`,
]);
