import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { faAnchor, faGasPump, faScrewdriverWrench, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { itemName } from "@/components/Finale/Voyage/economy";
import { portName } from "@/components/Finale/Voyage/encounters";
import { PortNote } from "@/components/Finale/Voyage/Encounters/Encounters.styles";
import {
  Actions,
  Body,
  Dot,
  Footer,
  Frame,
  GroupTop,
  Header,
  Heading,
  Item,
  ItemCount,
  ItemName,
  Items,
  ItemTop,
  Meter,
  Note,
  Panel,
  PurseText,
  RARITY_COLOUR,
  SectionBar,
  SmallButton,
  Subheading,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { fillNodes, Money } from "@/components/Finale/Voyage/Money";
import { BarFill } from "@/components/Finale/Voyage/VoyageDialog.styles";
import { Tab, TabList } from "@/components/Tabs";
import useTabs from "@/hooks/useTabs";
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

type Section = "crew" | "ammo" | "market" | "sell";

const SERVICE_ICONS = { repair: faScrewdriverWrench, refuel: faGasPump, recharge: faShieldHalved };
const SERVICES: readonly ServiceId[] = ["repair", "refuel", "recharge"];
const AMMO_COLOUR = "#c9cfdf";

const Hidden = tw.span`sr-only`;

// A port's trade while the ship is docked there (the run held still), as the hangar's flight deck: the coin there is
// to spend, then a row of sections, only those the port has: its crew (mend, refuel, charge, each framed with its
// price; marked when the ship needs one it can pay for), ammunition by the pack with how full each rack is, what it
// has for sale, and what it will buy from the hold. Casting off to fly on stays at the foot.
export const StationPanel: FC<StationPanelProps> = ({ content, station, port, onAct, onCastOff }) => {
  const copy = content.encounters.station;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const name = portName(content, port);
  const price = (amount: number) => <Money copy={content.economy} amount={amount} />;
  const services = SERVICES.map((id) => station.services.find((service) => service.id === id)).filter((service) => service !== undefined);
  const sections: Section[] = [...(services.length > 0 ? ["crew" as const] : []), "ammo", ...(station.goods.length > 0 ? ["market" as const] : []), "sell"];
  const { active, listProps, tabProps, panelProps } = useTabs({ count: sections.length });
  const isCrewReady = services.some((service) => service.isNeeded && service.price <= station.coin);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // A purchase: its price where it can be paid, else why not.
  const buyLabel = (cost: number, blocked: string | null) => blocked ?? (cost > station.coin ? copy.tooPoor : fillNodes(copy.buy, { price: price(cost) }));

  const section = (id: Section) => {
    switch (id) {
      case "crew":
        return (
          <Frame aria-labelledby="station-crew">
            <Subheading id="station-crew">{copy.crew}</Subheading>
            <Items>
              {services.map((service) => (
                <Item key={service.id}>
                  <GroupTop>
                    <ItemName colour={service.isNeeded ? "#ffffff" : "#8a93ab"}>
                      <FontAwesomeIcon icon={SERVICE_ICONS[service.id]} aria-hidden="true" />
                      {` ${copy.services[service.id]}`}
                    </ItemName>
                    <SmallButton
                      type="button"
                      isPrimary={service.isNeeded && service.price <= station.coin}
                      disabled={!service.isNeeded || service.price > station.coin}
                      onClick={() => onAct({ kind: "service", service: service.id })}
                    >
                      {buyLabel(service.price, service.isNeeded ? null : copy.notNeeded)}
                    </SmallButton>
                  </GroupTop>
                </Item>
              ))}
            </Items>
          </Frame>
        );
      case "ammo":
        return (
          <Items>
            {station.ammo.map((pack) => {
              const isFull = pack.aboard >= pack.rack;

              return (
                <Item key={pack.type}>
                  <ItemTop>
                    <ItemName colour={AMMO_COLOUR}>{fill(copy.pack, { count: pack.count, ammo: content.gear.ammo[pack.type] })}</ItemName>
                    <ItemCount>{fill(copy.aboard, { aboard: formatNumber(pack.aboard), rack: formatNumber(pack.rack) })}</ItemCount>
                  </ItemTop>
                  <Meter role="meter" aria-label={content.gear.ammo[pack.type]} aria-valuemin={0} aria-valuemax={pack.rack} aria-valuenow={pack.aboard}>
                    <BarFill colour="var(--tab-accent)" style={{ transform: `scaleX(${pack.rack > 0 ? Math.min(1, pack.aboard / pack.rack) : 0})` }} />
                  </Meter>
                  <Actions>
                    <SmallButton
                      type="button"
                      isPrimary={!isFull && pack.price <= station.coin}
                      disabled={isFull || pack.price > station.coin}
                      onClick={() => onAct({ kind: "buyAmmo", ammo: pack.type })}
                    >
                      {buyLabel(pack.price, isFull ? copy.racksFull : null)}
                    </SmallButton>
                  </Actions>
                </Item>
              );
            })}
          </Items>
        );
      case "market":
        return (
          <Items>
            {station.goods.map((good) => (
              <Item key={good.id}>
                <ItemTop>
                  <ItemName colour={RARITY_COLOUR[ITEMS[good.id]?.rarity ?? "common"]}>{itemName(content.economy, good.id)}</ItemName>
                  <ItemCount>{price(good.price)}</ItemCount>
                </ItemTop>
                <Note>{content.economy.items[good.id]?.note ?? ""}</Note>
                <Actions>
                  <SmallButton
                    type="button"
                    isPrimary={good.price <= station.coin}
                    disabled={good.price > station.coin}
                    onClick={() => onAct({ kind: "buy", item: good.id, count: 1 })}
                  >
                    {buyLabel(good.price, null)}
                  </SmallButton>
                </Actions>
              </Item>
            ))}
          </Items>
        );
      default:
        return station.sales.length === 0 ? <Note>{copy.nothingToSell}</Note> : (
          <Items>
            {station.sales.map((sale) => (
              <Item key={sale.id}>
                <ItemTop>
                  <ItemName colour={RARITY_COLOUR[ITEMS[sale.id]?.rarity ?? "common"]}>{itemName(content.economy, sale.id)}</ItemName>
                  <ItemCount>
                    {`x${sale.count}, `}
                    {fillNodes(copy.each, { price: price(sale.price) })}
                  </ItemCount>
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
        );
    }
  };

  return (
    <Panel aria-labelledby="station-heading">
      <Header>
        <Heading id="station-heading" ref={headingRef} tabIndex={-1}>{name}</Heading>
        <PurseText>{fillNodes(copy.coin, { coin: price(station.coin) })}</PurseText>
      </Header>
      {port.faction && port.kind === "station" && <PortNote>{fill(copy.keptBy, { faction: port.faction })}</PortNote>}
      <SectionBar data-scroll-x>
        <TabList {...listProps} aria-label={name}>
          {sections.map((id, index) => (
            <Tab key={id} {...tabProps(index)} isOn={index === active}>
              {copy.tabs[id]}
              {id === "crew" && isCrewReady && (
                <>
                  <Dot colour="#ffd76a" isCorner aria-hidden="true" />
                  <Hidden>{`, ${copy.ready}`}</Hidden>
                </>
              )}
            </Tab>
          ))}
        </TabList>
      </SectionBar>
      <Body>
        {sections.map((id, index) => (
          <div key={id} {...panelProps(index)}>
            {section(id)}
          </div>
        ))}
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
