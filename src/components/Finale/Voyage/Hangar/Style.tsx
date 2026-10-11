import { FC } from "react";

import { Actions, Item, ItemName, ItemTop, Items, Note, SmallButton, Subheading, Swatch } from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { ACHIEVEMENTS_BY_REWARD } from "@/components/Finale/Voyage/Hangar/rewards";
import type { ProgressView, VoyageAction } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface StyleProps {
  content: FinaleVoyage;
  progress: ProgressView;
  onAct: (action: VoyageAction) => boolean;
}

// The paints and engine trails: each with its colours, worn or ready to wear, or what wins it (an achievement or
// a number of stars).
export const Style: FC<StyleProps> = ({ content, progress, onAct }) => {
  const copy = content.progress;
  const unlock = (id: string, stars: number | null) => {
    const achievement = ACHIEVEMENTS_BY_REWARD(progress)[id];

    if (stars !== null) {
      return fill(copy.byStars, { stars });
    }

    return achievement ? fill(copy.byAchievement, { achievement: copy.achievements[achievement]?.name ?? achievement }) : "";
  };

  return (
    <>
      <Subheading>{copy.paintsTitle}</Subheading>
      <Items>
        {progress.paints.map(({ spec, isOwned, isWorn, stars }) => (
          <Item key={spec.id}>
            <ItemTop>
              <ItemName colour={isOwned ? "#ffffff" : "#7d859c"}>{copy.paints[spec.id] ?? spec.id}</ItemName>
              <span>
                {[spec.hull, spec.fin, spec.window, spec.accent ?? spec.hullShade].map((colour) => <Swatch key={colour} colour={colour} aria-hidden="true" />)}
              </span>
            </ItemTop>
            {isOwned ? (
              <Actions>
                <SmallButton type="button" isPrimary={!isWorn} disabled={isWorn} onClick={() => onAct({ kind: "wear", cosmetic: "paint", id: spec.id })}>
                  {isWorn ? copy.worn : copy.wear}
                </SmallButton>
              </Actions>
            ) : <Note>{unlock(spec.id, stars)}</Note>}
          </Item>
        ))}
      </Items>
      <Subheading>{copy.trailsTitle}</Subheading>
      <Items>
        {progress.trails.map(({ spec, isOwned, isWorn, stars }) => (
          <Item key={spec.id}>
            <ItemTop>
              <ItemName colour={isOwned ? "#ffffff" : "#7d859c"}>{copy.trails[spec.id] ?? spec.id}</ItemName>
              <span>
                {[spec.core, spec.edge].map((colour) => <Swatch key={colour} colour={colour} aria-hidden="true" />)}
              </span>
            </ItemTop>
            {isOwned ? (
              <Actions>
                <SmallButton type="button" isPrimary={!isWorn} disabled={isWorn} onClick={() => onAct({ kind: "wear", cosmetic: "trail", id: spec.id })}>
                  {isWorn ? copy.worn : copy.wear}
                </SmallButton>
              </Actions>
            ) : <Note>{unlock(spec.id, stars)}</Note>}
          </Item>
        ))}
      </Items>
    </>
  );
};
