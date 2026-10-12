import { FC, useRef, useState } from "react";

import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Actions,
  Frame,
  Note,
  PreviewCanvas,
  SmallButton,
  Subheading,
  Swatch,
  Tile,
  TileGrid,
  TileName,
  TrailBar,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { ACHIEVEMENTS_BY_REWARD } from "@/components/Finale/Voyage/Hangar/rewards";
import { useShipCanvas } from "@/components/Finale/Voyage/Hangar/useShipCanvas";
import type { ProgressView, VoyageAction } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface StyleProps {
  content: FinaleVoyage;
  progress: ProgressView;
  // Draws the ship into a canvas, in the paint named or the one worn.
  drawShip: (context: CanvasRenderingContext2D, width: number, height: number, paint?: string) => void;
  onAct: (action: VoyageAction) => boolean;
}

type Cosmetic = "paint" | "trail";

// The paints and engine trails. The ship is drawn at the top in the paint being tried (the one worn until another is
// tapped) with the trail behind it, and under it what is shown: worn, ready to wear, or what wins it (a badge and
// what that asks, or a number of stars). Every paint and trail is a tile below, tapped to try it on.
export const Style: FC<StyleProps> = ({ content, progress, drawShip, onAct }) => {
  const copy = content.progress;
  const words = content.hangar.style;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tried, setTried] = useState<Record<Cosmetic, string | null>>({ paint: null, trail: null });
  const byReward = ACHIEVEMENTS_BY_REWARD(progress);
  const wornPaint = progress.paints.find(({ isWorn }) => isWorn) ?? progress.paints[0];
  const wornTrail = progress.trails.find(({ isWorn }) => isWorn) ?? progress.trails[0];
  const paint = progress.paints.find(({ spec }) => spec.id === tried.paint) ?? wornPaint;
  const trail = progress.trails.find(({ spec }) => spec.id === tried.trail) ?? wornTrail;
  const paintName = (id: string) => copy.paints[id] ?? id;
  const trailName = (id: string) => copy.trails[id] ?? id;

  useShipCanvas(canvasRef, (context, width, height) => drawShip(context, width, height, paint?.spec.id), [drawShip, paint?.spec.id]);

  // What wins a cosmetic: a number of stars, or a badge and what it asks.
  const unlock = (id: string, stars: number | null) => {
    if (stars !== null) {
      return fill(copy.byStars, { stars });
    }

    const achievement = byReward[id];

    return achievement ? fill(copy.byAchievement, { achievement: copy.achievements[achievement]?.name ?? achievement, note: copy.achievements[achievement]?.note ?? "" })
      : words.locked;
  };

  // What is shown of one kind, and the way to wear it or what wins it.
  const standing = (kind: Cosmetic, entry: { spec: { id: string }; isOwned: boolean; isWorn: boolean; stars: number | null }, name: string) => (
    <div>
      <Note>{fill(entry.isWorn ? words.wearing : words.trying, { name })}</Note>
      {entry.isOwned ? (
        !entry.isWorn && (
          <Actions>
            <SmallButton type="button" isPrimary onClick={() => onAct({ kind: "wear", cosmetic: kind, id: entry.spec.id })}>
              {`${copy.wear}: ${name}`}
            </SmallButton>
          </Actions>
        )
      ) : (
        <Note>
          <FontAwesomeIcon icon={faLock} aria-hidden="true" />
          {` ${unlock(entry.spec.id, entry.stars)}`}
        </Note>
      )}
    </div>
  );

  return (
    <>
      <Note>{words.intro}</Note>
      {paint && trail && (
        <Frame aria-label={fill(words.trying, { name: `${paintName(paint.spec.id)}, ${trailName(trail.spec.id)}` })}>
          <PreviewCanvas ref={canvasRef} aria-hidden="true" />
          <TrailBar core={trail.spec.core} edge={trail.spec.edge} aria-hidden="true" />
          {standing("paint", paint, paintName(paint.spec.id))}
          {standing("trail", trail, trailName(trail.spec.id))}
        </Frame>
      )}
      <Subheading>{copy.paintsTitle}</Subheading>
      <TileGrid min={96}>
        {progress.paints.map(({ spec, isOwned, isWorn }) => (
          <li key={spec.id}>
            <Tile type="button" isOn={spec.id === paint?.spec.id} isDim={!isOwned} aria-pressed={spec.id === paint?.spec.id}
              onClick={() => setTried((now) => ({ ...now, paint: spec.id }))}>
              <span aria-hidden="true">
                {[spec.hull, spec.fin, spec.window, spec.accent ?? spec.hullShade].map((colour, index) => <Swatch key={index} colour={colour} />)}
              </span>
              <TileName>
                {!isOwned && <FontAwesomeIcon icon={faLock} title={words.locked} />}
                {` ${paintName(spec.id)}${isWorn ? ` (${copy.worn})` : ""}`}
              </TileName>
            </Tile>
          </li>
        ))}
      </TileGrid>
      <Subheading>{copy.trailsTitle}</Subheading>
      <TileGrid min={96}>
        {progress.trails.map(({ spec, isOwned, isWorn }) => (
          <li key={spec.id}>
            <Tile type="button" isOn={spec.id === trail?.spec.id} isDim={!isOwned} aria-pressed={spec.id === trail?.spec.id}
              onClick={() => setTried((now) => ({ ...now, trail: spec.id }))}>
              <TrailBar core={spec.core} edge={spec.edge} aria-hidden="true" />
              <TileName>
                {!isOwned && <FontAwesomeIcon icon={faLock} title={words.locked} />}
                {` ${trailName(spec.id)}${isWorn ? ` (${copy.worn})` : ""}`}
              </TileName>
            </Tile>
          </li>
        ))}
      </TileGrid>
    </>
  );
};
