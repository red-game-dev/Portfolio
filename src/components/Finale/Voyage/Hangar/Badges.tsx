import { FC, useId, useState } from "react";

import { faLock, faMeteor, faTrophy, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Block,
  Frame,
  GroupTop,
  ItemCount,
  ItemName,
  ItemTop,
  Meter,
  Note,
  SmallButton,
  Subheading,
  Tile,
  TileGrid,
  TileName,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { skyBadge } from "@/components/Finale/Voyage/sky";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { ProgressView } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

const WON = "#ffd76a";

// The pilot's badges: the stars won, then every achievement as a tile, those unlocked first, with how near the rest
// are; a tile tapped opens what it asks underneath. The sky events flown under follow.
export const Badges: FC<{ content: FinaleVoyage; progress: ProgressView }> = ({ content, progress }) => {
  const copy = content.progress;
  const words = content.hangar.details;
  const detailId = useId();
  const [chosen, setChosen] = useState<string | null>(null);
  const won = progress.achievements.filter((entry) => entry.at !== null).length;
  const total = progress.achievements.length;
  const sorted = [...progress.achievements].sort((first, second) => Number(second.at !== null) - Number(first.at !== null));
  const open = sorted.find(({ spec }) => spec.id === chosen);
  const nameOf = (id: string) => copy.achievements[id]?.name ?? id;

  return (
    <>
      <Block aria-labelledby="badges-title">
        <GroupTop>
          <Subheading id="badges-title">{copy.achievementsTitle}</Subheading>
          <ItemCount>{fill(copy.achievementsFound, { found: won, total })}</ItemCount>
        </GroupTop>
        <Meter role="meter" aria-label={copy.achievementsTitle} aria-valuemin={0} aria-valuemax={total} aria-valuenow={won}>
          <BarFill colour={WON} style={{ transform: `scaleX(${total > 0 ? won / total : 0})` }} />
        </Meter>
        <Note>{fill(copy.stars, { count: progress.starTotal })}</Note>
        <TileGrid>
          {sorted.map(({ spec, at, value }) => {
            const isWon = at !== null;
            const isOpen = chosen === spec.id;

            return (
              <li key={spec.id}>
                <Tile
                  type="button"
                  isOn={isOpen}
                  isDim={!isWon}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? detailId : undefined}
                  onClick={() => setChosen(isOpen ? null : spec.id)}
                >
                  <FontAwesomeIcon icon={isWon ? faTrophy : faLock} style={{ color: isWon ? WON : undefined }} aria-hidden="true" />
                  <TileName>{nameOf(spec.id)}</TileName>
                  {!isWon && value > 0 && (
                    <Meter segments={Math.min(spec.target, 10)} aria-hidden="true" style={{ width: "100%", height: "4px" }}>
                      <BarFill colour="#c4d2ff" style={{ transform: `scaleX(${Math.min(1, value / spec.target)})` }} />
                    </Meter>
                  )}
                </Tile>
              </li>
            );
          })}
        </TileGrid>
        {open && (
          <Frame id={detailId} aria-label={nameOf(open.spec.id)}>
            <ItemTop>
              <ItemName colour={open.at !== null ? WON : "#ffffff"}>{nameOf(open.spec.id)}</ItemName>
              <ItemCount>
                {open.at !== null ? words.unlocked
                  : fill(copy.progress, { value: formatNumber(Math.min(open.value, open.spec.target)), target: formatNumber(open.spec.target) })}
              </ItemCount>
            </ItemTop>
            <Note>{copy.achievements[open.spec.id]?.note ?? ""}</Note>
            {open.at === null && (
              <Meter
                segments={Math.min(open.spec.target, 20)}
                role="meter"
                aria-label={nameOf(open.spec.id)}
                aria-valuemin={0}
                aria-valuemax={open.spec.target}
                aria-valuenow={Math.min(open.value, open.spec.target)}
              >
                <BarFill colour="#c4d2ff" style={{ transform: `scaleX(${Math.min(1, open.value / open.spec.target)})` }} />
              </Meter>
            )}
            <div>
              <SmallButton type="button" onClick={() => setChosen(null)}>
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                {` ${words.close}`}
              </SmallButton>
            </div>
          </Frame>
        )}
      </Block>
      <Block aria-labelledby="badges-sky">
        <Subheading id="badges-sky">{content.sky.badgesTitle}</Subheading>
        {progress.skySeen.length === 0 ? <Note>{content.sky.badgesNone}</Note> : (
          <TileGrid>
            {progress.skySeen.map((key) => (
              <li key={key}>
                <Tile as="div" isOn={false}>
                  <FontAwesomeIcon icon={faMeteor} style={{ color: "#ffd9a0" }} aria-hidden="true" />
                  <TileName>{skyBadge(content, key)}</TileName>
                </Tile>
              </li>
            ))}
          </TileGrid>
        )}
      </Block>
    </>
  );
};
