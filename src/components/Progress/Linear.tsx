import tw, { css, styled } from "twin.macro";

interface ItemPercentageProps {
  score?: number;
  canAnimate?: boolean;
}

interface ItemInnerPercenteProps {
  isVisible?: boolean;
}

const Item = tw.li`relative p-[35px 0 0 0]`;

const ItemTitle = tw.div`text-base font-medium text-[#eee] m-[0 0 10px 0]`;

const ItemProgressContainer = tw.div`relative w-full block h-[1px] bg-white/10`;

const ItemPercentage = styled.div(({ score = 0, canAnimate }: ItemPercentageProps) => [
  tw`absolute left-0 top-0 h-[1px] w-0 bg-[#4bffa5] delay-500 duration-1000 ease-linear transition-all`,
  !canAnimate && tw`w-0 transition-none duration-[0] delay-[0]`,
  canAnimate && css`width: ${score}%`,
]);

const ItemInnerPercente = styled.div(({ isVisible = false }: ItemInnerPercenteProps) => [
  tw`absolute top-[-34px] opacity-0 right-0 font-semibold text-base delay-1000 duration-1000 ease-linear transition-all`,
  !isVisible && tw`w-0 transition-none duration-[0] delay-[0]`,
  isVisible && tw`opacity-100`
]);

export const LinearProgress = ({
  title,
  score,
  canAnimate,
}: any) => (
    <Item>
      <ItemTitle>{ title }</ItemTitle>
      <ItemProgressContainer>
        <ItemPercentage score={score} canAnimate={canAnimate}>
          <ItemInnerPercente isVisible={canAnimate}>{score}%</ItemInnerPercente>
        </ItemPercentage>
      </ItemProgressContainer>
    </Item>
  );
