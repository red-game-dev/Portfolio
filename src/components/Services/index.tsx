import { FC, useCallback, useEffect, useMemo, useRef } from "react";

import tw, { styled } from "twin.macro";

import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Panel, PanelTitle } from "@/components/Panel";
import { Anchor, Section } from "@/components/Section";
import { ServiceCard } from "@/components/Services/ServiceCard";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { Tab, TabCount, TabList } from "@/components/Tabs";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
import { useHashValue } from "@/hooks/useHashState";
import useTabs from "@/hooks/useTabs";
import { honourHidden } from "@/styles/mixins";
import { SectionIntros } from "@/types/sections-intros";
import { ServiceActions, ServiceGroup } from "@/types/services";

interface ServicesProps {
  intro: SectionIntros;
  groups: ServiceGroup[];
  actions: ServiceActions;
  email: string;
  linkedInUsername: string;
  // The group the product view leads with.
  productGroup: string;
}

const Tabs = tw.div`mt-[25px] lg:mt-[35px]`;

const Groups = styled(SwitchStage)`
  ${tw`mt-[18px]`}
`;

const Group = styled(Panel)`
  ${honourHidden}
`;

const Cards = tw.div`grid gap-[18px] lg:grid-cols-2`;

const isProductHash = (hash: string): true | null => (hash === `#${ROLE_ANCHORS.product}` ? true : null);

// Grouped panels in the same language as the AI section: the group names the area, the cards inside are the offers.
// One group is open at a time, so the offer reads in a screen or two; every group stays in the page, the closed ones
// hidden, so search engines and find in page still reach every offer.
export const Services: FC<ServicesProps> = ({ intro, groups, actions, email, linkedInUsername, productGroup }: ServicesProps) => {
  const { lens } = useLensStateHook();
  const ordered = useMemo(() => (lens === "product"
    ? [...groups].sort((first, second) => Number(second.label === productGroup) - Number(first.label === productGroup))
    : groups), [groups, lens, productGroup]);
  const switcher = useSwitch();
  const { play } = switcher;
  const onSelect = useCallback((next: number, previous: number) => play(next > previous ? 1 : -1), [play]);
  const { active, select, listProps, tabProps, panelProps } = useTabs({ count: ordered.length, onSelect });
  // The first screen's product engineering link lands here open on the product group.
  const isProductLink = useHashValue(isProductHash);
  const selectRef = useRef(select);

  selectRef.current = select;

  useEffect(() => {
    if (isProductLink) {
      selectRef.current(Math.max(0, ordered.findIndex((group) => group.label === productGroup)));
    }
  }, [isProductLink, ordered, productGroup]);

  return (
    <Section id={SECTION_IDS.services}>
      <Anchor id={ROLE_ANCHORS.product} aria-hidden="true" />
      <SectionText intro={intro} />
      <Tabs>
        <TabList {...listProps} layout="wrap" aria-label={intro.title} data-scroll-x>
          {ordered.map((group, index) => (
            <Tab key={group.label} {...tabProps(index)} isOn={index === active}>
              <span>{group.label}</span>
              <TabCount isOn={index === active} aria-hidden="true">{group.services.length}</TabCount>
            </Tab>
          ))}
        </TabList>
      </Tabs>
      <Groups switcher={switcher}>
        {ordered.map((group, index) => (
          <Group key={group.label} {...panelProps(index)}>
            <PanelTitle>{group.label}</PanelTitle>
            <Cards>
              {group.services.map((service, position) => (
                <ServiceCard
                  key={service.title}
                  {...service}
                  actions={actions}
                  email={email}
                  linkedInUrl={SOCIAL_URLS.linkedIn(linkedInUsername)}
                  order={position}
                />
              ))}
            </Cards>
          </Group>
        ))}
      </Groups>
    </Section>
  );
};
