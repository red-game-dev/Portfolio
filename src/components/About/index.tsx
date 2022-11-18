import { FC } from "react";

import tw, { styled } from "twin.macro";

import Image from "next/image";
import Link from "next/link";

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010] border-solid border-l-[1px] border-[#4bffa5]`;

const Title = tw.div`relative m-[0 0 30px 0] lg:m-[0 0 35px 35px] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const SectionImage = styled(Image)(() => [
  tw`float-left mr-[17px] ml-[9px] lg:mr-0 lg:ml-0 w-[160px] text-[0px]`
]);

const DescriptionContainer = tw.div`ml-[10px] lg:ml-[195px]`;

const Paragraph = styled.div(() => [
  tw`break-words first:mt-0`,
]);

const List = tw.ul`list-none m-0 p-0 my-[20px]`;

const ListItem = tw.li`inline-block align-top w-full lg:w-1/2 m-[0 0 6px 0] [&>strong]:font-normal [&>strong]:text-[#4bffa5]`;

const ClearContainer = tw.div`clear-both`;

const Button = styled(Link)(() => [
  tw`relative bg-transparent font-medium border-2 cursor-pointer border-solid no-underline overflow-hidden 
     inline-block align-middle text-center text-sm lg:text-base leading-9 lg:leading-9`,
  tw`h-[44px] my-[0px] mx-[0.5rem] mb-[10px] text-[#4bffa5] border-[#101010] border-r-[#4bffa5]
     hover:text-white 
     before:content=['']
     before:absolute
     before:w-[0px]
     before:h-[0px]
     before:bg-[#3ebf69]
     hover:animate-[border-transition 1s ease-out 0s infinite]
     hover:before:transition-[5s all linear]
     hover:before:h-full
     hover:before:w-full`
]);

const InnerButtonText = tw.div`relative py-0 px-7 block z-[2] pointer-events-none`;

const AnimatedCircle = tw.div`absolute w-full h-full block`;

interface AboutProps {
  description: string;
  residence: string;
  isFlexible: boolean;
  jobType: string;
  phone: string;
  email: string;
}

export const About: FC<AboutProps> = ({ description, residence, isFlexible, jobType, phone, email }: AboutProps) => (
    <Section id="section-about">
      <Title>About</Title>
      <Content>
        <SectionImage src="/images/man_r.jpg" alt="" width="200" height="200" />
        <DescriptionContainer>
          <Paragraph>{ description }</Paragraph>
          <List >
            <ListItem>
              <strong>Residence:</strong> { residence }
            </ListItem>
            <ListItem>
              <strong>Job seeking:</strong> { isFlexible ? "Flexible" : "Immediately" }
            </ListItem>
            <ListItem>
              <strong>Job Type:</strong> { jobType }
            </ListItem>
            <ListItem>
              <strong>Phone:</strong>{ phone }
            </ListItem>
            <ListItem>
              <strong>E-mail:</strong> { email }
            </ListItem>
          </List>
          <div>
            <Button href="#">
              <AnimatedCircle />
              <InnerButtonText>Download CV</InnerButtonText>
            </Button>
            <Button href="#">
              <AnimatedCircle />
              <InnerButtonText>LinkedIn</InnerButtonText>
            </Button>
          </div>
        </DescriptionContainer>
        <ClearContainer />
      </Content>
    </Section>
  );