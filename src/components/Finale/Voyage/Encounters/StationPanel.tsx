import { FC, useEffect, useRef } from "react";

import { faAnchor, faGasPump, faScrewdriverWrench, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { itemName } from "@/components/Finale/Voyage/economy";
import { portName } from "@/components/Finale/Voyage/encounters";
import { PortNote } from "@/components/Finale/Voyage/Encounters/Encounters.styles";
import {
  Actions, Block, Body, Footer, Header, Heading, Item, ItemCount, ItemName, Items, ItemTop, Note, Panel, Purse, RARITY_COLOUR, SmallButton, Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import type { PortView, ServiceId, StationView, VoyageAction } from "@/packages/games/voyage";
import { ITEMS } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface StationPanelProps {
  content: FinaleVoyage;
  station: StationView;
  // The port as the snapshot names it: the world it circles and who keeps it.
  port: PortView;
  onAct: (action: VoyageAction) => boolean;
  onCastOff: () => void;
}

const SERVICE_ICONS = { repair: faScrewdriverWrench, refuel: faGasPump, recharge: faShieldHalved };
const SERVICES: readonly ServiceId[] = ["repair", "refuel", "recharge"];

// A port's trade while the ship is docked there (the run held still): the station's crew to mend, refuel and charge
// the ship, ammunition by the pack, what it has for sale and what it will buy from the hold, each with its price
// against the Red Coin there is to spend; and casting off to fly on.
export const StationPanel: FC<StationPanelProps> = ({ content, station, port, onAct, onCastOff }) => {
  const copy = content.encounters.station;
  const coin = content.economy.symbols.RED;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const name = portName(content, port);
  const price = (amount: number) => `${formatNumber(amount)} ${coin}`;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Panel aria-labelledby="station-heading">
      <Header>
        <Heading id="station-heading" ref={headingRef} tabIndex={-1}>{name}</Heading>
        <Purse>{fill(copy.coin, { coin: price(station.coin) })}</Purse>
      </Header>
      {port.faction && port.kind === "station" && <PortNote>{fill(copy.keptBy, { faction: port.faction })}</PortNote>}
      <Body>
        {station.services.length > 0 && (
          <Block aria-labelledby="station-crew">
            <Subheading id="station-crew">{copy.crew}</Subheading>
            <Items>
              {SERVICES.map((id) => station.services.find((service) => service.id === id)).filter((service) => service !== undefined)
.map((service) => (
                <Item key={service.id}>
                  <ItemTop>
                    <ItemName colour="#ffffff">
                      <FontAwesomeIcon icon={SERVICE_ICONS[service.id]} aria-hidden="true" />
                      {` ${copy.services[service.id]}`}
                    </ItemName>
                  </ItemTop>
                  <Actions>
                    <SmallButton
                      type="button"
                      isPrimary={service.isNeeded}
                      disabled={!service.isNeeded || service.price > station.coin}
                      onClick={() => onAct({ kind: "service", service: service.id })}
                    >
                      {!service.isNeeded ? copy.notNeeded : service.price > station.coin ? copy.tooPoor : fill(copy.buy, { price: price(service.price) })}
                    </SmallButton>
                  </Actions>
                </Item>
              ))}
            </Items>
          </Block>
        )}
        <Block aria-labelledby="station-ammo">
          <Subheading id="station-ammo">{copy.ammo}</Subheading>
          <Items>
            {station.ammo.map((pack) => {
              const isFull = pack.aboard >= pack.rack;

              return (
                <Item key={pack.type}>
                  <ItemTop>
                    <ItemName colour="#c9cfdf">{fill(copy.pack, { count: pack.count, ammo: content.gear.ammo[pack.type] })}</ItemName>
                    <ItemCount>{fill(copy.aboard, { aboard: formatNumber(pack.aboard), rack: formatNumber(pack.rack) })}</ItemCount>
                  </ItemTop>
                  <Actions>
                    <SmallButton
                      type="button"
                      isPrimary={!isFull}
                      disabled={isFull || pack.price > station.coin}
                      onClick={() => onAct({ kind: "buyAmmo", ammo: pack.type })}
                    >
                      {isFull ? copy.racksFull : pack.price > station.coin ? copy.tooPoor : fill(copy.buy, { price: price(pack.price) })}
                    </SmallButton>
                  </Actions>
                </Item>
              );
            })}
          </Items>
        </Block>
        {station.goods.length > 0 && (
          <Block aria-labelledby="station-goods">
            <Subheading id="station-goods">{copy.goods}</Subheading>
            <Items>
              {station.goods.map((good) => (
                <Item key={good.id}>
                  <ItemTop>
                    <ItemName colour={RARITY_COLOUR[ITEMS[good.id]?.rarity ?? "common"]}>{itemName(content.economy, good.id)}</ItemName>
                  </ItemTop>
                  <Note>{content.economy.items[good.id]?.note ?? ""}</Note>
                  <Actions>
                    <SmallButton type="button" isPrimary disabled={good.price > station.coin} onClick={() => onAct({ kind: "buy", item: good.id, count: 1 })}>
                      {good.price > station.coin ? copy.tooPoor : fill(copy.buy, { price: price(good.price) })}
                    </SmallButton>
                  </Actions>
                </Item>
              ))}
            </Items>
          </Block>
        )}
        <Block aria-labelledby="station-sales">
          <Subheading id="station-sales">{copy.sales}</Subheading>
          {station.sales.length === 0 ? <Note>{copy.nothingToSell}</Note> : (
            <Items>
              {station.sales.map((sale) => (
                <Item key={sale.id}>
                  <ItemTop>
                    <ItemName colour={RARITY_COLOUR[ITEMS[sale.id]?.rarity ?? "common"]}>{itemName(content.economy, sale.id)}</ItemName>
                    <ItemCount>{`x${sale.count}, ${fill(copy.each, { price: price(sale.price) })}`}</ItemCount>
                  </ItemTop>
                  <Actions>
                    <SmallButton type="button" onClick={() => onAct({ kind: "sell", item: sale.id, count: 1 })}>{copy.sellOne}</SmallButton>
                    {sale.count > 1 && (
                      <SmallButton type="button" onClick={() => onAct({ kind: "sell", item: sale.id, count: sale.count })}>{copy.sellAll}</SmallButton>
                    )}
                  </Actions>
                </Item>
              ))}
            </Items>
          )}
        </Block>
      </Body>
      <Footer>
        <SmallButton type="button" isPrimary onClick={onCastOff}>
          <FontAwesomeIcon icon={faAnchor} aria-hidden="true" />
          {` ${copy.castOff}`}
        </SmallButton>
      </Footer>
    </Panel>
  );
};

