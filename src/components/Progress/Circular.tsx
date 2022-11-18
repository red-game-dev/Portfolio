import { FC } from "react";

import tw, { styled } from "twin.macro";

interface PercentageProps {
  score: number;
  canAnimate?: boolean;
  size?: number;
}

interface CircularProgressProps {
  score: number;
  canAnimate?: boolean;
  size?: number;
  title?: string;
}

interface ItemInnerPercenteProps {
  canAnimate?: boolean;
}

const Item = tw.li`w-1/3 lg:w-1/4 inline-block align-top mt-[35px]`;

const ItemTitle = tw.div`m-auto w-full py-4 text-center text-xs md:text-sm min-h-[65px] lg:min-h-[auto] lg:text-base font-bold`;

const ItemProgressContainer = tw.div`
block h-2 relative w-full bg-white/10 my-0 mx-auto
text-8xl w-[90px] h-[90px] bg-[#242424] rounded-[90px]`;

const ItemInnerPercente = styled.span(({ canAnimate }: ItemInnerPercenteProps) => [
  tw`absolute w-full h-full left-0 top-0 text-base leading-[90px] text-center 
     whitespace-nowrap font-medium z-[2] delay-1000 duration-1000 ease-linear transition-all`,
  !canAnimate && tw`transition-none duration-[0] delay-[0] opacity-0`,
]);

const ItemPercentageFill = tw.div`
  after:(content-[''] border-[1px] border-[#85fbad] border-double absolute top-[0.09em] left-[0.09em] block h-[0.82em] 
  w-[0.82em] bg-[#1d1d1d] rounded-full)`;

const ItemPercentageBar = tw.svg`w-32 h-32 transform translate-x-1 translate-y-1`;

const Percentage: FC<PercentageProps> = ({
  score,
  canAnimate,
  size = 40
}: PercentageProps) => (
  <div>
    <ItemPercentageFill />
    <ItemPercentageBar x-cloak aria-hidden="true">
      <circle
        className="text-[#404040]"
        stroke-width="5"
        stroke="currentColor"
        fill="transparent"
        r={size}
        cx={size}
        cy={size}
        />
      <circle
        stroke-dasharray={canAnimate ? (size * 2 * Math.PI) : 250}
        stroke-dashoffset={canAnimate ? (size * 2 * Math.PI) - score / 100 * (size * 2 * Math.PI) : 250}
        className={
          `text-[#4bffa5] delay-1000 duration-1000 ease-linear opacity-0 ${
            canAnimate ?
            "transition-[stroke-dashoffset] opacity-100" :
            "transition-none duration-[0] delay-[0]"
          }`
        }
        stroke-width="5"
        stroke-linecap="round"
        stroke="currentColor"
        fill="transparent"
        r={size}
        cx={size}
        cy={size}
      />
  </ItemPercentageBar>
</div>
);

export const CircularProgress: FC<CircularProgressProps> = ({
  title,
  score,
  canAnimate,
  size,
}: CircularProgressProps) => (
    <Item>
      <ItemTitle>{ title }</ItemTitle>
      <ItemProgressContainer>
        {" "}
        <ItemInnerPercente canAnimate={canAnimate}>{ score }%</ItemInnerPercente>
        <Percentage score={score} canAnimate={canAnimate} size={size} />
      </ItemProgressContainer>
    </Item>
  );
