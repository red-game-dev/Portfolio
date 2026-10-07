import {
  DefaultSeo,
  CorporateContactJsonLd,
  FAQPageJsonLd,
  SocialProfileJsonLd,
  ProfilePageJsonLd,
  LogoJsonLd,
  NewsArticleJsonLd,
  ProductJsonLd
} from "next-seo";

import { JOURNEY_STOPS } from "@/config/journey";
import { SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";

interface SeoProps {
  url: string;
}

// next.config sets trailingSlash, so the served URL always ends in a slash. The
// canonical has to match it exactly, otherwise it points at a redirect.
const toCanonical = (url: string) => (url.endsWith("/") ? url : `${url}/`);

export const SEO = ({ url }: SeoProps) => (
  <>
    <DefaultSeo
      title={seoDetails.title}
      titleTemplate={seoDetails.titleTemplate}
      description={seoDetails.description}
      canonical={toCanonical(url)}
      openGraph={{
        type: "profile",
        locale: "en_UK",
        url: toCanonical(url),
        siteName: `${seoDetails.title} | ${portfolioData.details.name}`,
        profile: {
          firstName: portfolioData.details.name.split(" ")[0],
          lastName: portfolioData.details.name.split(" ")[1],
          username: portfolioData.socialMedia.byUsername.twitter,
          gender: "male",
        },
        images: [
          {
            url: portfolioData.details.image,
            width: 850,
            height: 650,
            alt: `${portfolioData.socialMedia.byUsername.twitter} Profile Photo`,
          },
        ],
      }}
      twitter={{
        handle: portfolioData.socialMedia.byUsername.twitter,
        site: portfolioData.socialMedia.byUsername.twitter,
        cardType: "summary_large_image",
      }}
      additionalLinkTags={[
        {
          rel: "icon",
          href: "/favicon.ico",
        },
        {
          rel: "shortcut icon",
          href: "/favicon.ico",
        },
        {
          rel: "apple-touch-icon",
          href: "/favicon.ico",
          sizes: "76x76"
        },
      ]}
      additionalMetaTags={[
        {
          name: "application-name",
          content: `${seoDetails.title} | ${portfolioData.details.name}`
        }
      ]}
    />
    <LogoJsonLd
      logo={portfolioData.details.image}
      url={url}
    />
    <SocialProfileJsonLd
      type="Person"
      name={portfolioData.details.name}
      url={url}
      sameAs={[
        SOCIAL_URLS.facebook(portfolioData.socialMedia.byUsername.facebook),
        SOCIAL_URLS.linkedIn(portfolioData.socialMedia.byUsername.linkedIn),
        SOCIAL_URLS.instagram(portfolioData.socialMedia.byUsername.instagram),
        SOCIAL_URLS.twitter(portfolioData.socialMedia.byUsername.twitter),
        SOCIAL_URLS.youtube(portfolioData.socialMedia.byProjectsUsername.gameYt)
      ]}
    />
    <ProfilePageJsonLd
      lastReviewed="2022-11-21T19:30"
      breadcrumb={JOURNEY_STOPS.map(({ key, href }, index) => ({ position: index + 1, name: portfolioData.menu.stops[key], item: `${url}/${href}` }))}
    />
    <CorporateContactJsonLd
      url={url}
      logo={portfolioData.details.image}
      contactPoint={[
        {
          telephone: portfolioData.details.phone,
          contactType: "Contact",
          email: portfolioData.details.email,
          areaServed: "EU",
          availableLanguage: [portfolioData.skills.language],
        },
      ]}
    />
    <FAQPageJsonLd
      mainEntity={[
        {
          questionName: "When is the best time to reach me?",
          acceptedAnswerText: portfolioData.details.contactTime,
        },
        {
          questionName: "What is my preferred job type?",
          acceptedAnswerText: portfolioData.details.jobType,
        },
        {
          questionName: "What are my expertise? ",
          acceptedAnswerText: portfolioData.skills.expertise.join(","),
        },
        {
          questionName: "Looking at the moment?",
          acceptedAnswerText: "Just reach out, let's discuss",
        },
        {
          questionName: "Accepting small freelance projects or few months contracts?",
          acceptedAnswerText: "Yes, we can discuss further about your project & the rate",
        },
        {
          questionName: "What programming languages do I use?",
          acceptedAnswerText: portfolioData.skills.programming.join(","),
        },
        {
          questionName: "Which frameworks do I use?",
          acceptedAnswerText: [...portfolioData.skills.frontend, ...portfolioData.skills.backend, ...portfolioData.skills.mobile].join(","),
        },
        {
          questionName: "What design tools do I use?",
          acceptedAnswerText: portfolioData.skills.design.join(","),
        },
        {
          questionName: "What general tools do I use?",
          acceptedAnswerText: portfolioData.skills.tools.join(","),
        },
      ]}
    />
    {
      portfolioData.projects.map((project, index) => (
        <NewsArticleJsonLd
          key={`project-${index}`}
          url={`${url}/#${SECTION_IDS.projects}`}
          title={project.title}
          images={[project.image ?? portfolioData.cover]}
          section={project.category}
          keywords={`${project.title},${project.category},${project.techStack.join(",")}`}
          authorName={portfolioData.details.name}
          publisherName={portfolioData.details.name}
          publisherLogo={portfolioData.details.image}
          description={project.intro}
          body={project.responsibilities.length
            ? `${project.intro} \n\n Responsibilities: ${project.responsibilities.join(",")}. \n\n Tech Stack: ${project.techStack.join(",")}`
            : `${project.intro} \n\n Tech Stack: ${project.techStack.join(",")}`}
          isAccessibleForFree={true}
          datePublished={project.from}
          dateCreated={project.from}
        />
      ))
    }
    {
      portfolioData.serviceGroups.flatMap((group) => group.services).map((service, index) => (
        <ProductJsonLd
          key={`service-${index}`}
          type="service"
          productName={service.title}
          description={service.description}
          manufacturerName={portfolioData.details.name}
          manufacturerLogo={portfolioData.details.image}
        />
      ))
    }
  </>
);
