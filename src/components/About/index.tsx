import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { faLinkedinIn, faGoogleDrive, faGithub, faStackOverflow } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { Portrait } from "@/components/About/Portrait";
import { DecodedText } from "@/components/DecodedText";
import useInView from "@/hooks/useInView";
import { Detail } from "@/types/details";
import { Github } from "@/types/general";

interface AboutProps extends Detail {
  linkedInUsername: string;
  cvUrl: string;
  github: Github[];
  stackoverflow: string;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] p-[22px] md:p-[25px] lg:p-[35px] bg-[#101010] border-solid border-l-[1px] border-[var(--accent)]`;

const Title = tw.h2`relative m-[0 0 30px 0] lg:m-[0 0 35px 35px] inline-block align-top text-2xl font-semibold text-white`;

// The portrait beside the hook on wide screens, above it on phones.
const Top = styled.div(() => [
  tw`grid gap-[22px]`,
  css`
    @media (min-width: 768px) {
      grid-template-columns: 160px minmax(0, 1fr);
      gap: 30px;
    }
  `,
]);

const Lead = tw.div`flex flex-col gap-[14px] min-w-0`;

const Tag = tw.p`m-0 text-sm font-semibold text-[var(--accent)]`;

const Hook = tw.p`m-0 text-xl md:text-2xl font-semibold leading-snug text-white break-words`;

const Paragraph = tw.p`m-0 text-[#ccc] break-words max-w-[70ch]`;

const Proof = tw.dl`m-0 mt-[28px] grid grid-cols-2 md:grid-cols-5 gap-[10px]`;

const Figure = tw.div`flex flex-col gap-[6px] p-[12px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const FigureValue = tw.dd`m-0 order-first text-2xl font-bold leading-none text-[var(--accent)]`;

const FigureLabel = tw.dt`text-xs text-[#bbb]`;

const Facts = tw.ul`list-none m-0 mt-[18px] mb-[26px] p-0 flex flex-row flex-wrap gap-[8px]`;

const Fact = tw.li`text-xs leading-none text-white bg-[#1d1d1d] rounded-full py-[7px] px-[11px] border-[1px] border-solid border-[var(--accent-muted)]`;

const Contact = tw.p`m-0 mb-[22px] text-sm text-[#bbb] [& > a]:text-[var(--accent)] [& > a]:no-underline`;

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

// The hook and the bio decode from binary once the section is on screen: the Matrix zone's way of saying hello.
const HOOK_DECODE_MS = 1600;
const PARAGRAPH_DELAY_MS = 260;
// Long paragraphs would take seconds at the per character pace, so each is capped.
const PARAGRAPH_DECODE_MS = 1400;

export const About: FC<AboutProps> = ({
  name, intro, hook, paragraphs, proof, facts, image, phone, email, cvUrl, github, stackoverflow, linkedInUsername, portrait,
}: AboutProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { threshold: 0.2 });
  const collapse = (text: string) => text.replace(/\s+/g, " ").trim();

  return (
    <Section id="section-about">
      <Title>Who I am?</Title>
      <Content ref={contentRef}>
        <Top>
          <Portrait src={image} alt={`${name}, ${intro}`} fallbackSrc={image.replace(".webp", ".jpg")} labels={portrait} />
          <Lead>
            <Tag>{intro}</Tag>
            <Hook>
              <DecodedText text={collapse(hook)} isActive={isInView} duration={HOOK_DECODE_MS} />
            </Hook>
            {paragraphs.map((paragraph, index) => (
              <Paragraph key={paragraph}>
                <DecodedText text={collapse(paragraph)} isActive={isInView} delay={HOOK_DECODE_MS + index * PARAGRAPH_DELAY_MS} duration={PARAGRAPH_DECODE_MS} />
              </Paragraph>
            ))}
          </Lead>
        </Top>
        <Proof>
          {proof.map((figure) => (
            <Figure key={figure.label}>
              <FigureLabel>{figure.label}</FigureLabel>
              <FigureValue>{figure.value}</FigureValue>
            </Figure>
          ))}
        </Proof>
        <Facts>
          {facts.map((fact) => (
            <Fact key={fact}>{fact}</Fact>
          ))}
        </Facts>
        <Contact>
          <a href={`mailto:${email}`}>{email}</a>
          {"  |  "}
          <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
        </Contact>
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
      </Content>
    </Section>
  );
};
