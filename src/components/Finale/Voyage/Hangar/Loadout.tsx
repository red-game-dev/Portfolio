import { FC, useState } from "react";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { slotName } from "@/components/Finale/Voyage/abilities";
import { slotIcon } from "@/components/Finale/Voyage/AbilityBar/icons";
import { itemName } from "@/components/Finale/Voyage/economy";
import { pieceName } from "@/components/Finale/Voyage/gear";
import {
  Actions,
  BarSlotButton,
  Block,
  Frame,
  Item,
  ItemCount,
  ItemName,
  Items,
  ItemTop,
  Note,
  RARITY_COLOUR,
  SlotCount,
  SlotGrid,
  SlotKey,
  SmallButton,
  Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import type { ArmoryView, BarSlot, EconomyView, VoyageAction } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// What a thing from the hold looks like on the bar.
const ITEM_COLOUR = "#c9cfdf";

interface LoadoutProps {
  content: FinaleVoyage;
  economy: EconomyView;
  gear: ArmoryView | null;
  onAct: (action: VoyageAction) => boolean;
}

// The ability bar, set up as it is used: its six slots as on the bar, one chosen (the first empty one to begin
// with), what sits there and the way to take it off; then everything that can go on the bar, boosts, weapons and
// things from the hold, each put in the chosen slot with one press. Something already on the bar moves.
export const Loadout: FC<LoadoutProps> = ({ content, economy, gear, onAct }) => {
  const copy = content.boosts.loadout;
  const words = content.hangar.loadout;
  const firstEmpty = economy.bar.findIndex(({ slot }) => slot === null);
  const [chosen, setChosen] = useState(firstEmpty === -1 ? 0 : firstEmpty);
  const row = economy.bar[chosen];
  const chosenName = row?.slot ? slotName(content, row.slot, row.base) : "";
  const weapons = gear?.pieces.filter((piece) => piece.slot === "weapon") ?? [];
  const isOnChosen = (slot: BarSlot) => row?.slot?.kind === slot.kind && row.slot.id === slot.id;

  // Puts something in the chosen slot, or says it is there already.
  const putButton = (slot: BarSlot, name: string) => (
    <Actions>
      <SmallButton
        type="button"
        isPrimary={!isOnChosen(slot)}
        disabled={isOnChosen(slot)}
        aria-label={fill(copy.putLabel, { name, n: chosen + 1 })}
        onClick={() => onAct({ kind: "setSlot", index: chosen, slot })}
      >
        {fill(copy.put, { n: chosen + 1 })}
      </SmallButton>
    </Actions>
  );

  return (
    <>
      <Note>{copy.note}</Note>
      <Frame aria-labelledby="loadout-slots">
        <Subheading id="loadout-slots">{copy.slots}</Subheading>
        <Note>{words.pick}</Note>
        <SlotGrid>
          {economy.bar.map((entry, index) => {
            const name = entry.slot ? slotName(content, entry.slot, entry.base) : words.empty;

            return (
              <li key={index}>
                <BarSlotButton
                  type="button"
                  colour={entry.colour ?? ITEM_COLOUR}
                  isOn={index === chosen}
                  isEmpty={!entry.slot}
                  aria-pressed={index === chosen}
                  aria-label={fill(words.chosen, { n: index + 1, name })}
                  onClick={() => setChosen(index)}
                >
                  <SlotKey aria-hidden="true">{index + 1}</SlotKey>
                  <FontAwesomeIcon icon={entry.slot ? slotIcon(entry.slot) : faPlus} aria-hidden="true" />
                  {entry.slot && <SlotCount aria-hidden="true">{entry.count}</SlotCount>}
                </BarSlotButton>
              </li>
            );
          })}
        </SlotGrid>
        <ItemTop>
          <ItemName colour="#ffffff">
            {row?.slot ? fill(words.chosen, { n: chosen + 1, name: chosenName }) : fill(words.chosenEmpty, { n: chosen + 1 })}
          </ItemName>
          {row?.slot && (
            <SmallButton
              type="button"
              aria-label={fill(copy.clear, { name: chosenName, n: chosen + 1 })}
              onClick={() => onAct({ kind: "setSlot", index: chosen, slot: null })}
            >
              {words.remove}
            </SmallButton>
          )}
        </ItemTop>
      </Frame>
      <Block aria-labelledby="loadout-boosts">
        <Subheading id="loadout-boosts">{copy.boosts}</Subheading>
        {economy.boosts.length === 0 && <Note>{copy.none}</Note>}
        <Items>
          {economy.boosts.map((boost) => {
            const name = content.boosts.names[boost.id];

            return (
              <Item key={boost.id}>
                <ItemTop>
                  <ItemName colour={boost.colour}>
                    <FontAwesomeIcon icon={slotIcon({ kind: "boost", id: boost.id })} aria-hidden="true" />
                    {` ${name}`}
                  </ItemName>
                  <ItemCount>{`${fill(content.boosts.bar.level, { level: boost.level })}, ${fill(copy.charges, { count: boost.charges, max: boost.max })}`}</ItemCount>
                </ItemTop>
                <Note>{content.boosts.notes[boost.id]}</Note>
                <Note>
                  {boost.nextAt === null
                    ? fill(copy.top, { finds: boost.finds })
                    : fill(copy.progress, { finds: boost.finds, next: boost.nextAt, level: boost.level + 1 })}
                </Note>
                {putButton({ kind: "boost", id: boost.id }, name)}
              </Item>
            );
          })}
        </Items>
      </Block>
      {gear && (
        <Block aria-labelledby="loadout-weapons">
          <Subheading id="loadout-weapons">{words.weapons}</Subheading>
          <Note>{content.gear.aimWarning}</Note>
          {weapons.length === 0 && <Note>{content.gear.forge.note}</Note>}
          <Items>
            {weapons.map((piece) => (
              <Item key={piece.uid}>
                <ItemTop>
                  <ItemName colour={RARITY_COLOUR[piece.rarity]}>{pieceName(content, piece.base)}</ItemName>
                  <ItemCount>{fill(content.gear.level, { level: piece.level })}</ItemCount>
                </ItemTop>
                {putButton({ kind: "weapon", id: piece.uid }, pieceName(content, piece.base))}
              </Item>
            ))}
          </Items>
        </Block>
      )}
      <Block aria-labelledby="loadout-things">
        <Subheading id="loadout-things">{copy.things}</Subheading>
        <Items>
          {economy.cargo.filter((entry) => entry.isUsable).map((entry) => (
            <Item key={entry.id}>
              <ItemTop>
                <ItemName colour={RARITY_COLOUR[entry.rarity]}>{itemName(content.economy, entry.id)}</ItemName>
                <ItemCount>{`x${entry.count}`}</ItemCount>
              </ItemTop>
              {putButton({ kind: "item", id: entry.id }, itemName(content.economy, entry.id))}
            </Item>
          ))}
        </Items>
      </Block>
    </>
  );
};
