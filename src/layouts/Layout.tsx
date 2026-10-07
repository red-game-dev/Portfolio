import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { AppLoader, AppLoadingLines } from "@/components/AppLoader";
import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";
import { Journey } from "@/components/Journey";
import { LensGate } from "@/components/Lens";
import { useLensStatusHook } from "@/components/Lens/hooks/useLensStatusHook";
import { ZONE_BOUNDARIES } from "@/config/zones";
import { portfolioData  } from "@/data/resume";
import { createJourneyTrail } from "@/services/journey/trail";

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

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

// Built once: the trail only changes when the content does.
const TRAIL = { sections: createJourneyTrail(portfolioData), labels: portfolioData.journeyTrail };

const LENS_COUNTS = { zones: ZONE_BOUNDARIES.length, bosses: portfolioData.caseStudies.length };

const Layout: FC<LayoutProps> = ({ title, children }: LayoutProps) => {
  const { isLoading } = useAppLoaderStateHook();
  const { status } = useLensStatusHook();
  // The world starts once the reader has picked a view, so it is built with that view's settings, and runs
  // under the entrance so it is already moving when the page opens.
  const isWorldLive = !isLoading && (status === "entering" || status === "chosen");

  return (
    <>
      <AppLoader />
      <LensGate content={portfolioData.lens} counts={LENS_COUNTS} />
      <Container>
        <Header
          title={title}
          lens={portfolioData.lens}
          menu={portfolioData.menu}
          contact={{ cv: portfolioData.cv, email: portfolioData.details.email, linkedIn: portfolioData.socialMedia.byUsername.linkedIn }}
        />
          {children}
        <Footer linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn} />
      </Container>
      <AppLoadingLines />
      <Journey
        isEnabled={isWorldLive}
        hud={{ roster: portfolioData.roster, labels: portfolioData.hud, bossCount: portfolioData.caseStudies.length }}
        trail={TRAIL}
      />
    </>
  );
};

export default Layout;
