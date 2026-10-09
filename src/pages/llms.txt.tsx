import type { GetServerSideProps } from "next";

import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";
import { createLlmsTxt } from "@/services/seo/llms";
import { servePlainText } from "@/services/seo/text";

// The site in brief for language models (llmstxt.org), written from the content on each cache miss.
export const getServerSideProps: GetServerSideProps = ({ res }) => {
  servePlainText(res, createLlmsTxt(portfolioData, seoDetails, process.env.HOST ?? ""));

  return Promise.resolve({ props: {} });
};

// Never rendered: the response is finished above.
export default function LlmsTxt() {
  return null;
}
