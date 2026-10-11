import { FC, useEffect, useRef, useState } from "react";

import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { shipAtLevel, shipName } from "@/components/Finale/Voyage/economy";
import { levelLine, pieceName, statLines } from "@/components/Finale/Voyage/gear";
import { SLOT_ICONS, TIER_COLOURS, TIER_ICONS } from "@/components/Finale/Voyage/Hangar/gearIcons";
import {
  Actions, Block, Items, Meter, Note, RARITY_COLOUR, ShipName, SmallButton, StatLine, StatList, Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { EnhancePanel, FormBadge, PieceRow } from "@/components/Finale/Voyage/Hangar/parts";
import {
  Below, Column, Doll, ShipCanvas, ShipFrame, SheetHead, Slot, SlotLevel, SlotName, SlotTop, Total, Totals,
} from "@/components/Finale/Voyage/Hangar/ShipSheet.styles";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { ArmoryView, EconomyView, GearSlot, ProgressView, SlotView, VoyageAction } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface ShipSheetProps {
  content: FinaleVoyage;
  economy: EconomyView;
  gear: ArmoryView;
  progress: ProgressView | null;
  // Draws the ship as it looks now into a canvas.
  drawShip: (context: CanvasRenderingContext2D, width: number, height: number) => void;
  onAct: (action: VoyageAction) => boolean;
}

const LEFT: readonly GearSlot[] = ["cockpit", "sensors", "shield", "primary", "radiators"];
const RIGHT: readonly GearSlot[] = ["armor", "engines", "wings", "tank"];
const BELOW: readonly GearSlot[] = ["pods", "reactor", "drive", "halo"];
const TIERS = ["moon", "star", "galaxy"];

// The ship's sheet, as an MMO's character sheet: the pilot's level and the ship's enhancement across its fittings at
// the top, the ship drawn as it looks with every piece round it (those it has not grown yet dimmed with what they
// wait for), and a chosen piece's details: what it adds, its level, the next enhancement, the spares that fit there,
// and taking it off. What every fitting adds together, and the ammunition racks, follow.
export const ShipSheet: FC<ShipSheetProps> = ({ content, economy, gear, progress, drawShip, onAct }) => {
  const copy = content.gear;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chosen, setChosen] = useState<GearSlot>("primary");
  const byUid = new Map(gear.pieces.map((piece) => [piece.uid, piece]));
  const slotOf = (slot: GearSlot) => gear.slots.find((entry) => entry.slot === slot);
  const fitted = gear.slots.map((slot) => (slot.uid ? byUid.get(slot.uid) : undefined)).filter((piece) => piece !== undefined);
  const totals = TIERS.map((tier) => ({ tier, count: fitted.reduce((sum, piece) => sum + (piece?.form.tier === tier ? piece.form.count : 0), 0) }));
  const chosenSlot = slotOf(chosen);
  const chosenPiece = chosenSlot?.uid ? byUid.get(chosenSlot.uid) : undefined;
  const spares = gear.pieces.filter((piece) => piece.slot === chosen && !piece.isFitted);

  // The ship is drawn again whenever how it looks may have changed.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth * ratio;
    const height = canvas.clientHeight * ratio;

    canvas.width = width;
    canvas.height = height;
    drawShip(context, width, height);
  }, [drawShip, gear, economy.level]);

  // What a slot not yet grown waits for: a greater ship and a higher level.
  const lockedText = (entry: SlotView) => fill(copy.locked, { ship: shipAtLevel(content.economy, entry.form), level: entry.pilotLevel });

  const slotButton = (entry: SlotView | undefined) => {
    if (!entry) {
      return null;
    }

    const piece = entry.uid ? byUid.get(entry.uid) : undefined;
    const name = piece ? pieceName(content, piece.base) : entry.isOpen ? copy.empty : lockedText(entry);
    const colour = piece ? RARITY_COLOUR[piece.rarity] : "#7d859c";

    return (
      <Slot
        key={entry.slot}
        type="button"
        colour={colour}
        isChosen={chosen === entry.slot}
        isLocked={!entry.isOpen}
        aria-pressed={chosen === entry.slot}
        aria-label={`${copy.slots[entry.slot]}: ${name}`}
        onClick={() => setChosen(entry.slot)}
      >
        <SlotTop>
          <FontAwesomeIcon icon={entry.isOpen ? SLOT_ICONS[entry.slot] : faLock} aria-hidden="true" />
          {copy.slots[entry.slot]}
          {piece && <SlotLevel>{fill(copy.level, { level: piece.level })}</SlotLevel>}
        </SlotTop>
        <SlotName colour={colour}>{name}</SlotName>
        {piece && <FormBadge content={content} form={piece.form} />}
      </Slot>
    );
  };

  return (
    <>
      <SheetHead>
        <ShipName>{shipName(content.economy, economy.tier, economy.mark)}</ShipName>
        {progress && (
          <>
            <Note>{levelLine(content, progress)}</Note>
            <Meter role="meter" aria-label={fill(content.progress.level, { level: progress.level })} aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={Math.round(progress.standing.share * 100)}>
              <BarFill colour="#ffd76a" style={{ transform: `scaleX(${progress.standing.share})` }} />
            </Meter>
          </>
        )}
        <Totals aria-label={copy.enhance.title}>
          {totals.map(({ tier, count }) => (
            <Total key={tier} colour={TIER_COLOURS[tier]}>
              <FontAwesomeIcon icon={TIER_ICONS[tier]} aria-hidden="true" />
              {`${count} ${count === 1 ? copy.tiers[tier].one : copy.tiers[tier].many}`}
            </Total>
          ))}
        </Totals>
      </SheetHead>
      <Doll>
        <Column area="left">{LEFT.map((slot) => slotButton(slotOf(slot)))}</Column>
        <ShipFrame>
          <ShipCanvas ref={canvasRef} aria-hidden="true" />
        </ShipFrame>
        <Column area="right">{RIGHT.map((slot) => slotButton(slotOf(slot)))}</Column>
        <Below>{BELOW.map((slot) => slotButton(slotOf(slot)))}</Below>
      </Doll>
      <Block aria-labelledby="sheet-chosen">
        <Subheading id="sheet-chosen">{copy.slots[chosen]}</Subheading>
        <Note>{copy.slotNotes[chosen]}</Note>
        {chosenPiece ? (
          <PieceRow
            content={content}
            piece={chosenPiece}
            actions={(
              <>
                <EnhancePanel content={content} piece={chosenPiece} stabilisers={gear.stabilisers} onAct={onAct} />
                <Actions>
                  <SmallButton type="button" onClick={() => onAct({ kind: "unequip", slot: chosen })}>{copy.unfit}</SmallButton>
                </Actions>
              </>
            )}
          />
        ) : (
          <Note>{chosenSlot?.isOpen || !chosenSlot ? copy.empty : lockedText(chosenSlot)}</Note>
        )}
        {spares.length > 0 && (
          <Items>
            {spares.map((piece) => (
              <PieceRow
                key={piece.uid}
                content={content}
                piece={piece}
                actions={(
                  <Actions>
                    <SmallButton type="button" isPrimary disabled={!piece.canFit} onClick={() => onAct({ kind: "equip", uid: piece.uid })}>
                      {piece.canFit ? copy.fit : fill(copy.needsLevel, { level: piece.gradeLevel })}
                    </SmallButton>
                    <SmallButton type="button" onClick={() => onAct({ kind: "dismantle", uid: piece.uid })}>
                      {fill(copy.dismantle, { value: `${piece.value} ${content.economy.symbols.RED}` })}
                    </SmallButton>
                  </Actions>
                )}
              />
            ))}
          </Items>
        )}
      </Block>
      <Block aria-labelledby="sheet-totals">
        <Subheading id="sheet-totals">{copy.pieces}</Subheading>
        <StatList>
          {statLines(content, gear.stats).map(({ label, value }) => <StatLine key={label}>{`${label} ${value}`}</StatLine>)}
        </StatList>
      </Block>
      <Block aria-labelledby="sheet-ammo">
        <Subheading id="sheet-ammo">{copy.ammoTitle}</Subheading>
        <StatList>
          {gear.ammo.map(({ type, count, rack }) => (
            <StatLine key={type}>{`${copy.ammo[type]} ${fill(copy.rack, { count: formatNumber(count), rack: formatNumber(rack) })}`}</StatLine>
          ))}
        </StatList>
      </Block>
    </>
  );
};
