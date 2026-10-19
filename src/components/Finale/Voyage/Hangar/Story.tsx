import { FC, ReactNode } from "react";

import tw, { styled } from "twin.macro";

import { chapterTitle, storyStepName } from "@/components/Finale/Voyage/career";
import {
  Frame,
  GroupTop,
  Item,
  ItemCount,
  ItemName,
  Items,
  ItemTop,
  Meter,
  Note,
  ShipName,
  Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { fillNodes, Money } from "@/components/Finale/Voyage/Money";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { StoryChapter, StoryView } from "@/packages/games/voyage";
import { STORY } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// The signal's colour, the gold the ledger and the ranks use.
const SIGNAL = "#ffd76a";

const Fragments = tw.ol`m-0 p-0 list-none flex flex-col gap-[12px]`;

// A chapter told: its title, the line the signal decoded to, edged in its gold, and what its steps paid.
const Fragment = styled.li`
  ${tw`flex flex-col gap-[3px] pl-[10px] text-xs md:text-sm text-[#e6e9f2] leading-relaxed`}

  border-left: 2px solid ${SIGNAL};
`;

const FragmentTitle = tw.span`text-[11px] md:text-xs font-semibold text-[#9aa3bb]`;

// What a chapter's steps paid together.
const paidFor = (chapter: StoryChapter) => chapter.steps.reduce((sum, step) => ({ xp: sum.xp + step.xp, coin: sum.coin + step.coin }), { xp: 0, coin: 0 });

// The main quest, framed: the chapter under way (its place among them, how it opens, and each step with how far
// along it is, what it pays, or that it waits for the universe to be reached), or that the story is all told. The
// way to follow it on the HUD sits beside its title.
export const Story: FC<{ content: FinaleVoyage; story: StoryView; action?: ReactNode }> = ({ content, story, action }) => {
  const copy = content.career.story;
  const career = content.career;

  return (
    <Frame aria-labelledby="story-title">
      <GroupTop>
        <Subheading id="story-title">{content.hangar.quests.main}</Subheading>
        {story.chapter && action}
      </GroupTop>
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
    </Frame>
  );
};

// Every chapter told, oldest first: the line of mine each decoded to, and what it paid.
export const ToldChapters: FC<{ content: FinaleVoyage; story: StoryView }> = ({ content, story }) => (
  <Fragments>
    {STORY.slice(0, story.index).map((chapter) => {
      const paid = paidFor(chapter);

      return (
        <Fragment key={chapter.id}>
          <FragmentTitle>{chapterTitle(content, chapter.id)}</FragmentTitle>
          {content.career.story.chapters[chapter.id]?.line ?? ""}
          <ItemCount>{fillNodes(content.career.reward, { xp: paid.xp, coin: <Money copy={content.economy} amount={paid.coin} isSigned /> })}</ItemCount>
        </Fragment>
      );
    })}
  </Fragments>
);
