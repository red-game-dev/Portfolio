import tw from "twin.macro";

import { BoxTile } from "@/components/BoxTile";

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] border-solid border-[rgba(255, 255, 255, 0.07)]`;

const Title = tw.div`relative m-[0 0 30px 0] lg:m-[0 0 35px 35px] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const ClearContainer = tw.div`clear-both`;

const List = tw.div`flex flex-wrap flex-row justify-center`;

export const Services = ({ services = [] }: any) => (
    <Section id="section-services">
      <Title>Services</Title>
      <Content>
        <List>
          {services.map((service: any, index: number) => (
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
