import { FC } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { itemName } from "@/components/Finale/Voyage/economy";
import { pieceName } from "@/components/Finale/Voyage/gear";
import { WEAPON_ICONS } from "@/components/Finale/Voyage/Hangar/gearIcons";
import {
  Actions, Block, Item, ItemCount, ItemName, ItemTop, Items, Need, Needs, Note, SmallButton, Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { EnhancePanel, PieceRow } from "@/components/Finale/Voyage/Hangar/parts";
import type { ArmoryView, VoyageAction } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface ForgeProps {
  content: FinaleVoyage;
  gear: ArmoryView;
  onAct: (action: VoyageAction) => boolean;
}

// The forge: the weapons owned, each with its next enhancement and broken down for Red Coin when not wanted; then
// every weapon that can be forged, its plan known or not, each grade the hull allows with what it takes.
export const Forge: FC<ForgeProps> = ({ content, gear, onAct }) => {
  const copy = content.gear;
  const weapons = gear.pieces.filter((piece) => piece.slot === "weapon");

  return (
    <>
      <Note>{copy.enhance.note}</Note>
      {weapons.length > 0 && (
        <Block aria-labelledby="forge-owned">
          <Subheading id="forge-owned">{copy.pieces}</Subheading>
          <Items>
            {weapons.map((piece) => (
              <PieceRow
                key={piece.uid}
                content={content}
                piece={piece}
                actions={(
                  <>
                    <EnhancePanel content={content} piece={piece} stabilisers={gear.stabilisers} onAct={onAct} />
                    {!piece.isOnBar && (
                      <Actions>
                        <SmallButton type="button" onClick={() => onAct({ kind: "dismantle", uid: piece.uid })}>
                          {fill(copy.dismantle, { value: `${piece.value} ${content.economy.symbols.RED}` })}
                        </SmallButton>
                      </Actions>
                    )}
                  </>
                )}
              />
            ))}
          </Items>
        </Block>
      )}
      <Block aria-labelledby="forge-make">
        <Subheading id="forge-make">{copy.forge.title}</Subheading>
        <Note>{copy.forge.note}</Note>
        <Items>
          {gear.forge.map((forge) => (
            <Item key={forge.kind}>
              <ItemTop>
                <ItemName colour={forge.isKnown ? "#ffffff" : "#7d859c"}>
                  <FontAwesomeIcon icon={WEAPON_ICONS[forge.kind]} aria-hidden="true" />
                  {` ${copy.weapons[forge.kind].name}`}
                </ItemName>
              </ItemTop>
              <Note>{copy.weapons[forge.kind].note}</Note>
              {!forge.isKnown && <Note>{copy.forge.locked}</Note>}
              {forge.isKnown && forge.grades.map((grade) => (
                <div key={grade.grade}>
                  <ItemTop>
                    <ItemCount>{fill(copy.forge.grade, { grade: copy.grades[grade.grade] })}</ItemCount>
                    <ItemCount>{`${formatNumber(grade.coin)} ${content.economy.symbols.RED}, ${fill(copy.forge.needsLevel, { level: grade.pilotLevel })}`}</ItemCount>
                  </ItemTop>
                  <Needs aria-label={content.economy.needs}>
                    {grade.items.map(({ id, count, have }) => (
                      <Need key={id} isMet={have >= count}>
                        <span>{itemName(content.economy, id)}</span>
                        <span>{fill(content.economy.have, { have: Math.min(have, count), need: count })}</span>
                      </Need>
                    ))}
                  </Needs>
                  <Actions>
                    <SmallButton type="button" isPrimary disabled={!grade.isReady} onClick={() => onAct({ kind: "forge", weapon: forge.kind, grade: grade.grade })}>
                      {`${copy.forge.make}: ${pieceName(content, `weapon:${forge.kind}:${grade.grade}`)}`}
                    </SmallButton>
                  </Actions>
                </div>
              ))}
            </Item>
          ))}
        </Items>
      </Block>
    </>
  );
};
