import { FC, Fragment, useEffect } from "react";

import tw from "twin.macro";

import { AppLoader, AppLoadingLines } from "@/components/AppLoader";
import { Modal } from "@/components/Modal";

import Footer from "./Footer";
import Header from "./Header";

const Container = tw.div`relative m-0 overflow-hidden before:z-[8] before:pointer-events-none`;

const Wrapper = tw.div`relative`;

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

const Layout: FC<LayoutProps> = ({ title, children }: LayoutProps) => (
    <Fragment>
      <Modal />
      <AppLoader />
      <Container>
        <Header title={title} />
          <Wrapper>
            {children}
          </Wrapper>
        <Footer />
        <AppLoadingLines />
      </Container>
    </Fragment>
  );

export default Layout;
