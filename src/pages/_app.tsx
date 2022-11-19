import "@/styles/globals.css";

import {
  RecoilRoot
} from "recoil";
import { createGlobalStyle } from "styled-components";
import tw, { theme, GlobalStyles as BaseStyles } from "twin.macro";

const CustomStyles = createGlobalStyle({
  body: {
    WebkitTapHighlightColor: theme`colors.purple.500`,
    ...tw`antialiased`,
  },
});

const GlobalStyles = () => (
  <>
    <BaseStyles />
    <CustomStyles />
  </>
);


import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Redeemer Pace - Resume</title>

        <link rel="shortcut icon" href="images/favicons/favicon.ico" />
      </Head>

      <Script src="https://kit.fontawesome.com/54dc1ed9f3.js" crossOrigin="anonymous" />

      <GlobalStyles />
      <RecoilRoot>
        <Component {...pageProps} />
      </RecoilRoot>
    </>
  );
}
