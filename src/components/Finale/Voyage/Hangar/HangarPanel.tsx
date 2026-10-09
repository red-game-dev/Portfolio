import { FC, useEffect, useRef, useState } from "react";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { blueprintName, formatPurse, itemName, ledgerMemo, shipName } from "@/components/Finale/Voyage/economy";
import {
  Actions,
  Amount,
  Block,
  Body,
  Entries,
  Entry,
  Footer,
  Header,
  Heading,
  Item,
  ItemCount,
  ItemName,
  Items,
  ItemTop,
  Meter,
  Need,
  Needs,
  Note,
  Panel,
  Purse,
  RARITY_COLOUR,
  Shards,
  ShipName,
  SmallButton,
  StatRow,
  StatName,
  StatNext,
  Stats,
  StatValue,
  Subheading,
  TabPanel,
  Tabs,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { BarFill, IconButton } from "@/components/Finale/Voyage/VoyageDialog.styles";
import { Tab, TabList } from "@/components/Tabs";
import useTabs from "@/hooks/useTabs";
import type { EconomyView, ShipStats, VoyageAction } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface HangarPanelProps {
  content: FinaleVoyage;
  economy: EconomyView;
  isFlying: boolean;
  onAct: (action: VoyageAction) => boolean;
  onClose: () => void;
}

const STAT_KEYS: ReadonlyArray<keyof ShipStats> = ["hull", "shields", "fuel", "thrust", "cargo", "plating", "pressure", "guns", "weapon"];

// The hangar: the ship, what it can do and what the next level needs (upgraded in one click); the hold, with
// each thing's use and worth; the plans, made from the hold; and the ledger of every coin earned and spent. Its
// own records, the Void Shard trade and the reset sit beside them. Opening it focuses its heading.
export const HangarPanel: FC<HangarPanelProps> = ({ content, economy, isFlying, onAct, onClose }: HangarPanelProps) => {
  const copy = content.economy;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const tabs = [copy.tabs.ship, copy.tabs.hold, copy.tabs.plans, copy.tabs.ledger];
  const { active, listProps, tabProps, panelProps } = useTabs({ count: tabs.length });
  const { next, stats } = economy;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const statText = (key: keyof ShipStats, value: ShipStats[keyof ShipStats]) => {
    if (key === "weapon") {
      return copy.weapons[value === "laser" ? "laser" : "cannon"];
    }

    const text = typeof value === "number" ? value.toLocaleString("en-GB") : String(value);

    return key === "plating" ? fill(copy.units.celsius, { value: text }) : key === "pressure" ? fill(copy.units.bar, { value: text }) :
      key === "thrust" ? fill(copy.units.times, { value: text }) : text;
  };
  const have = (id: string) => economy.cargo.find((row) => row.id === id)?.count ?? 0;
  const records: Array<[string, number]> = [
    [copy.records.runs, economy.records.runs],
    [copy.records.best, economy.records.bestScore],
    [copy.records.universes, economy.records.universes],
    [copy.records.bosses, economy.records.bosses],
    [copy.records.rescues, economy.records.rescues],
    [copy.records.salvaged, economy.records.salvaged],
  ];

  return (
    <Panel aria-labelledby="hangar-heading">
      <Header>
        <Heading id="hangar-heading" ref={headingRef} tabIndex={-1}>{copy.hangar}</Heading>
        <Purse>
          <span>{`${economy.purse.RED.toLocaleString("en-GB")} ${copy.symbols.RED}`}</span>
          <Shards>{`${economy.purse.VOID} ${copy.symbols.VOID}`}</Shards>
        </Purse>
        <IconButton type="button" onClick={onClose} aria-label={copy.closeHangar}>
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </IconButton>
      </Header>
      <Tabs>
        <TabList {...listProps} aria-label={copy.hangar}>
          {tabs.map((label, index) => (
            <Tab key={label} {...tabProps(index)} isOn={index === active}>{label}</Tab>
          ))}
        </TabList>
      </Tabs>
      <Body>
        <TabPanel {...panelProps(0)}>
          <div>
            <ShipName>{shipName(copy, economy.tier, economy.mark)}</ShipName>
            <Note>{copy.tierNotes[economy.tier]}</Note>
          </div>
          <Stats>
            {STAT_KEYS.map((key) => (
              <StatRow key={key}>
                <StatName>{copy.stats[key]}</StatName>
                <StatValue>{statText(key, stats[key])}</StatValue>
                <StatNext>{next && next.stats[key] !== stats[key] ? statText(key, next.stats[key]) : ""}</StatNext>
              </StatRow>
            ))}
          </Stats>
          {next ? (
            <Block aria-labelledby="hangar-next">
              <Subheading id="hangar-next">{fill(copy.next, { ship: shipName(copy, next.tier, next.mark) })}</Subheading>
              {next.tier !== economy.tier && <Note>{copy.tierNotes[next.tier]}</Note>}
              <Needs aria-label={copy.needs}>
                <Need isMet={next.shortfall.coin.RED === 0}>
                  <span>{copy.currencies.RED}</span>
                  <span>{fill(copy.have, { have: economy.purse.RED, need: next.cost.coin.RED })}</span>
                </Need>
                {next.cost.coin.VOID > 0 && (
                  <Need isMet={next.shortfall.coin.VOID === 0}>
                    <span>{copy.currencies.VOID}</span>
                    <span>{fill(copy.have, { have: economy.purse.VOID, need: next.cost.coin.VOID })}</span>
                  </Need>
                )}
                {next.cost.items.map(({ id, count }) => (
                  <Need key={id} isMet={have(id) >= count}>
                    <span>{itemName(copy, id)}</span>
                    <span>{fill(copy.have, { have: Math.min(have(id), count), need: count })}</span>
                  </Need>
                ))}
                {next.cost.blueprint && (
                  <Need isMet={next.shortfall.blueprint === null}>
                    <span>{fill(copy.blueprint, { ship: copy.tiers[next.tier] })}</span>
                    <span>{fill(copy.have, { have: next.shortfall.blueprint === null ? 1 : 0, need: 1 })}</span>
                  </Need>
                )}
              </Needs>
              <Actions>
                <SmallButton type="button" isPrimary disabled={!next.shortfall.isReady} onClick={() => onAct({ kind: "upgrade" })}>
                  {fill(copy.upgrade, { ship: shipName(copy, next.tier, next.mark) })}
                </SmallButton>
              </Actions>
            </Block>
          ) : (
            <Note>{copy.top}</Note>
          )}
          <Block aria-labelledby="hangar-records">
            <Subheading id="hangar-records">{copy.records.title}</Subheading>
            <Stats>
              {records.map(([label, value]) => (
                <StatRow key={label}>
                  <StatName>{label}</StatName>
                  <StatValue>{value.toLocaleString("en-GB")}</StatValue>
                  <StatNext />
                </StatRow>
              ))}
            </Stats>
          </Block>
          <Actions>
            <SmallButton type="button" disabled={economy.purse.VOID < 1} onClick={() => onAct({ kind: "trade", direction: "sell" })}>
              {fill(copy.trade.sell, { price: `${economy.prices.sell} ${copy.symbols.RED}` })}
            </SmallButton>
            <SmallButton type="button" disabled={economy.purse.RED < economy.prices.buy} onClick={() => onAct({ kind: "trade", direction: "buy" })}>
              {fill(copy.trade.buy, { price: `${economy.prices.buy} ${copy.symbols.RED}` })}
            </SmallButton>
          </Actions>
        </TabPanel>
        <TabPanel {...panelProps(1)}>
          <div>
            <Note>{fill(copy.hold, { used: economy.used, capacity: economy.capacity })}</Note>
            <Meter role="meter" aria-label={copy.tabs.hold} aria-valuemin={0} aria-valuemax={economy.capacity} aria-valuenow={economy.used}>
              <BarFill colour="#c4d2ff" style={{ transform: `scaleX(${economy.capacity > 0 ? economy.used / economy.capacity : 0})` }} />
            </Meter>
          </div>
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
                    <SmallButton
                      type="button"
                      isPrimary
                      disabled={!isFlying}
                      aria-label={`${copy.use}: ${itemName(copy, row.id)}`}
                      onClick={() => onAct({ kind: "use", item: row.id })}
                    >
                      {copy.use}
                    </SmallButton>
                  )}
                  <SmallButton
                    type="button"
                    aria-label={`${fill(copy.recycle, { value: `${row.value} ${copy.currencies.RED}` })}: ${itemName(copy, row.id)}`}
                    onClick={() => onAct({ kind: "recycle", item: row.id, count: 1 })}
                  >
                    {fill(copy.recycle, { value: `${row.value} ${copy.symbols.RED}` })}
                  </SmallButton>
                </Actions>
              </Item>
            ))}
          </Items>
        </TabPanel>
        <TabPanel {...panelProps(2)}>
          <Items>
            {economy.recipes.map(({ recipe, isKnown, shortfall }) => (
              <Item key={recipe.id}>
                <ItemTop>
                  <ItemName colour={isKnown ? "#ffffff" : "#7d859c"}>{itemName(copy, recipe.makes.id)}</ItemName>
                  <ItemCount>{recipe.coin > 0 ? `${recipe.coin} ${copy.symbols.RED}` : ""}</ItemCount>
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
                      <SmallButton
                        type="button"
                        isPrimary
                        disabled={!shortfall.isReady}
                        aria-label={`${copy.plans.make}: ${itemName(copy, recipe.makes.id)}`}
                        onClick={() => onAct({ kind: "craft", recipe: recipe.id })}
                      >
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
          {economy.blueprints.some((id) => id.startsWith("hull:")) && (
            <Block aria-labelledby="hangar-hulls">
              <Subheading id="hangar-hulls">{copy.plans.hullPlans}</Subheading>
              <Note>{economy.blueprints.filter((id) => id.startsWith("hull:")).map((id) => blueprintName(copy, id))
.join(", ")}</Note>
            </Block>
          )}
        </TabPanel>
        <TabPanel {...panelProps(3)}>
          <Stats>
            <StatName>{copy.ledger.balance}</StatName>
            <StatValue>{formatPurse(copy, economy.purse)}</StatValue>
            <StatNext />
          </Stats>
          {economy.history.length === 0 && <Note>{copy.ledger.empty}</Note>}
          <Entries>
            {economy.history.map((row) => (
              <Entry key={row.id}>
                <span>{ledgerMemo(content, row.memo)}</span>
                <Amount isGain={row.amounts.RED + row.amounts.VOID >= 0}>{formatPurse(copy, row.amounts, true)}</Amount>
              </Entry>
            ))}
          </Entries>
        </TabPanel>
      </Body>
      <Footer>
        <Note>{copy.privacy}</Note>
        {!isFlying && (isConfirming ? (
          <Actions role="group" aria-label={copy.reset.confirm}>
            <Note>{copy.reset.confirm}</Note>
            <SmallButton type="button" onClick={() => {
              onAct({ kind: "reset" });
              setIsConfirming(false);
            }}>
              {copy.reset.yes}
            </SmallButton>
            <SmallButton type="button" isPrimary onClick={() => setIsConfirming(false)}>{copy.reset.no}</SmallButton>
          </Actions>
        ) : (
          <Actions>
            <SmallButton type="button" onClick={() => setIsConfirming(true)}>{copy.reset.button}</SmallButton>
          </Actions>
        ))}
      </Footer>
    </Panel>
  );
};
