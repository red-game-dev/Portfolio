import "@/styles/globals.css";

import {
  RecoilRoot
} from "recoil";
import { createGlobalStyle } from "styled-components";
import tw, { theme, GlobalStyles as BaseStyles } from "twin.macro";

import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";

import { SEO } from "@/components/SEO";


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

      <Script src="https://kit.fontawesome.com/54dc1ed9f3.js" crossOrigin="anonymous" />

      <SEO url={process.env.HOST || "#"} />

      <GlobalStyles />
      <RecoilRoot>
        <Component {...pageProps} />
      </RecoilRoot>
    </>
  );
}
