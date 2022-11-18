import tw from "twin.macro";

import { BoxTile } from "@/components/BoxTile";

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`flex flex-row flex-wrap 
relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-r-[0px] 
border-solid border-[rgba(255, 255, 255, 0.07)]`;

const Title = tw.div`relative my-[30px] lg:my-[35px] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const List = tw.div`flex flex-wrap flex-row justify-center lg:w-1/2 h-full`;

export const Resume = ({ education, experience }: any) => (
    <Section id="section-history">
      <Content>
        <List>
          <Title>Experience</Title>
            {
              experience.map((work: any, index: number) => (
                <BoxTile
                  key={`${work.title.replace(/\s/, "")}-${index}`}
                  withRandomBorder={index % 3 === 0}
                  isFullBorder={((work.length - 1 / 2) % 1) > 0 && index === (work.length - 1)}
                  subtitle={work.to ? `${work.from} - ${work.to}` : `${work.from} - Present`}
                  isFullWidth={true}
                  activeSubtitle={!work.to}
                  title={work.title}
                  description={work.description}
                />
              ))
            }
        </List>
        <List>
          <Title>Education</Title>
            {
              education.map((course: any, index: number) => (
                <BoxTile
                  key={`${course.title.replace(/\s/, "")}-${index}`}
                  withRandomBorder={index % 3 === 0}
                  isFullBorder={((course.length - 1 / 2) % 1) > 0 && index === (course.length - 1)}
                  subtitle={course.to ? `${course.from} - ${course.to}` : `${course.from} - Present`}
                  isFullWidth={true}
                  activeSubtitle={!course.to}
                  title={course.title}
                  description={course.description}
                />
              ))
            }
        </List>
      </Content>
    </Section>
  );
