import { FC } from "react";

import { itemName, shipName } from "@/components/Finale/Voyage/economy";
import {
  Actions,
  Block,
  Frame,
  Need,
  Needs,
  Note,
  ShipName,
  SmallButton,
  StatName,
  StatNext,
  StatRow,
  Stats,
  StatValue,
  Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { ShipSheet } from "@/components/Finale/Voyage/Hangar/ShipSheet";
import { CurrencyIcon, fillNodes, Money } from "@/components/Finale/Voyage/Money";
import type { ArmoryView, EconomyView, ProgressView, ShipStats, VoyageAction } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

const STAT_KEYS: ReadonlyArray<keyof ShipStats> = ["hull", "shields", "fuel", "thrust", "cargo", "plating", "pressure", "guns", "weapon"];

interface SheetProps {
  content: FinaleVoyage;
  economy: EconomyView;
  gear: ArmoryView | null;
  progress: ProgressView | null;
  drawShip: (context: CanvasRenderingContext2D, width: number, height: number) => void;
  onAct: (action: VoyageAction) => boolean;
}

// The ship: its sheet of fittings, what it can do and what the next level makes of it, the next level framed with
// everything it takes (upgraded in one press), the pilot's records, and the Void Shard trade.
export const Sheet: FC<SheetProps> = ({ content, economy, gear, progress, drawShip, onAct }) => {
  const copy = content.economy;
  const { next, stats } = economy;
  const have = (id: string) => economy.cargo.find((row) => row.id === id)?.count ?? 0;
  const statText = (key: keyof ShipStats, value: ShipStats[keyof ShipStats]) => {
    if (key === "weapon") {
      return copy.weapons[value === "laser" ? "laser" : "cannon"];
    }

    const text = typeof value === "number" ? formatNumber(value) : String(value);

    return key === "plating" ? fill(copy.units.celsius, { value: text }) : key === "pressure" ? fill(copy.units.bar, { value: text }) :
      key === "thrust" ? fill(copy.units.times, { value: text }) : text;
  };
  const records: Array<[string, number]> = [
    [copy.records.runs, economy.records.runs],
    [copy.records.best, economy.records.bestScore],
    [copy.records.universes, economy.records.universes],
    [copy.records.bosses, economy.records.bosses],
    [copy.records.rescues, economy.records.rescues],
    [copy.records.salvaged, economy.records.salvaged],
  ];

  return (
    <>
      {gear && <ShipSheet content={content} economy={economy} gear={gear} progress={progress} drawShip={drawShip} onAct={onAct} />}
      <Block>
        {!gear && <ShipName>{shipName(copy, economy.tier, economy.mark)}</ShipName>}
        <Note>{copy.tierNotes[economy.tier]}</Note>
        <Stats>
          {STAT_KEYS.map((key) => (
            <StatRow key={key}>
              <StatName>{copy.stats[key]}</StatName>
              <StatValue>{statText(key, stats[key])}</StatValue>
              <StatNext>{next && next.stats[key] !== stats[key] ? statText(key, next.stats[key]) : ""}</StatNext>
            </StatRow>
          ))}
        </Stats>
      </Block>
      {next ? (
        <Frame aria-labelledby="hangar-next">
          <Subheading id="hangar-next">{fill(copy.next, { ship: shipName(copy, next.tier, next.mark) })}</Subheading>
          {next.tier !== economy.tier && <Note>{copy.tierNotes[next.tier]}</Note>}
          <Needs aria-label={copy.needs}>
            <Need isMet={next.shortfall.coin.RED === 0}>
              <span>
                <CurrencyIcon code="RED" label={copy.currencies.RED} isDecorative />
                {` ${copy.currencies.RED}`}
              </span>
              <span>{fill(copy.have, { have: economy.purse.RED, need: next.cost.coin.RED })}</span>
            </Need>
            {next.cost.coin.VOID > 0 && (
              <Need isMet={next.shortfall.coin.VOID === 0}>
                <span>
                  <CurrencyIcon code="VOID" label={copy.currencies.VOID} isDecorative />
                  {` ${copy.currencies.VOID}`}
                </span>
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
        </Frame>
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
        <Actions>
          <SmallButton type="button" disabled={economy.purse.VOID < 1} onClick={() => onAct({ kind: "trade", direction: "sell" })}>
            {fillNodes(copy.trade.sell, { price: <Money copy={copy} amount={economy.prices.sell} /> })}
          </SmallButton>
          <SmallButton type="button" disabled={economy.purse.RED < economy.prices.buy} onClick={() => onAct({ kind: "trade", direction: "buy" })}>
            {fillNodes(copy.trade.buy, { price: <Money copy={copy} amount={economy.prices.buy} /> })}
          </SmallButton>
        </Actions>
      </Block>
    </>
  );
};
