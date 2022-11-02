
import "tailwindcss/tailwind.css";
import { Fragment } from "react";

import { GlobalStyles } from "twin.macro";

import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <GlobalStyles />
      <Component {...pageProps} />
    </Fragment>
  );
}
