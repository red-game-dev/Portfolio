import { createGlobalStyle } from "styled-components";
import tw, { css, styled } from "twin.macro";

import Head from "next/head";

import { SOCIAL_URLS } from "@/config/social";
import { portfolioData } from "@/data/resume";
import { formatPeriod, splitTitle } from "@/packages/insights/career";
import { fill } from "@/packages/text/format";
import { createForgeStations } from "@/services/skills";

// Worked out at build time, from the same content as the site.
const stations = createForgeStations(portfolioData);
const yearsOf = new Map(stations.flatMap((station) => station.items).map((item) => [item.name, item.years] as const));
const { cvDocument: cv, details, experience, socialMedia } = portfolioData;
const roles = cv.roles.flatMap((role) => {
  const entry = experience.find((candidate) => candidate.title === role.title);

  return entry ? [{ ...role, ...splitTitle(entry.title), period: formatPeriod(entry, "{from} to {to}", "now") }] : [];
});
const linkedIn = SOCIAL_URLS.linkedIn(socialMedia.byUsername.linkedIn);
const github = portfolioData.github[0]?.link ?? "";

// White paper on screen and in print, whatever the site's own background is.
const Paper = createGlobalStyle`
  html, body {
    background: #e9e9e9 !important;
    color: #141414;
  }

  @page {
    size: A4;
    margin: 11mm 13mm;
  }

  @media print {
    html, body {
      background: #ffffff !important;
    }
  }
`;

const Sheet = styled.main(() => [
  tw`mx-auto my-[24px] bg-white text-[#141414]`,
  css`
    max-width: 210mm;
    padding: 14mm 15mm;
    font-family: "Roboto", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.38;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.12);

    @media print {
      margin: 0;
      padding: 0;
      max-width: none;
      box-shadow: none;
    }
  `,
]);

const Name = tw.h1`m-0 text-[22pt] font-bold leading-tight text-[#0b0b0b]`;

const Headline = tw.p`m-0 mt-[2px] text-[12pt] font-semibold text-[#1f6b47]`;

const Contact = tw.p`m-0 mt-[6px] text-[9pt] text-[#444]`;

const ContactLink = tw.a`text-[#444] no-underline`;

const Block = tw.section`mt-[12px]`;

// A short block printed whole, so its heading never sits alone at the foot of a page.
const KeptBlock = styled(Block)(() => [
  css`
    break-inside: avoid;
  `,
]);

const Heading = tw.h2`m-0 mb-[5px] pb-[2px] text-[10.5pt] font-bold text-[#1f6b47] border-0 border-b-[1px] border-solid border-[#d8d8d8]`;

const Paragraph = tw.p`m-0 mb-[4px]`;

const List = tw.ul`m-0 pl-[16px] list-disc`;

const Item = tw.li`mb-[2px]`;

const Role = styled.article(() => [
  tw`mb-[7px]`,
  css`
    break-inside: avoid;
  `,
]);

const RoleHeader = tw.div`flex flex-row flex-wrap items-baseline justify-between gap-x-[10px]`;

const RoleTitle = tw.h3`m-0 text-[10pt] font-bold`;

const RoleDates = tw.span`text-[9pt] text-[#555] whitespace-nowrap`;

const Muted = tw.p`m-0 text-[9.5pt] text-[#444]`;

// On screen only: print this CV, or take the full résumé instead.
const ScreenActions = styled.div(() => [
  tw`fixed right-[20px] bottom-[20px] flex flex-row flex-wrap justify-end gap-[10px]`,
  css`
    @media print {
      display: none;
    }
  `,
]);

const PrintButton = tw.button`h-[42px] px-[18px] cursor-pointer text-sm font-semibold text-white bg-[#1f6b47] border-0 rounded-[3px]`;

const FullResumeLink = tw.a`
  inline-flex items-center h-[42px] px-[18px] text-sm font-semibold text-[#1f6b47] bg-white
  border-[1px] border-solid border-[#1f6b47] rounded-[3px] no-underline
`;

const withYears = (name: string) => {
  const years = yearsOf.get(name) ?? 0;

  return years > 0 ? `${name} (${fill(cv.yearsFormat, { years })})` : name;
};

// The CV as recruiters and their screening software read it: one column, plain text, two pages. It is a page of
// its own, drawn from the same content as the site, and prints to the PDF the site links to.
export default function Resume() {
  return (
    <>
      <Head>
        <title>{`${details.name}, CV`}</title>
      </Head>
      <Paper />
      <Sheet>
        <header>
          <Name>{details.name}</Name>
          <Headline>{cv.headline}</Headline>
          <Contact>
            {details.facts[0]}, {details.facts.find((fact) => /relocation/i.test(fact))?.toLowerCase()}
            {" | "}
            <ContactLink href={`mailto:${details.email}`}>{details.email}</ContactLink>
            {" | "}
            {details.phone}
            {" | "}
            <ContactLink href="https://redgame.dev">redgame.dev</ContactLink>
            {" | "}
            <ContactLink href={linkedIn}>{linkedIn.replace(/^https:\/\/(www\.)?/, "")}</ContactLink>
            {" | "}
            <ContactLink href={github}>{github.replace(/^https:\/\//, "")}</ContactLink>
          </Contact>
        </header>
        <Block>
          {cv.summary.map((paragraph) => <Paragraph key={paragraph}>{paragraph.replace(/\s+/g, " ")}</Paragraph>)}
        </Block>
        <Block>
          <Heading>{cv.highlightsLabel}</Heading>
          <List>
            {cv.highlights.map((highlight) => <Item key={highlight}>{highlight.replace(/\s+/g, " ")}</Item>)}
          </List>
        </Block>
        <Block>
          <Heading>{cv.experienceLabel}</Heading>
          {roles.map((role) => (
            <Role key={role.title}>
              <RoleHeader>
                <RoleTitle>{role.place ? `${role.role}, ${role.place}` : role.role}</RoleTitle>
                <RoleDates>{role.period}</RoleDates>
              </RoleHeader>
              <List>
                {role.bullets.map((bullet) => <Item key={bullet}>{bullet.replace(/\s+/g, " ")}</Item>)}
              </List>
            </Role>
          ))}
          <Muted>{cv.moreVentures}</Muted>
        </Block>
        <KeptBlock>
          <Heading>{cv.skillsLabel}</Heading>
          {cv.skills.map((line) => (
            <Paragraph key={line.label}>
              <strong>{line.label}: </strong>
              {line.names.map(withYears).join(", ")}
            </Paragraph>
          ))}
        </KeptBlock>
        <KeptBlock>
          <Heading>{cv.educationLabel}</Heading>
          {cv.education.map((line) => <Paragraph key={line}>{line}</Paragraph>)}
          <Paragraph>
            <strong>{cv.languagesLabel}: </strong>
            {cv.languages}
          </Paragraph>
        </KeptBlock>
      </Sheet>
      <ScreenActions>
        <PrintButton type="button" onClick={() => window.print()}>{cv.printLabel}</PrintButton>
        <FullResumeLink href={portfolioData.fullResume.url} download>{portfolioData.fullResume.label}</FullResumeLink>
      </ScreenActions>
    </>
  );
}
