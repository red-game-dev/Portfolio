import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { AppLoader, AppLoadingLines } from "@/components/AppLoader";
import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";
import { LazyPilotArrival } from "@/components/Finale/Voyage/LazyPilotArrival";
import { Journey } from "@/components/Journey";
import { LensGate } from "@/components/Lens";
import { useLensStatusHook } from "@/components/Lens/hooks/useLensStatusHook";
import { FollowsJourney } from "@/components/Zone";
import { ZONE_BOUNDARIES } from "@/config/zones";
import { portfolioData  } from "@/data/resume";
import { useHashValue } from "@/hooks/useHashState";
import useSettledAnchors from "@/hooks/useSettledAnchors";
import { createJourneyTrail } from "@/services/journey/trail";
import { focusRing } from "@/styles/mixins";

import Footer from "./Footer";
import Header from "./Header";

// overflow: clip trims sideways overflow like hidden did, but without making this a scroll container,
// which would stop position: sticky working for anything inside it.
const Container = styled.div(() => [
  tw`relative m-0 before:z-[8] before:pointer-events-none`,
  css`
    overflow: hidden;
    overflow: clip;
  `,
]);

// Where the skip link lands: past the header and its menus, at the start of the page's own content.
const MAIN_ID = "main-content";

// The first thing a keyboard reaches, out of sight until it is focused.
const SkipLink = styled.a(() => [
  tw`fixed top-[12px] left-[12px] z-[100] px-[14px] py-[10px] text-sm font-semibold text-[#09090b] no-underline bg-[var(--accent)] rounded-[2px]`,
  css`
    transform: translateY(-200%);

    &:focus,
    &:focus-visible {
      transform: none;
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
  `,
]);

// The foot of the page, past the last section: the way to the accessibility statement, clear of the game's bar along
// the bottom on phones.
const PageEnd = tw.div`relative z-[6] flex justify-center pt-[8px] pb-[96px] lg:pb-[32px]`;

const PageEndLink = styled.a(() => [
  tw`text-sm text-[#9a9a9a] underline hover:text-white`,
  css`
    text-underline-offset: 4px;
  `,
  focusRing("var(--accent)", 2),
]);

const Main = styled.main(() => [
  css`
    &:focus {
      outline: none;
    }
  `,
]);

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

// Built once: the trail only changes when the content does.
const TRAIL = { sections: createJourneyTrail(portfolioData), labels: portfolioData.journeyTrail };

const LENS_COUNTS = { zones: ZONE_BOUNDARIES.length, bosses: portfolioData.caseStudies.length };

// The recruiter's entrance shows me as a candidate, from the facts the page states.
const LENS_CANDIDATE = {
  name: portfolioData.details.name,
  role: portfolioData.headline.roles[0]?.label ?? portfolioData.details.intro,
  checks: portfolioData.details.facts,
};

// Whether the page was opened with a pilot sent from another device in its fragment.
const hasPilot = (hash: string): true | null => (hash.startsWith("#pilot=") ? true : null);

const Layout: FC<LayoutProps> = ({ title, children }: LayoutProps) => {
  const { isLoading } = useAppLoaderStateHook();

  useSettledAnchors();
  const { status } = useLensStatusHook();
  // The world starts once the reader has picked a view, so it is built with that view's settings, and runs
  // under the entrance so it is already moving when the page opens.
  const isWorldLive = !isLoading && (status === "entering" || status === "chosen");
  // A pilot link's card waits until a view is chosen, so it does not open under the character select.
  const isPilotArriving = useHashValue(hasPilot) === true && status === "chosen";

  return (
    <>
      <FollowsJourney>
        <SkipLink href={`#${MAIN_ID}`}>{portfolioData.menu.skip}</SkipLink>
      </FollowsJourney>
      <AppLoader />
      <LensGate content={portfolioData.lens} counts={LENS_COUNTS} candidate={LENS_CANDIDATE} />
      <Container>
        <FollowsJourney>
          <Header
            title={title}
            lens={portfolioData.lens}
            menu={portfolioData.menu}
            contact={{ cv: portfolioData.cv, email: portfolioData.details.email, linkedIn: portfolioData.socialMedia.byUsername.linkedIn }}
          />
        </FollowsJourney>
        <Main id={MAIN_ID} tabIndex={-1}>
          {children}
        </Main>
        <FollowsJourney>
          <PageEnd>
            <PageEndLink href="/accessibility/">{portfolioData.accessibility.link}</PageEndLink>
          </PageEnd>
          <Footer linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn} />
        </FollowsJourney>
      </Container>
      <AppLoadingLines />
      {isPilotArriving && <LazyPilotArrival copy={portfolioData.finale.voyage.transfer} />}
      <Journey
        isEnabled={isWorldLive}
        hud={{ roster: portfolioData.roster, labels: portfolioData.hud, bossCount: portfolioData.caseStudies.length }}
        trail={TRAIL}
      />
    </>
  );
};

export default Layout;
