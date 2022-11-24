import { FC, Fragment } from "react";

import tw from "twin.macro";

import { AppLoader, AppLoadingLines } from "@/components/AppLoader";
import { Modal } from "@/components/Modal";
import { portfolioData  } from "@/data/resume";

import Footer from "./Footer";
import Header from "./Header";
import { useAppLoaderStateHook } from "@/components/AppLoader/hooks/useAppLoaderStateHook";

const Container = tw.div`relative m-0 overflow-hidden before:z-[8] before:pointer-events-none`;

const Wrapper = tw.div`relative`;

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

const Layout: FC<LayoutProps> = ({ title, children }: LayoutProps) => {
  const { isLoading } = useAppLoaderStateHook();

  return (
    <>
      <Modal />
      <AppLoader />
      <Container style={isLoading ? { display: 'none'} : {}}>
        <Header title={title} />
          <Wrapper>
            {children}
          </Wrapper>
        <Footer linkedInUsername={portfolioData.socialMedia.byUsername.linkedIn} />
        <AppLoadingLines />
      </Container>
    </>
  )
};

export default Layout;
