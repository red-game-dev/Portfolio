import { FC, useRef } from "react";

import tw, { styled } from "twin.macro";

import { faLinkedinIn, faGoogleDrive, faGithub, faStackOverflow } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { DecodedText } from "@/components/DecodedText";
import { Image } from "@/components/Image";
import useInView from "@/hooks/useInView";
import { Detail } from "@/types/details";
import { Github } from "@/types/general";

interface AboutProps extends Detail {
  linkedInUsername: string;
  cvUrl: string;
  github: Github[];
  location: string;
  stackoverflow: string;
}


const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] md:p-[25px] lg:p-[35px] bg-[#101010] border-solid border-l-[1px] border-[var(--accent)]`;

const Title = tw.h2`relative m-[0 0 30px 0] lg:m-[0 0 35px 35px] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const SectionImage = styled(Image)(() => [
  tw`float-left mr-[17px] ml-[9px] lg:mr-0 lg:ml-0 w-[160px] text-[0px]`
]);

const DescriptionContainer = tw.div`ml-[10px] lg:ml-[195px]`;

const Paragraph = styled.div(() => [
  tw`break-words first:mt-0 first:mb-3 first:text-center`,
]);

const List = tw.ul`list-none m-0 p-0 my-[20px]`;

const ListItem = tw.li`inline-block align-top w-full lg:w-1/2 m-[0 0 6px 0] [&>strong]:font-normal [&>strong]:text-[var(--accent)]`;

const ClearContainer = tw.div`clear-both`;

const ButtonsContainer = tw.div`flex flex-row flex-wrap text-center justify-center`;

const Button = styled(Link)(() => [
  tw`relative w-full lg:w-24 bg-transparent font-medium border-2 cursor-pointer border-solid no-underline overflow-hidden 
     inline-block align-middle text-center text-sm lg:text-base leading-9 lg:leading-9`,
  tw`h-[44px] my-[0px] mx-[0.5rem] lg:ml-0 mb-[10px] text-[var(--accent)] border-[#101010] border-r-[var(--accent)]
     hover:text-white 
     before:content=['']
     before:absolute
     before:w-[0px]
     before:h-[0px]
     before:bg-[#3ebf69]
     before:left-0
     hover:before:text-white
     hover:animate-[border-transition 1s ease-out 0s infinite]
     hover:before:transition-[5s all linear]
     hover:before:h-full
     hover:before:w-full`
]);

const InnerButtonText = tw.span`relative z-[2] pointer-events-none before:pr-2`;

const InnerButtonIcon = styled(FontAwesomeIcon)(() => [
  tw`relative z-[2] pointer-events-none before:pr-2`
]);

const AnimatedCircle = tw.div`absolute w-full h-full block`;

// The bio decodes from binary once the section is on screen: the Matrix zone's way of saying hello.
const DESCRIPTION_DECODE_MS = 2600;

export const About: FC<AboutProps> = ({
  name, intro, description, image, residence,
  isFlexible, jobType, phone, email, location,
  contactTime, cvUrl, github, stackoverflow, linkedInUsername
}: AboutProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { threshold: 0.2 });

  return (
    <Section id="section-about">
      <Title>Who I am?</Title>
      <Content ref={contentRef}>
        <SectionImage src={image} alt={`${name}, ${intro}`} width="200" height="500" fallbackSrc={image.replace(".webp", ".jpg")} />
        <DescriptionContainer>
          <Paragraph>
            <DecodedText text={intro} isActive={isInView} />
          </Paragraph>
          <Paragraph>
            <DecodedText text={description.trim().replace(/\s+/g, " ")} isActive={isInView} delay={300} duration={DESCRIPTION_DECODE_MS} />
          </Paragraph>
          <List >
            <ListItem>
              <strong>Residence:</strong> {residence}
            </ListItem>
            <ListItem>
              <strong>Seeking:</strong> {isFlexible ? "Flexible" : "Immediately"}
            </ListItem>
            <ListItem>
              <strong>Location:</strong> {location}
            </ListItem>
            <ListItem>
              <strong>Type:</strong> {jobType}
            </ListItem>
            <ListItem>
              <strong>Phone:</strong>{phone}
            </ListItem>
            <ListItem>
              <strong>E-mail:</strong> {email}
            </ListItem>
            <ListItem>
              <strong>Contact Time:</strong> {contactTime}
            </ListItem>
          </List>
        </DescriptionContainer>
          <ButtonsContainer>
            <Button href={cvUrl} target="_blank" aria-label="Download My CV">
              <AnimatedCircle />
              <InnerButtonIcon icon={faGoogleDrive} /> {" "}
              <InnerButtonText>
                CV
              </InnerButtonText>
            </Button>
            <Button href={`https://www.linkedin.com/in/${linkedInUsername}`} target="_blank" aria-label="View LinkedIn">
              <AnimatedCircle />
              <InnerButtonIcon icon={faLinkedinIn} />
            </Button>
            {
              github.map(({ name: repoName, link }, index: number) => (
                <Button key={`github-${index}`} href={link} target="_blank" aria-label={`Github ${repoName}`}>
                  <AnimatedCircle />
                  <InnerButtonIcon icon={faGithub} /> {" "}
                  <InnerButtonText>
                    {repoName}
                  </InnerButtonText>
                </Button>
              ))
            }
            <Button href={stackoverflow} target="_blank" aria-label="View StackOverflow">
              <AnimatedCircle />
              <InnerButtonIcon icon={faStackOverflow} />
            </Button>
          </ButtonsContainer>
        <ClearContainer />
      </Content>
    </Section>
  );
};
