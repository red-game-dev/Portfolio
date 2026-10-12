import { FC, useId, useState } from "react";

import tw from "twin.macro";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { codexName, codexNotes } from "@/components/Finale/Voyage/career";
import {
  Block,
  Frame,
  GroupTop,
  ItemCount,
  ItemName,
  Meter,
  Note,
  SmallButton,
  Subheading,
  Tile,
  TileGrid,
  TileName,
  Unknown,
  Unknowns,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { CareerView, CodexCategory } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

const CODEX_ORDER: readonly CodexCategory[] = ["worlds", "kinds", "universes", "galaxies", "stars", "phenomena", "life", "wrecks", "things", "boosts"];
// At most this many marks for what is still to find in a category; the rest are counted on the last.
const UNKNOWN_SHOWN = 9;

const Hidden = tw.span`sr-only`;

// The codex: how much of it is found, then each category with its count and a gauge, what is found as tiles and what
// is not as dim marks; a tile tapped opens its notes (our own worlds' real figures) underneath.
export const Codex: FC<{ content: FinaleVoyage; career: CareerView }> = ({ content, career }) => {
  const copy = content.career;
  const words = content.hangar.details;
  const detailId = useId();
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <>
      <Note>{fill(copy.codexFound, { found: career.found, total: career.codex.length })}</Note>
      {CODEX_ORDER.map((category) => {
        const entries = career.codex.filter(({ entry }) => entry.category === category);
        const found = entries.filter(({ isFound }) => isFound).map(({ entry }) => entry);
        const left = entries.length - found.length;
        const open = found.find(({ id }) => id === chosen);

        return (
          <Block key={category} aria-labelledby={`codex-${category}`}>
            <GroupTop>
              <Subheading id={`codex-${category}`}>{copy.categories[category]}</Subheading>
              <ItemCount>{`${found.length} / ${entries.length}`}</ItemCount>
            </GroupTop>
            <Meter segments={Math.min(entries.length, 20)} aria-hidden="true">
              <BarFill colour="var(--tab-accent)" style={{ transform: `scaleX(${entries.length > 0 ? found.length / entries.length : 0})` }} />
            </Meter>
            {found.length > 0 && (
              <TileGrid>
                {found.map((entry) => {
                  const isOpen = chosen === entry.id;

                  return (
                    <li key={entry.id}>
                      <Tile
                        type="button"
                        isOn={isOpen}
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? detailId : undefined}
                        onClick={() => setChosen(isOpen ? null : entry.id)}
                      >
                        <TileName>{codexName(content, entry)}</TileName>
                      </Tile>
                    </li>
                  );
                })}
              </TileGrid>
            )}
            {left > 0 && (
              <Unknowns aria-hidden="true">
                {Array.from({ length: Math.min(left, UNKNOWN_SHOWN) }, (_, index) => <Unknown key={`unknown-${index}`}>?</Unknown>)}
                {left > UNKNOWN_SHOWN && <Unknown key="more">{`+${left - UNKNOWN_SHOWN}`}</Unknown>}
              </Unknowns>
            )}
            {left > 0 && <Hidden>{fill(copy.unknown, { count: left })}</Hidden>}
            {open && (
              <Frame id={detailId} aria-label={codexName(content, open)}>
                <ItemName colour="#ffffff">{codexName(content, open)}</ItemName>
                {codexNotes(content, open).map((line) => <Note key={line}>{line}</Note>)}
                <div>
                  <SmallButton type="button" onClick={() => setChosen(null)}>
                    <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                    {` ${words.close}`}
                  </SmallButton>
                </div>
              </Frame>
            )}
          </Block>
        );
      })}
    </>
  );
};
