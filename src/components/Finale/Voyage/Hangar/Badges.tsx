import { FC } from "react";

import { faLock, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { levelLine } from "@/components/Finale/Voyage/gear";
import { Item, ItemCount, ItemName, ItemTop, Items, Meter, Note, Subheading } from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { ProgressView } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// The pilot's badges: their level and stars, then every achievement, those unlocked first, each with how near the
// rest are.
export const Badges: FC<{ content: FinaleVoyage; progress: ProgressView }> = ({ content, progress }) => {
  const copy = content.progress;
  const found = progress.achievements.filter((entry) => entry.at !== null).length;
  const sorted = [...progress.achievements].sort((first, second) => Number(second.at !== null) - Number(first.at !== null));

  return (
    <>
      <Note>{levelLine(content, progress)}</Note>
      <Note>{fill(copy.stars, { count: progress.starTotal })}</Note>
      <Subheading>{copy.achievementsTitle}</Subheading>
      <Note>{fill(copy.achievementsFound, { found, total: progress.achievements.length })}</Note>
      <Items>
        {sorted.map(({ spec, at, value }) => {
          const name = copy.achievements[spec.id]?.name ?? spec.id;
          const isDone = at !== null;

          return (
            <Item key={spec.id}>
              <ItemTop>
                <ItemName colour={isDone ? "#ffd76a" : "#9aa3bb"}>
                  <FontAwesomeIcon icon={isDone ? faTrophy : faLock} aria-hidden="true" />
                  {` ${name}`}
                </ItemName>
                {!isDone && <ItemCount>{fill(copy.progress, { value: formatNumber(Math.min(value, spec.target)), target: formatNumber(spec.target) })}</ItemCount>}
              </ItemTop>
              <Note>{copy.achievements[spec.id]?.note ?? ""}</Note>
              {!isDone && (
                <Meter role="meter" aria-label={name} aria-valuemin={0} aria-valuemax={spec.target} aria-valuenow={Math.min(value, spec.target)}>
                  <BarFill colour="#c4d2ff" style={{ transform: `scaleX(${Math.min(1, value / spec.target)})` }} />
                </Meter>
              )}
            </Item>
          );
        })}
      </Items>
    </>
  );
};
