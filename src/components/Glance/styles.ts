import tw, { css, styled } from "twin.macro";

export const Sheet = tw.div`flex flex-col gap-[26px] p-[22px] md:p-[32px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

export const Header = tw.div`flex flex-col md:flex-row md:items-end justify-between gap-[16px]`;

export const Heading = tw.div`flex flex-col gap-[8px] max-w-[60ch]`;

export const Title = tw.h2`m-0 text-2xl font-semibold text-white`;

export const Description = tw.p`m-0 text-sm md:text-base text-[#aaa]`;

export const Actions = tw.div`flex flex-row flex-wrap gap-[10px]`;

export const Action = styled.a(({ isPrimary }: { isPrimary: boolean }) => [
  tw`inline-flex flex-row items-center gap-[8px] h-[38px] px-[14px] text-sm font-semibold no-underline rounded-[2px] border-[1px] border-solid`,
  isPrimary ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[var(--accent)] bg-transparent border-[var(--accent-muted)]`,
  css`
    transition: filter 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
    }
  `,
]);

// A label beside its values on wide screens, above them on narrow ones.
export const Facts = tw.dl`grid gap-x-[24px] gap-y-[18px] m-0 md:grid-cols-[180px 1fr]`;

export const Term = tw.dt`text-xs font-semibold text-[#8a8a8a] md:pt-[6px]`;

export const Value = tw.dd`m-0 flex flex-col gap-[10px] min-w-0`;

export const Chips = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

export const Chip = tw.li`inline-flex flex-row items-baseline gap-[6px] text-sm leading-none text-white bg-[#161616] rounded-[2px] py-[7px] px-[10px]
border-[1px] border-solid border-[#262626]`;

export const Years = tw.span`text-xs text-[var(--accent)]`;

export const GroupLabel = tw.span`block text-xs text-[#8a8a8a] mb-[6px]`;

export const Roles = tw.ol`list-none m-0 p-0 flex flex-col`;

export const RoleRow = styled.li(() => [
  tw`grid gap-x-[16px] gap-y-[2px] py-[9px] md:grid-cols-[1fr auto]`,
  css`
    border-top: 1px solid #1e1e1e;

    &:first-child {
      border-top: 0;
      padding-top: 2px;
    }
  `,
]);

export const RoleName = tw.span`text-sm text-white`;

export const RolePlace = tw.span`text-sm text-[#9a9a9a]`;

export const RoleRange = tw.span`text-xs text-[#8a8a8a] md:text-right md:row-span-2 md:self-center`;

export const Stats = tw.ul`list-none m-0 p-0 grid gap-[12px] sm:grid-cols-3`;

export const Stat = tw.li`flex flex-col gap-[4px] p-[16px] bg-[#111] border-[1px] border-solid border-[#222]`;

export const StatValue = tw.span`text-3xl font-semibold text-[var(--accent)] leading-none`;

export const StatLabel = tw.span`text-sm text-[#bbb]`;

export const Columns = tw.div`grid gap-[22px] md:grid-cols-2`;

export const Block = tw.section`flex flex-col gap-[10px]`;

export const BlockTitle = tw.h3`m-0 text-sm font-semibold text-white`;

export const Rows = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px]`;

export const Row = styled.li(() => [
  tw`relative pl-[16px] text-sm text-[#bbb]`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 6px;
      height: 6px;
      background: var(--accent);
    }
  `,
]);

export const Strong = tw.strong`text-white font-semibold`;

export const BlockNote = tw.p`m-0 text-xs text-[#9a9a9a]`;

export const Road = tw.ol`relative list-none m-0 p-0 grid gap-[18px] md:grid-cols-4 md:gap-[14px]`;

export const Milestone = styled.li(() => [
  tw`relative flex flex-col gap-[6px] pl-[22px] md:pl-0 md:pt-[24px]`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 4px;
      width: 10px;
      height: 10px;
      transform: rotate(45deg);
      background: var(--accent);
    }

    @media (min-width: 768px) {
      &::before {
        top: 0;
      }

      &::after {
        content: "";
        position: absolute;
        left: 18px;
        right: 0;
        top: 4px;
        height: 1px;
        background: var(--accent-muted);
      }

      &:last-child::after {
        display: none;
      }
    }
  `,
]);

export const StageName = tw.span`text-base font-semibold text-white`;

export const StageExample = tw.span`text-sm text-[#aaa]`;
