import "@/styles/globals.css";

import {
  RecoilRoot
} from "recoil";
import { createGlobalStyle } from "styled-components";
import tw, { theme, GlobalStyles as BaseStyles } from "twin.macro";

import { config } from "@fortawesome/fontawesome-svg-core";
import { Analytics } from "@vercel/analytics/react";
import type { AppProps } from "next/app";
import Head from "next/head";

import "@fortawesome/fontawesome-svg-core/styles.css";

import { SEO } from "@/components/SEO";

config.autoAddCss = false;


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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
      </Head>

      <SEO url={process.env.HOST || "#"} />

      <GlobalStyles />
      <RecoilRoot>
        <Component {...pageProps} />
        <Analytics debug={Boolean(process.env.DEBUG)} />
      </RecoilRoot>
    </>
  );
}
