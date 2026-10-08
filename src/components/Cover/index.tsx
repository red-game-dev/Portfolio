import tw, { css, styled } from "twin.macro";

import { faChevronDown, faEnvelope, faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";
import { DecodedText } from "@/components/DecodedText";
import { Image } from "@/components/Image";
import { useLensStatusHook } from "@/components/Lens/hooks/useLensStatusHook";
import TypingAnimation from "@/components/TypingAnimation";
import { industryAnchor, SECTION_IDS } from "@/config/sections";
import { Headline } from "@/types/headline";

interface CoverProps {
  image: string;
  intro: string;
  typingsTitles: string[];
  headline: Headline;
  cvUrl: string;
  email: string;
}

// Lines decode one after another once the intro loader has finished and the reader has picked a view.
const LINE_DELAY_MS = 260;

// The first screen as a column: the typed line centred in the room above, the essentials under it. Both are in
// the flow, so however the line wraps they never overlap; on a screen too short for both the cover grows.
// At least the visible height (svh), so a phone's toolbars never hide the actions.
const Section = styled.div(() => [
  tw`relative overflow-hidden m-0 z-[7] flex flex-col`,
  css`
    min-height: 100vh;
    min-height: 100svh;
  `,
]);

// Clear of the fixed header at the top.
const TitleArea = tw.div`relative z-[2] flex flex-1 items-center w-full px-5 pt-[96px] pb-[20px] lg:pt-[140px] lg:pb-[40px]`;

// Room at the bottom for the scroll cue, so it never sits on the role chips.
const Essentials = tw.div`relative z-[3] flex flex-col gap-[12px] px-5 pb-[52px] text-left lg:pr-12 lg:ml-[calc(20% + 15px)] lg:pb-[50px]
lg:max-w-[780px]`;

const Introduction = styled.h1(() => [
  tw`m-0 text-white break-words text-base lg:text-lg [& > strong]:text-[var(--accent)]`,
]);

const Lines = tw.div`flex flex-col gap-[4px] text-sm lg:text-base text-[#ddd]`;

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

// Centred under the essentials on every screen.
const ScrollerLink = styled(Link)(() => [
  tw`absolute block w-5 h-5 left-0 right-0 mx-auto bottom-[14px] lg:bottom-[10px] z-[2] text-[var(--accent)] text-2xl text-center
  animate-[scroll-cue 1s ease-out 0s infinite]
  `
]);

const ScrollerIcon = styled(FontAwesomeIcon)(() => [
  tw`relative bottom-[10px]`,
]);

const CoverContainer = tw.div`absolute inset-0`;

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
  const { isReady: isLoaded } = useAppLoaderStateHook();
  const { status } = useLensStatusHook();
  const isReady = isLoaded && status === "chosen";

  return (
    <Section id={SECTION_IDS.cover}>
      <CoverContainer className="cover-container">
        <CoverContent>
          <CoverImage
            src={image}
            alt=""
            fallbackSrc={image.replace(".webp", ".jpg")}
            sizes="100vw"
            fill
            // The first thing on screen: fetched straight away rather than lazily, and blurred anyway, so a
            // lighter encode costs nothing visible.
            priority
            quality={55}
          />
          <CoverBackgroundMask />
          <CoverBackgroundTexture id="grained_container" />
          <CoverBottomShade />
        </CoverContent>
      </CoverContainer>
      <TitleArea>
        <TypingAnimation typingData={typingsTitles} />
      </TitleArea>
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
          <DecodedText text={headline.availability} isActive={isReady} delay={headline.lines.length * LINE_DELAY_MS} variant="body" />
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
      <ScrollerLink href={`#${SECTION_IDS.about}`} aria-label="Learn more about me">
        <ScrollerIcon icon={faChevronDown} />
      </ScrollerLink>
    </Section>
  );
};
