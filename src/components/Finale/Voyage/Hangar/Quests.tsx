import { FC } from "react";

import tw from "twin.macro";

import { missionName, rankName } from "@/components/Finale/Voyage/career";
import {
  Actions,
  Block,
  GroupTop,
  Item,
  ItemCount,
  ItemName,
  Items,
  ItemTop,
  Meter,
  Note,
  SmallButton,
  Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { Story, ToldChapters } from "@/components/Finale/Voyage/Hangar/Story";
import { fillNodes, Money } from "@/components/Finale/Voyage/Money";
import { STORY_QUEST, trackedQuest } from "@/components/Finale/Voyage/quests";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { CareerView, MissionSpec } from "@/packages/games/voyage";
import { dayKey, RANKS } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

const SIDE_COLOUR = "#7dffcf";

const Hidden = tw.span`sr-only`;

interface QuestsProps {
  content: FinaleVoyage;
  career: CareerView;
  // The quest pinned to the HUD, and pinning one (null goes back to following the story).
  pinned: string | null;
  onTrack: (id: string | null) => void;
  // Starts today's daily voyage; null while a run is flying.
  onDaily: (() => void) | null;
}

// What a mission pays, in words and coin.
const reward = (content: FinaleVoyage, mission: MissionSpec) => (mission.coin > 0
  ? fillNodes(content.career.reward, { xp: mission.xp, coin: <Money copy={content.economy} amount={mission.coin} isSigned /> })
  : fill(content.career.rewardXp, { xp: mission.xp }));

// The quests under way: the story as the main quest, the missions on the board as side quests, each followable on the
// HUD (the one followed marked), the missions coming next (those waiting for a rank say which), and today's daily
// voyage with its best so far and the way to fly it.
export const ActiveQuests: FC<QuestsProps> = ({ content, career, pinned, onTrack, onDaily }) => {
  const words = content.hangar.quests;
  const followed = trackedQuest(career, pinned)?.id ?? null;
  const today = dayKey(Date.now());
  const daily = career.daily?.day === today ? career.daily : null;

  // The way to follow a quest on the HUD, or, pressed again where it is followed, to stop following it (the story is
  // then followed again). Named by what it shows, then the quest.
  const track = (id: string, name: string) => (
    <SmallButton type="button" isPrimary={followed !== id} aria-pressed={followed === id} onClick={() => onTrack(followed === id ? null : id)}>
      {followed === id ? words.tracked : words.track}
      <Hidden>{` ${name}`}</Hidden>
    </SmallButton>
  );

  return (
    <>
      <Story content={content} story={career.story} action={track(STORY_QUEST, words.main)} />
      <Block aria-labelledby="quests-side">
        <Subheading id="quests-side">{words.side}</Subheading>
        <Items>
          {career.missions.map(({ mission, progress, target }) => (
            <Item key={mission.id}>
              <ItemTop>
                <ItemName colour="#ffffff">{missionName(content, mission.id)}</ItemName>
                <ItemCount>{fill(content.career.progress, { progress, target })}</ItemCount>
              </ItemTop>
              <Meter segments={target} role="meter" aria-label={missionName(content, mission.id)} aria-valuemin={0} aria-valuemax={target} aria-valuenow={progress}>
                <BarFill colour={SIDE_COLOUR} style={{ transform: `scaleX(${target > 0 ? progress / target : 0})` }} />
              </Meter>
              <GroupTop>
                <Note>{reward(content, mission)}</Note>
                {track(mission.id, missionName(content, mission.id))}
              </GroupTop>
            </Item>
          ))}
        </Items>
      </Block>
      {career.upcoming.length > 0 && (
        <Block aria-labelledby="quests-next">
          <Subheading id="quests-next">{words.next}</Subheading>
          <Items>
            {career.upcoming.map(({ mission, isLocked }) => (
              <Item key={mission.id}>
                <ItemTop>
                  <ItemName colour={isLocked ? "#8a93ab" : "#ffffff"}>{missionName(content, mission.id)}</ItemName>
                  <ItemCount>{isLocked ? fill(words.opensAt, { rank: rankName(content, RANKS[mission.minRank]?.id ?? "") }) : words.onBoard}</ItemCount>
                </ItemTop>
                <Note>{reward(content, mission)}</Note>
              </Item>
            ))}
          </Items>
        </Block>
      )}
      <Block aria-labelledby="quests-daily">
        <Subheading id="quests-daily">{content.career.daily.title}</Subheading>
        <Note>{content.career.daily.note}</Note>
        <Note>{daily ? fill(words.daily.today, { best: formatNumber(daily.best), runs: daily.runs }) : words.daily.notYet}</Note>
        {onDaily && (
          <Actions>
            <SmallButton type="button" onClick={onDaily}>{words.daily.fly}</SmallButton>
          </Actions>
        )}
      </Block>
    </>
  );
};

// What is done: every chapter told with the line it decoded to, every mission finished, newest first, with what it
// paid, and the contracts done.
export const CompletedQuests: FC<{ content: FinaleVoyage; career: CareerView }> = ({ content, career }) => {
  const words = content.hangar.quests;
  const isEmpty = career.story.index === 0 && career.doneMissions.length === 0 && career.contracts === 0;

  return (
    <>
      {isEmpty && <Note>{words.none}</Note>}
      {career.story.index > 0 && (
        <Block aria-labelledby="quests-chapters">
          <Subheading id="quests-chapters">{words.chapters}</Subheading>
          <ToldChapters content={content} story={career.story} />
        </Block>
      )}
      {(career.doneMissions.length > 0 || career.contracts > 0) && (
        <Block aria-labelledby="quests-missions">
          <Subheading id="quests-missions">{words.missions}</Subheading>
          <Items>
            {[...career.doneMissions].reverse().map((mission) => (
              <Item key={mission.id}>
                <ItemTop>
                  <ItemName colour={SIDE_COLOUR}>{missionName(content, mission.id)}</ItemName>
                </ItemTop>
                <Note>{reward(content, mission)}</Note>
              </Item>
            ))}
          </Items>
          {career.contracts > 0 && <Note>{fill(words.contracts, { count: career.contracts })}</Note>}
        </Block>
      )}
    </>
  );
};
