import { NextSeo } from "next-seo";
import tw, { css, styled } from "twin.macro";

import Link from "next/link";

import { portfolioData } from "@/data/resume";
import { focusRing } from "@/styles/mixins";

const { accessibility: statement, details } = portfolioData;

const Page = tw.main`mx-auto max-w-[72ch] px-[20px] py-[48px] md:py-[72px] text-[#ccc] leading-relaxed`;

const Title = tw.h1`m-0 text-3xl md:text-4xl font-semibold text-white`;

const Lead = tw.p`m-0 mt-[16px] text-base md:text-lg text-[#e6e6e6]`;

const Paragraph = tw.p`m-0 mt-[12px] text-base`;

const Heading = tw.h2`m-0 mt-[36px] text-xl font-semibold text-white`;

const List = tw.ul`m-0 mt-[12px] pl-[22px] flex flex-col gap-[8px] text-base`;

// Twin 2.8 has no underline offset class, so it is set here.
const underlined = css`
  text-underline-offset: 4px;
`;

const TextLink = styled.a(() => [tw`text-[#4bffa5] underline`, underlined, focusRing("#4bffa5", 2)]);

const Back = styled(Link)(() => [tw`inline-block mt-[40px] text-sm font-semibold text-[#4bffa5] underline`, underlined, focusRing("#4bffa5", 2)]);

const Reviewed = tw.p`m-0 mt-[28px] text-sm text-[#9a9a9a]`;

// The accessibility statement: the standard the site aims for, what it does, what it does not yet, how it is tested
// and how to report a problem, read from the content. A plain page, so it works with nothing else loaded.
export default function Accessibility() {
  const [before, after] = statement.report.split("{email}");

  return (
    <>
      <NextSeo title={statement.title} description={statement.description} />
      <Page>
        <Title>{statement.title}</Title>
        <Lead>{statement.intro}</Lead>
        <Paragraph>{statement.standard}</Paragraph>
        <Paragraph>{statement.status}</Paragraph>
        <Heading>{statement.doneTitle}</Heading>
        <List>
          {statement.done.map((line) => <li key={line}>{line}</li>)}
        </List>
        <Heading>{statement.limitsTitle}</Heading>
        <List>
          {statement.limits.map((line) => <li key={line}>{line}</li>)}
        </List>
        <Heading>{statement.testingTitle}</Heading>
        <Paragraph>{statement.testing}</Paragraph>
        <Heading>{statement.reportTitle}</Heading>
        <Paragraph>
          {before}
          <TextLink href={`mailto:${details.email}?subject=${encodeURIComponent(statement.title)}`}>{details.email}</TextLink>
          {after}
        </Paragraph>
        <Reviewed>{statement.reviewed}</Reviewed>
        <Back href="/">{statement.back}</Back>
      </Page>
    </>
  );
}
