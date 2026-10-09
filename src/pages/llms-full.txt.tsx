import type { GetServerSideProps } from "next";

import { portfolioData } from "@/data/resume";
import { createLlmsFullTxt } from "@/services/seo/llms";
import { servePlainText } from "@/services/seo/text";

// Everything the site says as plain text, for language models that read a site whole.
export const getServerSideProps: GetServerSideProps = ({ res }) => {
  servePlainText(res, createLlmsFullTxt(portfolioData, process.env.HOST ?? ""));

  return Promise.resolve({ props: {} });
};

// Never rendered: the response is finished above.
export default function LlmsFullTxt() {
  return null;
}
