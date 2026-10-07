import { FC } from "react";

import tw from "twin.macro";

import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Panel, PanelTitle } from "@/components/Panel";
import { Anchor, Section } from "@/components/Section";
import { ServiceCard } from "@/components/Services/ServiceCard";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
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

const Groups = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

const Cards = tw.div`grid gap-[18px] lg:grid-cols-2`;

// Grouped panels in the same language as the AI section: the group names the area, the cards inside are the offers.
export const Services: FC<ServicesProps> = ({ intro, groups, actions, email, linkedInUsername, productGroup }: ServicesProps) => {
  const { lens } = useLensStateHook();
  const ordered = lens === "product"
    ? [...groups].sort((first, second) => Number(second.label === productGroup) - Number(first.label === productGroup))
    : groups;

  return (
    <Section id={SECTION_IDS.services}>
      <Anchor id={ROLE_ANCHORS.product} aria-hidden="true" />
      <SectionText intro={intro} />
      <Groups>
        {ordered.map((group) => (
          <Panel key={group.label}>
            <PanelTitle>{group.label}</PanelTitle>
            <Cards>
              {group.services.map((service, index) => (
                <ServiceCard
                  key={service.title}
                  {...service}
                  actions={actions}
                  email={email}
                  linkedInUrl={SOCIAL_URLS.linkedIn(linkedInUsername)}
                  order={index}
                />
              ))}
            </Cards>
          </Panel>
        ))}
      </Groups>
    </Section>
  );
};
