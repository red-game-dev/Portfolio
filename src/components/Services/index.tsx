import tw from "twin.macro";

import { BoxTile } from "@/components/BoxTile";
import { Text } from "@/components/Text";
import { SectionIntros } from "@/types/sections-intros";
import { Service } from "@/types/services";

interface ServicesProps {
  services: Service[];
  intro: SectionIntros;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010] 
border-[1px] border-r-[0px] border-solid border-[#1E1E1E] border-t-[transparent]`;

const ClearContainer = tw.div`clear-both`;

const List = tw.div`flex flex-wrap flex-row justify-center`;

export const Services = ({ services = [], intro }: ServicesProps) => (
    <Section id="section-services">
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Content>
        <List>
          {services.map((service: Service, index: number) => (
            <BoxTile
              key={`${service.title.replace(/\s/, "")}-${index}`}
              withRandomBorder={index % 3 === 0}
              isFullBorder={((services.length - 1 / 2) % 1) > 0 && index === (services.length - 1)}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </List>
        <ClearContainer />
      </Content>
    </Section>
);
