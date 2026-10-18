import "@/styles/globals.css";

import { useEffect } from "react";

import { createGlobalStyle } from "styled-components";
import tw, { GlobalStyles as BaseStyles } from "twin.macro";

import { config } from "@fortawesome/fontawesome-svg-core";
import { Analytics } from "@vercel/analytics/react";
import type { AppProps } from "next/app";

import "@fortawesome/fontawesome-svg-core/styles.css";

import { AppLoaderProvider } from "@/components/AppLoader/context/AppLoaderContext";
import { GameProvider } from "@/components/Game/context/GameContext";
import { LensProvider } from "@/components/Lens/context/LensContext";
import { PreferencesProvider } from "@/components/Preferences/context/PreferencesContext";
import { SEO } from "@/components/SEO";
import { keepOfflineCopy } from "@/services/offline";

config.autoAddCss = false;

const CustomStyles = createGlobalStyle({
  body: {
    // No grey or coloured box flashing over whatever is tapped on a phone; buttons show their own pressed state.
    WebkitTapHighlightColor: "transparent",
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
  // The site's offline copy, kept from the first visit on.
  useEffect(() => {
    keepOfflineCopy();
  }, []);

  return (
    <>
      <SEO />

      <GlobalStyles />
      <AppLoaderProvider>
        <PreferencesProvider>
          <LensProvider>
            <GameProvider>
              <Component {...pageProps} />
              <Analytics debug={process.env.DEBUG === "true"} />
            </GameProvider>
          </LensProvider>
        </PreferencesProvider>
      </AppLoaderProvider>
    </>
  );
}
