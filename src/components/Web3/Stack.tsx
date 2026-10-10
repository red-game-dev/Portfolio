import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { media } from "@/styles/mixins";
import { StackGroup } from "@/types/domains";

interface StackProps {
  title: string;
  groups: StackGroup[];
}

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

const Wrapper = tw.div`mb-[22px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Title = tw.h3`m-0 mb-[16px] text-base font-semibold text-white`;

const Groups = tw.div`grid gap-[18px] md:grid-cols-2 mt-[18px]`;

const Group = tw.div`flex flex-col gap-[10px]`;

const GroupLabel = tw.h4`m-0 text-xs font-semibold text-[#999]`;

// Token standards read as minted tokens: a coin face, the standard, and what it is for.
const Tokens = tw.ul`list-none m-0 p-0 grid gap-[8px] sm:grid-cols-3`;

const Token = styled.li(() => [
  tw`flex flex-row items-center gap-[10px] p-[10px] bg-[#141018] border-[1px] border-solid border-[var(--accent-muted)] rounded-[4px]`,
  css`
    transition: border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }

    ${media.reducedMotion} {
      transition: none;

      &:hover {
        transform: none;
      }
    }
  `,
]);

const Coin = styled.span(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[30px] h-[34px] text-[10px] font-bold text-[#101010] bg-[var(--accent)]`,
  css`
    clip-path: ${HEX};
  `,
]);

const TokenText = tw.span`flex flex-col min-w-0 text-sm font-semibold text-white [& > small]:text-xs [& > small]:font-normal [& > small]:text-[#aaa]`;

const Chips = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[8px]`;

const Chip = styled.li(() => [
  tw`inline-flex flex-row items-center gap-[7px] text-xs leading-none text-[#eee] bg-[#1a1a1a] rounded-full py-[7px] pl-[8px] pr-[11px]
     border-[1px] border-solid border-[#2a2a2a]`,
  css`
    &::before {
      content: "";
      width: 8px;
      height: 9px;
      background: var(--accent);
      clip-path: ${HEX};
    }
  `,
]);

// The technologies behind the blocks: token standards first, then contracts, chains and the wallet and
// data layer.
export const Stack: FC<StackProps> = ({ title, groups }: StackProps) => {
  const [standards, ...rest] = groups;

  return (
    <Wrapper>
      <Title>{title}</Title>
      {standards && (
        <Group>
          <GroupLabel>{standards.label}</GroupLabel>
          <Tokens>
            {standards.items.map((item) => (
              <Token key={item.name}>
                <Coin aria-hidden="true">{item.name.replace(/\D/g, "")}</Coin>
                <TokenText>
                  {item.name}
                  {item.detail && <small>{item.detail}</small>}
                </TokenText>
              </Token>
            ))}
          </Tokens>
        </Group>
      )}
      <Groups>
        {rest.map((group) => (
          <Group key={group.label}>
            <GroupLabel>{group.label}</GroupLabel>
            <Chips>
              {group.items.map((item) => (
                <Chip key={item.name}>{item.name}</Chip>
              ))}
            </Chips>
          </Group>
        ))}
      </Groups>
    </Wrapper>
  );
};
