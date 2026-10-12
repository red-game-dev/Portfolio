import { FC } from "react";

import { missionName, rankName } from "@/components/Finale/Voyage/career";
import {
  Block,
  Frame,
  Item,
  ItemCount,
  ItemName,
  Items,
  ItemTop,
  Meter,
  Note,
  Standing,
  Standings,
  StandingValue,
  Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { Story } from "@/components/Finale/Voyage/Hangar/Story";
import { fillNodes, Money } from "@/components/Finale/Voyage/Money";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { CareerView, ProgressView } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

const RANK_COLOUR = "#ffd76a";
const LEVEL_COLOUR = "#7dffcf";

interface PilotProps {
  content: FinaleVoyage;
  career: CareerView | null;
  progress: ProgressView | null;
}

// The pilot at a glance: their two standings side by side, each saying where it comes from (the rank from missions
// and the story, the level from everything done in flight), then the story and the missions on the board.
export const Pilot: FC<PilotProps> = ({ content, career, progress }) => {
  const copy = content.career;
  const words = content.hangar.pilot;
  const rankShare = career ? (career.nextRank ? (career.xp - career.rankFloor) / Math.max(1, career.nextRank.xp - career.rankFloor) : 1) : 0;

  return (
    <>
      {(career || progress) && (
        <Frame aria-label={copy.tabs.pilot}>
          <Standings>
            {career && (
              <Standing>
                <Note>{words.rank}</Note>
                <StandingValue>{rankName(content, career.rankId)}</StandingValue>
                <Meter role="meter" aria-label={words.rank} aria-valuemin={career.rankFloor} aria-valuemax={career.nextRank?.xp ?? career.xp} aria-valuenow={career.xp}>
                  <BarFill colour={RANK_COLOUR} style={{ transform: `scaleX(${rankShare})` }} />
                </Meter>
                <Note>
                  {career.nextRank
                    ? fill(copy.nextRank, { xp: formatNumber(career.nextRank.xp - career.xp), rank: rankName(content, career.nextRank.id) })
                    : copy.topRank}
                </Note>
                <ItemCount>{words.rankNote}</ItemCount>
              </Standing>
            )}
            {progress && (
              <Standing>
                <Note>{words.level}</Note>
                <StandingValue>{fill(content.progress.level, { level: progress.level })}</StandingValue>
                <Meter role="meter" aria-label={words.level} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.standing.share * 100)}>
                  <BarFill colour={LEVEL_COLOUR} style={{ transform: `scaleX(${progress.standing.isCapped ? 1 : progress.standing.share})` }} />
                </Meter>
                <Note>
                  {progress.standing.isCapped ? content.progress.capped : fill(content.progress.exp, {
                    into: formatNumber(Math.round(progress.standing.into)),
                    next: formatNumber(progress.standing.toNext),
                  })}
                </Note>
                <ItemCount>{words.levelNote}</ItemCount>
              </Standing>
            )}
          </Standings>
        </Frame>
      )}
      {career && <Story content={content} story={career.story} />}
      {career && (
        <Block aria-labelledby="pilot-missions">
          <Subheading id="pilot-missions">{copy.missionsTitle}</Subheading>
          <Items>
            {career.missions.map(({ mission, progress: done, target }) => (
              <Item key={mission.id}>
                <ItemTop>
                  <ItemName colour="#ffffff">{missionName(content, mission.id)}</ItemName>
                  <ItemCount>{fill(copy.progress, { progress: done, target })}</ItemCount>
                </ItemTop>
                <Meter segments={target} role="meter" aria-label={missionName(content, mission.id)} aria-valuemin={0} aria-valuemax={target} aria-valuenow={done}>
                  <BarFill colour={LEVEL_COLOUR} style={{ transform: `scaleX(${target > 0 ? done / target : 0})` }} />
                </Meter>
                <Note>
                  {mission.coin > 0
                    ? fillNodes(copy.reward, { xp: mission.xp, coin: <Money copy={content.economy} amount={mission.coin} isSigned /> })
                    : fill(copy.rewardXp, { xp: mission.xp })}
                </Note>
              </Item>
            ))}
          </Items>
          <Note>{fill(copy.done, { count: career.done })}</Note>
        </Block>
      )}
    </>
  );
};
