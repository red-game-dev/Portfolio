import "@/styles/globals.css";

import {
  RecoilRoot
} from "recoil";
import { GlobalStyles } from "twin.macro";

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
