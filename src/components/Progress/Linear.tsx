import tw, { css, styled } from "twin.macro";

interface ItemPercentageProps {
  score?: number;
  canAnimate?: boolean;
}
interface ItemInnerPercenteProps {
  isVisible?: boolean;
}

interface LinearProgressProps {
  title: string;
  score: number;
  canAnimate?: boolean;
}

const Item = tw.li`relative pt-[35px]`;

// Title and score share a row. The score used to be absolutely positioned above
// the right end of the bar, which collided with the title as soon as the title
// wrapped to a second line, and it tracked the fill, so no amount of padding
// on the title could reserve space for it.
const ItemHeader = tw.div`flex flex-row items-baseline justify-between gap-4 mb-[10px]`;

const ItemTitle = tw.div`text-base font-medium text-[#eee] min-w-0 break-words`;

const ItemProgressContainer = tw.div`relative w-full block h-[1px] bg-white/10`;

const ItemPercentage = styled.div(({ score = 0, canAnimate }: ItemPercentageProps) => [
  tw`absolute left-0 top-0 h-[1px] w-0 bg-[#4bffa5] delay-500 duration-1000 ease-linear transition-all`,
  !canAnimate && tw`w-0 transition-none duration-[0] delay-[0]`,
  canAnimate && css`width: ${score}%`,
]);

const ItemInnerPercente = styled.div(({ isVisible = false }: ItemInnerPercenteProps) => [
  tw`flex-shrink-0 opacity-0 font-semibold text-base delay-1000 duration-1000 ease-linear transition-opacity`,
  !isVisible && tw`transition-none duration-[0] delay-[0]`,
  isVisible && tw`opacity-100`
]);

export const LinearProgress = ({
  title,
  score,
  canAnimate,
}: LinearProgressProps) => (
    <Item>
      <ItemHeader>
        <ItemTitle>{ title }</ItemTitle>
        <ItemInnerPercente isVisible={canAnimate}>{score}%</ItemInnerPercente>
      </ItemHeader>
      <ItemProgressContainer>
        <ItemPercentage score={score} canAnimate={canAnimate} />
      </ItemProgressContainer>
    </Item>
  );
