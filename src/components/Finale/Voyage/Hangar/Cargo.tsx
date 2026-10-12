import { FC } from "react";

import { blueprintName, itemName } from "@/components/Finale/Voyage/economy";
import {
  Actions,
  Block,
  Frame,
  GroupTop,
  Item,
  ItemCount,
  ItemName,
  Items,
  ItemTop,
  Meter,
  Need,
  Needs,
  Note,
  RARITY_COLOUR,
  SmallButton,
  Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { fillNodes, Money } from "@/components/Finale/Voyage/Money";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import type { EconomyView, VoyageAction } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface CargoProps {
  content: FinaleVoyage;
  economy: EconomyView;
  onAct: (action: VoyageAction) => boolean;
}

// The hold: how full it is, framed, then each thing with its rarity, what it is for, using it (in flight) and what
// breaking it down pays.
export const Hold: FC<CargoProps & { isFlying: boolean }> = ({ content, economy, isFlying, onAct }) => {
  const copy = content.economy;

  return (
    <>
      <Frame aria-labelledby="hold-space">
        <GroupTop>
          <Subheading id="hold-space">{copy.tabs.hold}</Subheading>
          <ItemCount>{fill(copy.hold, { used: economy.used, capacity: economy.capacity })}</ItemCount>
        </GroupTop>
        <Meter segments={Math.min(economy.capacity, 20)} role="meter" aria-label={copy.tabs.hold} aria-valuemin={0} aria-valuemax={economy.capacity}
          aria-valuenow={economy.used}>
          <BarFill colour="var(--tab-accent)" style={{ transform: `scaleX(${economy.capacity > 0 ? economy.used / economy.capacity : 0})` }} />
        </Meter>
      </Frame>
      {economy.cargo.length === 0 && <Note>{copy.emptyHold}</Note>}
      <Items>
        {economy.cargo.map((row) => (
          <Item key={row.id}>
            <ItemTop>
              <ItemName colour={RARITY_COLOUR[row.rarity]}>{itemName(copy, row.id)}</ItemName>
              <ItemCount>{`${copy.rarities[row.rarity]}, x${row.count}`}</ItemCount>
            </ItemTop>
            <Note>{copy.items[row.id]?.note ?? ""}</Note>
            <Actions>
              {row.isUsable && (
                <SmallButton type="button" isPrimary disabled={!isFlying} aria-label={`${copy.use}: ${itemName(copy, row.id)}`}
                  onClick={() => onAct({ kind: "use", item: row.id })}>
                  {copy.use}
                </SmallButton>
              )}
              <SmallButton
                type="button"
                aria-label={`${fill(copy.recycle, { value: `${row.value} ${copy.currencies.RED}` })}: ${itemName(copy, row.id)}`}
                onClick={() => onAct({ kind: "recycle", item: row.id, count: 1 })}
              >
                {fillNodes(copy.recycle, { value: <Money copy={copy} amount={row.value} /> })}
              </SmallButton>
            </Actions>
          </Item>
        ))}
      </Items>
    </>
  );
};

// The plans: those that can be made now first, each with what it takes against the hold and making it in one
// press; then those still to find; then the hull plans found.
export const Plans: FC<CargoProps> = ({ content, economy, onAct }) => {
  const copy = content.economy;
  const have = (id: string) => economy.cargo.find((row) => row.id === id)?.count ?? 0;
  const order = (entry: (typeof economy.recipes)[number]) => (entry.isKnown ? (entry.shortfall.isReady ? 0 : 1) : 2);
  const recipes = [...economy.recipes].sort((first, second) => order(first) - order(second));
  const hulls = economy.blueprints.filter((id) => id.startsWith("hull:"));

  return (
    <>
      <Items>
        {recipes.map(({ recipe, isKnown, shortfall }) => (
          <Item key={recipe.id}>
            <ItemTop>
              <ItemName colour={isKnown ? "#ffffff" : "#7d859c"}>{itemName(copy, recipe.makes.id)}</ItemName>
              <ItemCount>{recipe.coin > 0 ? <Money copy={copy} amount={recipe.coin} /> : ""}</ItemCount>
            </ItemTop>
            {isKnown ? (
              <>
                <Needs aria-label={copy.needs}>
                  {recipe.needs.map(({ id, count }) => (
                    <Need key={id} isMet={have(id) >= count}>
                      <span>{itemName(copy, id)}</span>
                      <span>{fill(copy.have, { have: Math.min(have(id), count), need: count })}</span>
                    </Need>
                  ))}
                </Needs>
                <Actions>
                  <SmallButton type="button" isPrimary disabled={!shortfall.isReady} aria-label={`${copy.plans.make}: ${itemName(copy, recipe.makes.id)}`}
                    onClick={() => onAct({ kind: "craft", recipe: recipe.id })}>
                    {copy.plans.make}
                  </SmallButton>
                </Actions>
              </>
            ) : (
              <Note>{copy.plans.locked}</Note>
            )}
          </Item>
        ))}
      </Items>
      {hulls.length > 0 && (
        <Block aria-labelledby="hangar-hulls">
          <Subheading id="hangar-hulls">{copy.plans.hullPlans}</Subheading>
          <Note>{hulls.map((id) => blueprintName(copy, id)).join(", ")}</Note>
        </Block>
      )}
    </>
  );
};
