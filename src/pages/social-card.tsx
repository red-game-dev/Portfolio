import { NextSeo } from "next-seo";
import tw, { css, styled } from "twin.macro";

import { SITE_URL } from "@/config/site";
import { ZONE_ACCENTS, ZONE_BOUNDARIES } from "@/config/zones";
import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";

const { details, headline, cvDocument, journeyTrail } = portfolioData;

// The figures the card shows, picked by id so a changed figure changes the card when it is printed again.
const FIGURE_IDS = ["industry", "reach", "startups"];

const figures = FIGURE_IDS.flatMap((id) => details.proof.filter((figure) => figure.id === id));

const domain = SITE_URL.replace(/^https?:\/\/(www\.)?/, "");

const { width, height } = seoDetails.socialCard;

const Card = styled.main(() => [
  tw`relative overflow-hidden flex flex-col text-white`,
  css`
    width: ${width}px;
    height: ${height}px;
    padding: 64px 80px 56px;
    box-sizing: border-box;
    background:
      radial-gradient(circle at 12% 0%, rgba(75, 255, 165, 0.12), transparent 42%),
      radial-gradient(circle at 100% 100%, rgba(196, 210, 255, 0.1), transparent 45%),
      #0c0c0e;
  `,
]);

// The site's backdrop guides, a third and two thirds across.
const Guides = styled.div(() => [
  tw`absolute inset-0 pointer-events-none`,
  css`
    background:
      linear-gradient(to right, transparent calc(33.333% - 1px), rgba(255, 255, 255, 0.05) 33.333%, transparent calc(33.333% + 1px)),
      linear-gradient(to right, transparent calc(66.666% - 1px), rgba(255, 255, 255, 0.05) 66.666%, transparent calc(66.666% + 1px));
  `,
]);

const Name = tw.h1`relative m-0 text-[84px] leading-[1] font-bold tracking-[-2px]`;

const Role = tw.p`relative m-0 mt-[16px] text-[34px] leading-[1.2] font-medium text-[#dcdcdc]`;

const Availability = tw.p`relative m-0 mt-[12px] text-[21px] text-[#9d9d9d]`;

const Figures = tw.dl`relative m-0 mt-[46px] grid grid-cols-3 gap-[40px]`;

const Figure = tw.div`flex flex-col gap-[6px]`;

const Value = tw.dt`text-[56px] leading-[1] font-bold text-[#4bffa5] tracking-[-1px]`;

const Label = tw.dd`m-0 text-[18px] leading-[1.35] text-[#a8a8a8]`;

const Footer = tw.footer`relative mt-auto flex flex-col gap-[12px]`;

const Band = tw.ol`m-0 p-0 list-none grid grid-cols-6 gap-[6px]`;

const Zone = styled.li(({ color }: { color: string }) => [
  tw`flex flex-col gap-[8px] text-[15px] font-semibold`,
  css`
    color: ${color};

    &::before {
      content: "";
      height: 8px;
      background: ${color};
    }
  `,
]);

const Domain = tw.p`absolute right-0 bottom-[44px] m-0 text-[20px] font-semibold text-white`;

// The picture shown when the site is shared (Open Graph and X). Not a page for readers: it is printed to
// public/images/social-card.png at 1200 by 630 with headless Chrome, and kept out of search.
export default function SocialCard() {
  return (
    <Card>
      <NextSeo title={seoDetails.socialCard.alt} noindex nofollow />
      <Guides aria-hidden="true" />
      <Name>{details.name}</Name>
      <Role>{cvDocument.headline}</Role>
      <Availability>{headline.availability}</Availability>
      <Figures>
        {figures.map((figure) => (
          <Figure key={figure.id}>
            <Value>{figure.value}</Value>
            <Label>{figure.label}</Label>
          </Figure>
        ))}
      </Figures>
      <Footer>
        <Domain>{domain}</Domain>
        <Band aria-label={Object.values(journeyTrail.zones).join(", ")}>
          {ZONE_BOUNDARIES.map(({ zone }) => <Zone key={zone} color={ZONE_ACCENTS[zone]}>{journeyTrail.zones[zone]}</Zone>)}
        </Band>
      </Footer>
    </Card>
  );
}
