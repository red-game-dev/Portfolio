import { useMemo } from "react";

import { DefaultSeo, NextSeo } from "next-seo";

import Head from "next/head";
import { useRouter } from "next/router";

import { SITE_URL } from "@/config/site";
import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";
import { shareCardOf, shareCardVersion } from "@/services/seo/shareCard";
import { absoluteUrl, createStructuredData, SeoPage, serializeStructuredData, siteRoot } from "@/services/seo/structuredData";

// Error pages are not pages to index, and have no canonical of their own.
const ERROR_PAGES = new Set(["/_error", "/404", "/500"]);

// The pages that carry structured data, by route.
const STRUCTURED_PAGES: Partial<Record<string, SeoPage>> = { "/": "home", "/resume": "resume" };

// next.config sets trailingSlash, so every served URL ends in a slash. Each page's canonical is its own URL with
// that slash, never the home page's: otherwise search engines fold /resume/ into the home page and drop it.
const toCanonical = (root: string, pathname: string) => (pathname === "/" ? `${root}/` : `${root}${pathname}/`);

const { details, socialMedia } = portfolioData;

// The share picture's version: it changes only when what the card says changes, so platforms fetch it again then.
const SHARE_CARD_VERSION = shareCardVersion(shareCardOf(portfolioData));

export const SEO = () => {
  const { pathname } = useRouter();
  const root = siteRoot(SITE_URL);
  const isError = ERROR_PAGES.has(pathname);
  const canonical = isError ? undefined : toCanonical(root, pathname);
  const page = STRUCTURED_PAGES[pathname];
  const structuredData = useMemo(
    () => (page ? serializeStructuredData(createStructuredData(portfolioData, seoDetails, root, page)) : null),
    [page, root],
  );
  const card = seoDetails.socialCard;
  const video = absoluteUrl(root, card.video);
  const image = `${absoluteUrl(root, card.path)}?v=${SHARE_CARD_VERSION}`;

  return (
    <>
      <DefaultSeo
        defaultTitle={seoDetails.defaultTitle}
        titleTemplate={seoDetails.titleTemplate}
        description={seoDetails.description}
        canonical={canonical}
        openGraph={{
          // A video, so Discord plays the card's film in place (its player needs this type); every platform that plays
          // none shows the still. The profile fields this once carried showed nowhere.
          type: "video.other",
          locale: "en_GB",
          url: canonical,
          siteName: details.name,
          title: seoDetails.defaultTitle,
          description: seoDetails.description,
          images: [{ url: image, width: card.width, height: card.height, alt: card.alt, type: "image/png" }],
          videos: [{ url: video, secureUrl: video, width: card.width, height: card.height, alt: card.alt, type: "video/mp4" }],
        }}
        twitter={{
          handle: socialMedia.byUsername.twitter,
          site: socialMedia.byUsername.twitter,
          cardType: "summary_large_image",
        }}
        additionalLinkTags={[
          { rel: "icon", href: "/favicon.ico" },
          { rel: "shortcut icon", href: "/favicon.ico" },
          { rel: "apple-touch-icon", href: "/favicon.ico", sizes: "76x76" },
        ]}
        additionalMetaTags={[
          { name: "application-name", content: details.name },
          { name: "author", content: details.name },
        ]}
      />
      {isError && <NextSeo noindex nofollow />}
      {structuredData && (
        <Head>
          <script key="structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        </Head>
      )}
    </>
  );
};
