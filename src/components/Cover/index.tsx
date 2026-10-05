import tw, { css, styled } from "twin.macro";

import { faEnvelope, faFileArrowDown } from "@fortawesome/pro-duotone-svg-icons";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";
import { DecodedText } from "@/components/DecodedText";
import { Image } from "@/components/Image";
import TypingAnimation from "@/components/TypingAnimation";
import { industryAnchor } from "@/config/sections";
import { Headline } from "@/types/headline";

interface CoverProps {
  image: string;
  intro: string;
  typingsTitles: string[];
  headline: Headline;
  cvUrl: string;
  email: string;
}

// Lines decode one after another once the intro loader has finished.
const LINE_DELAY_MS = 260;

const Section = tw.div`relative overflow-hidden h-screen m-0 z-[7] `;

const Content = tw.div`absolute top-0 left-0 z-[2] table table w-full h-full align-middle text-justify`;

// Lifted on large screens, so the typed line clears the essentials block at the bottom.
const TitleWrapper = tw.div`relative top-0 left-0 z-[2] table-fixed table-cell w-full h-full align-middle lg:pb-[30vh]`;

// Where the intro used to sit. The About section's scroll-spy measures this marker, so its timing is unchanged.
const IntroMarker = tw.span`absolute left-0 bottom-[30px] lg:bottom-[50px] w-px h-[24px] pointer-events-none`;

const Essentials = tw.div`absolute left-0 bottom-[30px] z-[3] flex flex-col gap-[12px] px-5 text-left
lg:pr-12 lg:left-[calc(20% + 35px)] lg:bottom-[50px] lg:max-w-[780px]`;

const Introduction = styled.h1(() => [
  tw`m-0 text-white break-words text-base lg:text-lg [& > strong]:text-[var(--accent)]`,
]);

const Lines = tw.div`hidden md:flex flex-col gap-[4px] text-sm lg:text-base text-[#ddd]`;

const Availability = tw.p`m-0 text-sm text-[var(--accent)]`;

const Actions = tw.div`flex flex-row flex-wrap gap-[10px]`;

const Action = styled.a(() => [
  tw`inline-flex flex-row items-center gap-2 h-[40px] px-[16px] text-sm font-medium no-underline text-[var(--accent)] bg-[rgba(16, 16, 16, 0.6)]
     border-[1px] border-solid border-[var(--accent-muted)] rounded-[2px]`,
  css`
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: #101010;
      background-color: var(--accent);
      border-color: var(--accent);
    }
  `,
]);

const Audiences = tw.nav`flex flex-row flex-wrap items-center gap-[8px] text-xs text-[#999]`;

// Only on wide, tall screens: elsewhere the cover stops at the roles, and the full industry filter waits at
// the top of My History.
const Industries = styled.nav(() => [
  tw`hidden xl:flex flex-row flex-wrap items-center gap-[8px] text-xs text-[#999]`,
  css`
    @media (max-height: 820px) {
      display: none;
    }
  `,
]);

const AudienceLink = styled.a(() => [
  tw`text-xs leading-none no-underline text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[7px] px-[11px] border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    transition: border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--accent);
    }
  `,
]);

// Hidden on phones, where the first screen already ends in the actions and the cue would sit on top of them.
const ScrollerLink = styled(Link)(() => [
  tw`absolute hidden md:block w-5 h-5 left-[47.4%] lg:left-[49.3%] z-[2] text-[var(--accent)] right-auto top-auto text-2xl text-center
  animate-[mouse-anim-mobile 1s ease-out 0s infinite]
  lg:animate-[mouse-anim-desktop 1s ease-out 0s infinite]
  `
]);

const ScrollerIcon = styled(FontAwesomeIcon)(() => [
  tw`relative bottom-[10px]`,
]);

const CoverContainer = tw.div`relative h-screen w-full`;

const CoverContent = tw.div`fixed h-full w-full left-0 top-0`;

const CoverImage = styled(Image)(() => [
  tw`blur-sm w-full h-full object-cover`
]);


const CoverBackgroundMask = tw.div`absolute top-0 left-0 w-full h-full opacity-40 z-[2] bg-[#101010]`;

const CoverBackgroundTexture = tw.div`absolute top-0 left-0 w-full h-full z-[2]`;

// Darkens the lower part of the picture so the first screen text keeps its contrast over bright clouds.
const CoverBottomShade = styled.div(() => [
  tw`absolute left-0 right-0 bottom-0 h-[60%] z-[2] pointer-events-none`,
  css`
    background: linear-gradient(to bottom, rgba(16, 16, 16, 0) 0%, rgba(16, 16, 16, 0.55) 55%, rgba(16, 16, 16, 0.85) 100%);
  `,
]);

export const Cover = ({ intro, image, typingsTitles, headline, cvUrl, email }: CoverProps) => {
  const { isReady } = useAppLoaderStateHook();

  return (
    <Section id="section-started">
      <CoverContainer className="cover-container">
        <CoverContent>
          <CoverImage
            src={image}
            alt=""
            fallbackSrc={image.replace(".webp", ".jpg")}
            sizes="100vw"
            fill
          />
          <CoverBackgroundMask />
          <CoverBackgroundTexture id="grained_container" />
          <CoverBottomShade />
        </CoverContent>
      </CoverContainer>
      <Content>
        <IntroMarker id="section-intro" aria-hidden="true" />
        <TitleWrapper>
          <TypingAnimation typingData={typingsTitles} />
        </TitleWrapper>
      </Content>
      <Essentials>
        <Introduction dangerouslySetInnerHTML={{ __html: intro }} />
        <Lines>
          {headline.lines.map((line, index) => (
            <span key={line}>
              <DecodedText text={line} isActive={isReady} delay={index * LINE_DELAY_MS} />
            </span>
          ))}
        </Lines>
        <Availability>
          <DecodedText text={headline.availability} isActive={isReady} delay={headline.lines.length * LINE_DELAY_MS} />
        </Availability>
        <Actions>
          <Action href={cvUrl} download>
            <FontAwesomeIcon icon={faFileArrowDown} />
            {headline.cvLabel}
          </Action>
          <Action href={`mailto:${email}`}>
            <FontAwesomeIcon icon={faEnvelope} />
            {headline.emailLabel}
          </Action>
        </Actions>
        <Audiences aria-label={headline.audiencesLabel}>
          <span>{headline.audiencesLabel}</span>
          {headline.roles.map(({ label, target }) => (
            <AudienceLink key={label} href={`#${target}`}>
              {label}
            </AudienceLink>
          ))}
        </Audiences>
        <Industries aria-label={headline.industriesLabel}>
          <span>{headline.industriesLabel}</span>
          {headline.industries.map(({ industry, label }) => (
            <AudienceLink key={industry} href={`#${industryAnchor(industry)}`}>
              {label}
            </AudienceLink>
          ))}
        </Industries>
      </Essentials>
      <ScrollerLink href="#section-about" aria-label="Learn more about me">
        <ScrollerIcon icon={faChevronDown} />
      </ScrollerLink>
    </Section>
  );
};
