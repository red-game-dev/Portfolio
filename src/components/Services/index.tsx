import { FC } from "react";

import tw from "twin.macro";

import { Panel, PanelTitle } from "@/components/Panel";
import { ServiceCard } from "@/components/Services/ServiceCard";
import { Text } from "@/components/Text";
import { SectionIntros } from "@/types/sections-intros";
import { ServiceActions, ServiceGroup } from "@/types/services";

interface ServicesProps {
  intro: SectionIntros;
  groups: ServiceGroup[];
  actions: ServiceActions;
  email: string;
  linkedInUsername: string;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Groups = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

const Cards = tw.div`grid gap-[18px] lg:grid-cols-2`;

// Grouped panels in the same language as the AI section: the group names the area, the cards inside are the offers.
export const Services: FC<ServicesProps> = ({ intro, groups, actions, email, linkedInUsername }: ServicesProps) => (
  <Section id="section-services">
    <Text title={intro.title} paragraphs={intro.description} isSection={false} />
    <Groups>
      {groups.map((group) => (
        <Panel key={group.label}>
          <PanelTitle>{group.label}</PanelTitle>
          <Cards>
            {group.services.map((service, index) => (
              <ServiceCard
                key={service.title}
                {...service}
                actions={actions}
                email={email}
                linkedInUrl={`https://www.linkedin.com/in/${linkedInUsername}`}
                order={index}
              />
            ))}
          </Cards>
        </Panel>
      ))}
    </Groups>
  </Section>
);
