import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { chapterTitle, storyStepName } from "@/components/Finale/Voyage/career";
import { Block, Item, ItemCount, ItemName, Items, ItemTop, Meter, Note, ShipName, Subheading } from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { fillNodes, Money } from "@/components/Finale/Voyage/Money";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { StoryView } from "@/packages/games/voyage";
import { STORY } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// The signal's colour, the gold the ledger and the ranks use.
const SIGNAL = "#ffd76a";

const Decoded = tw.section`flex flex-col gap-[8px]`;

const Fragments = tw.ol`m-0 p-0 list-none flex flex-col gap-[8px]`;

// A line the signal decoded to, edged in its gold.
const Fragment = styled.li(() => [
  tw`flex flex-col gap-[2px] pl-[10px] text-xs md:text-sm text-[#e6e9f2] leading-relaxed`,
  css`
    border-left: 2px solid ${SIGNAL};
  `,
]);

const FragmentTitle = tw.span`text-[11px] md:text-xs font-semibold text-[#9aa3bb]`;

// The story in the Pilot tab: the chapter under way (its place among them, how it opens, and each step with how far
// along it is, what it pays, or that it waits for the universe to be reached), then every line decoded so far. Once
// it is all told, only the lines.
export const Story: FC<{ content: FinaleVoyage; story: StoryView }> = ({ content, story }) => {
  const copy = content.career.story;
  const career = content.career;
  const told = STORY.slice(0, story.index);

  return (
    <Block aria-labelledby="story-title">
      <Subheading id="story-title">{copy.title}</Subheading>
      {story.chapter ? (
        <>
          <div>
            <ShipName>{chapterTitle(content, story.chapter.id)}</ShipName>
            <Note>{fill(copy.chapterOf, { index: story.index + 1, total: story.total })}</Note>
          </div>
          <Note>{copy.chapters[story.chapter.id]?.intro ?? ""}</Note>
          <Items>
            {story.steps.map(({ step, progress, target, isOpen }) => {
              const name = storyStepName(content, step.id);
              const isDone = progress >= target;

              return (
                <Item key={step.id}>
                  <ItemTop>
                    <ItemName colour={isDone ? SIGNAL : isOpen ? "#ffffff" : "#8a93ab"}>{name}</ItemName>
                    <ItemCount>{fill(career.progress, { progress, target })}</ItemCount>
                  </ItemTop>
                  <Meter segments={target} role="meter" aria-label={name} aria-valuemin={0} aria-valuemax={target} aria-valuenow={progress}>
                    <BarFill colour={SIGNAL} style={{ transform: `scaleX(${target > 0 ? progress / target : 0})` }} />
                  </Meter>
                  <Note>{isOpen ? fillNodes(career.reward, { xp: step.xp, coin: <Money copy={content.economy} amount={step.coin} isSigned /> }) : copy.waiting}</Note>
                </Item>
              );
            })}
          </Items>
        </>
      ) : (
        <Note>{copy.told}</Note>
      )}
      {told.length > 0 && (
        <Decoded aria-labelledby="story-decoded">
          <Subheading id="story-decoded">{copy.decoded}</Subheading>
          <Fragments>
            {told.map((chapter) => (
              <Fragment key={chapter.id}>
                <FragmentTitle>{chapterTitle(content, chapter.id)}</FragmentTitle>
                {copy.chapters[chapter.id]?.line ?? ""}
              </Fragment>
            ))}
          </Fragments>
        </Decoded>
      )}
    </Block>
  );
};
