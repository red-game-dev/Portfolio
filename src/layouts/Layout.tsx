import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { AppLoader, AppLoadingLines } from "@/components/AppLoader";
import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";
import { Journey } from "@/components/Journey";
import { portfolioData  } from "@/data/resume";

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

const Layout: FC<LayoutProps> = ({ title, children }: LayoutProps) => {
  const { isLoading } = useAppLoaderStateHook();

  return (
    <>
      <AppLoader />
      <Container style={isLoading ? { display: "none"} : {}}>
        <Header title={title} />
          {children}
        <Footer linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn} />
      </Container>
      <AppLoadingLines />
      <Journey
        isEnabled={!isLoading}
        hud={{ roster: portfolioData.roster, labels: portfolioData.hud, bossCount: portfolioData.caseStudies.length }}
      />
    </>
  );
};

export default Layout;
