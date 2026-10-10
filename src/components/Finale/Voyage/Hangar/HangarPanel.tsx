import { FC, useEffect, useRef, useState } from "react";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { slotName } from "@/components/Finale/Voyage/abilities";
import { slotIcon } from "@/components/Finale/Voyage/AbilityBar/icons";
import { codexName, codexNotes, missionName, rankName } from "@/components/Finale/Voyage/career";
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
  LoadoutSlot,
  LoadoutSlots,
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
import { useVoyageSettings } from "@/components/Finale/Voyage/hooks/useVoyageSettings";
import { BarFill, IconButton } from "@/components/Finale/Voyage/VoyageDialog.styles";
import { SettingsPanel } from "@/components/Preferences/SettingsPanel";
import { Tab, TabList } from "@/components/Tabs";
import useTabs from "@/hooks/useTabs";
import type { BarSlot, CareerView, CodexCategory, EconomyView, ShipStats, VoyageAction } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";
import { PreferencesContent } from "@/types/preferences";

// A tab the hangar can be opened on, other than its first.
export type HangarTab = "loadout";

interface HangarPanelProps {
  content: FinaleVoyage;
  settings: PreferencesContent;
  economy: EconomyView;
  career: CareerView | null;
  opensOn?: HangarTab | null;
  isFlying: boolean;
  onAct: (action: VoyageAction) => boolean;
  onClose: () => void;
}

const CODEX_ORDER: readonly CodexCategory[] = ["worlds", "kinds", "universes", "galaxies", "stars", "phenomena", "life", "wrecks", "things", "boosts"];

const LOADOUT_TAB = 2;
// What a thing from the hold looks like in the Loadout, as on the bar.
const ITEM_COLOUR = "#c9cfdf";

const STAT_KEYS: ReadonlyArray<keyof ShipStats> = ["hull", "shields", "fuel", "thrust", "cargo", "plating", "pressure", "guns", "weapon"];

// The hangar: the ship, what it can do and what the next level needs (upgraded in one click); the Loadout, which
// puts boosts and things from the hold on the ability bar; the hold, with
// each thing's use and worth; the plans, made from the hold; and the ledger of every coin earned and spent. Its
// own records, the Void Shard trade and the reset sit beside them. Opening it focuses its heading.
export const HangarPanel: FC<HangarPanelProps> = ({ content, settings, economy, career, opensOn = null, isFlying, onAct, onClose }: HangarPanelProps) => {
  const copy = content.economy;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const careerCopy = content.career;
  const loadout = content.boosts.loadout;
  const tabs = [careerCopy.tabs.pilot, copy.tabs.ship, loadout.tab, copy.tabs.hold, copy.tabs.plans, copy.tabs.ledger, careerCopy.tabs.codex, settings.title];
  const { active, listProps, tabProps, panelProps } = useTabs({ count: tabs.length, initial: opensOn === "loadout" ? LOADOUT_TAB : 0 });
  const voyageSettings = useVoyageSettings();
  const { next, stats } = economy;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const statText = (key: keyof ShipStats, value: ShipStats[keyof ShipStats]) => {
    if (key === "weapon") {
      return copy.weapons[value === "laser" ? "laser" : "cannon"];
    }

    const text = typeof value === "number" ? formatNumber(value) : String(value);

    return key === "plating" ? fill(copy.units.celsius, { value: text }) : key === "pressure" ? fill(copy.units.bar, { value: text }) :
      key === "thrust" ? fill(copy.units.times, { value: text }) : text;
  };
  const have = (id: string) => economy.cargo.find((row) => row.id === id)?.count ?? 0;
  // A slot button for something that can go on the bar: pressed where it already sits, which empties that slot.
  const slotButtons = (slot: BarSlot, name: string) => (
    <Actions role="group" aria-label={name}>
      {economy.bar.map((row, index) => {
        const isThere = row.slot?.kind === slot.kind && row.slot.id === slot.id;

        return (
          <SmallButton
            key={index}
            type="button"
            isPrimary={isThere}
            aria-pressed={isThere}
            aria-label={fill(loadout.putLabel, { name, n: index + 1 })}
            onClick={() => onAct({ kind: "setSlot", index, slot: isThere ? null : slot })}
          >
            {fill(loadout.put, { n: index + 1 })}
          </SmallButton>
        );
      })}
    </Actions>
  );
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
          <span>{`${formatNumber(economy.purse.RED)} ${copy.symbols.RED}`}</span>
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
          {career && (
            <>
              <div>
                <ShipName>{rankName(content, career.rankId)}</ShipName>
                <Note>
                  {fill(careerCopy.xp, { xp: formatNumber(career.xp) })}
                  {", "}
                  {career.nextRank
                    ? fill(careerCopy.nextRank, { xp: formatNumber(career.nextRank.xp - career.xp), rank: rankName(content, career.nextRank.id) })
                    : careerCopy.topRank}
                </Note>
                <Meter
                  role="meter"
                  aria-label={rankName(content, career.rankId)}
                  aria-valuemin={career.rankFloor}
                  aria-valuemax={career.nextRank?.xp ?? career.xp}
                  aria-valuenow={career.xp}
                >
                  <BarFill
                    colour="#ffd76a"
                    style={{ transform: `scaleX(${career.nextRank ? (career.xp - career.rankFloor) / Math.max(1, career.nextRank.xp - career.rankFloor) : 1})` }}
                  />
                </Meter>
              </div>
              <Subheading>{careerCopy.missionsTitle}</Subheading>
              <Items>
                {career.missions.map(({ mission, progress, target }) => (
                  <Item key={mission.id}>
                    <ItemTop>
                      <ItemName colour="#ffffff">{missionName(content, mission.id)}</ItemName>
                      <ItemCount>{fill(careerCopy.progress, { progress, target })}</ItemCount>
                    </ItemTop>
                    <Meter role="meter" aria-label={missionName(content, mission.id)} aria-valuemin={0} aria-valuemax={target} aria-valuenow={progress}>
                      <BarFill colour="#7dffcf" style={{ transform: `scaleX(${target > 0 ? progress / target : 0})` }} />
                    </Meter>
                    <Note>{fill(mission.coin > 0 ? careerCopy.reward : careerCopy.rewardXp, { xp: mission.xp, coin: mission.coin })}</Note>
                  </Item>
                ))}
              </Items>
              <Note>{fill(careerCopy.done, { count: career.done })}</Note>
            </>
          )}
        </TabPanel>
        <TabPanel {...panelProps(1)}>
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
                  <StatValue>{formatNumber(value)}</StatValue>
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
        <TabPanel {...panelProps(LOADOUT_TAB)}>
          <Note>{loadout.note}</Note>
          <Block aria-labelledby="loadout-slots">
            <Subheading id="loadout-slots">{loadout.slots}</Subheading>
            <LoadoutSlots>
              {economy.bar.map((row, index) => (
                <LoadoutSlot key={row.slot ? `${row.slot.kind}:${row.slot.id}` : `empty:${index}`} colour={row.colour ?? ITEM_COLOUR}>
                  <span aria-hidden="true">{index + 1}</span>
                  {row.slot ? (
                    <>
                      <FontAwesomeIcon icon={slotIcon(row.slot)} aria-hidden="true" />
                      <span>{`${slotName(content, row.slot)}, x${row.count}`}</span>
                      <SmallButton type="button" onClick={() => onAct({ kind: "setSlot", index, slot: null })}>
                        {fill(loadout.clear, { n: index + 1 })}
                      </SmallButton>
                    </>
                  ) : (
                    <span>{fill(content.boosts.bar.empty, { n: index + 1 })}</span>
                  )}
                </LoadoutSlot>
              ))}
            </LoadoutSlots>
          </Block>
          <Block aria-labelledby="loadout-boosts">
            <Subheading id="loadout-boosts">{loadout.boosts}</Subheading>
            {economy.boosts.length === 0 && <Note>{loadout.none}</Note>}
            <Items>
              {economy.boosts.map((boost) => {
                const name = content.boosts.names[boost.id];
                const standing = `${fill(content.boosts.bar.level, { level: boost.level })}, ${fill(loadout.charges, { count: boost.charges, max: boost.max })}`;

                return (
                  <Item key={boost.id}>
                    <ItemTop>
                      <ItemName colour={boost.colour}>
                        <FontAwesomeIcon icon={slotIcon({ kind: "boost", id: boost.id })} aria-hidden="true" />
                        {` ${name}`}
                      </ItemName>
                      <ItemCount>{standing}</ItemCount>
                    </ItemTop>
                    <Note>{content.boosts.notes[boost.id]}</Note>
                    <Note>
                      {boost.nextAt === null
                        ? fill(loadout.top, { finds: boost.finds })
                        : fill(loadout.progress, { finds: boost.finds, next: boost.nextAt, level: boost.level + 1 })}
                    </Note>
                    {slotButtons({ kind: "boost", id: boost.id }, name)}
                  </Item>
                );
              })}
            </Items>
          </Block>
          <Block aria-labelledby="loadout-things">
            <Subheading id="loadout-things">{loadout.things}</Subheading>
            <Items>
              {economy.cargo.filter((row) => row.isUsable).map((row) => (
                <Item key={row.id}>
                  <ItemTop>
                    <ItemName colour={RARITY_COLOUR[row.rarity]}>{itemName(copy, row.id)}</ItemName>
                    <ItemCount>{`x${row.count}`}</ItemCount>
                  </ItemTop>
                  {slotButtons({ kind: "item", id: row.id }, itemName(copy, row.id))}
                </Item>
              ))}
            </Items>
          </Block>
        </TabPanel>
        <TabPanel {...panelProps(3)}>
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
        <TabPanel {...panelProps(4)}>
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
        <TabPanel {...panelProps(5)}>
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
        <TabPanel {...panelProps(6)}>
          {career && (
            <>
              <Note>{fill(careerCopy.codexFound, { found: career.found, total: career.codex.length })}</Note>
              {CODEX_ORDER.map((category) => {
                const entries = career.codex.filter(({ entry }) => entry.category === category);
                const found = entries.filter(({ isFound }) => isFound);

                return (
                  <Block key={category} aria-labelledby={`codex-${category}`}>
                    <Subheading id={`codex-${category}`}>{careerCopy.categories[category]}</Subheading>
                    {found.length > 0 && (
                      <Items>
                        {found.map(({ entry }) => (
                          <Item key={entry.id}>
                            <ItemName colour="#ffffff">{codexName(content, entry)}</ItemName>
                            {codexNotes(content, entry).map((line) => <Note key={line}>{line}</Note>)}
                          </Item>
                        ))}
                      </Items>
                    )}
                    {found.length < entries.length && <Note>{fill(careerCopy.unknown, { count: entries.length - found.length })}</Note>}
                  </Block>
                );
              })}
            </>
          )}
        </TabPanel>
        <TabPanel {...panelProps(7)}>
          <SettingsPanel copy={settings} names={voyageSettings.names} onPick={voyageSettings.onPick} />
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
