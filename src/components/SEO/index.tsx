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

import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";

interface SeoProps {
  url: string;
}

export const SEO = ({ url }: SeoProps) => (
  <>
    <DefaultSeo
      title={seoDetails.title}
      titleTemplate={seoDetails.titleTemplate}
      description={seoDetails.description}
      canonical={url}
      openGraph={{
        type: "profile",
        locale: "en_UK",
        url,
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
        `https://www.facebook.com/${portfolioData.socialMedia.byUsername.facebook}`,
        `https://www.linkedin.com/in/${portfolioData.socialMedia.byUsername.linkedIn}`,
        `https://www.instagram.com/${portfolioData.socialMedia.byUsername.instagram}`,
        `https://twitter.com/${portfolioData.socialMedia.byUsername.twitter}`,
        `https://www.youtube.com/${portfolioData.socialMedia.byProjectsUsername.gameYt}`
      ]}
    />
    <ProfilePageJsonLd
      lastReviewed="2022-11-21T19:30"
      breadcrumb={[
        {
          position: 1,
          name: "Who I am",
          item: `${url}/#section-about`,
        },
        {
          position: 2,
          name: "My History",
          item: `${url}/#section-history`,
        },
        {
          position: 3,
          name: "My Skills",
          item: `${url}/#section-skills-TechSkills`,
        },
        {
          position: 4,
          name: "Achievements",
          item: `${url}/#section-projects`,
        },
        {
          position: 5,
          name: "What can I offer",
          item: `${url}/#section-services`,
        },
      ]}
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
          availableLanguage: [portfolioData.skills.language.map((skill) => skill.name)],
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
          acceptedAnswerText: portfolioData.skills.expertise.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
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
          acceptedAnswerText: portfolioData.skills.tech.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
        },
        {
          questionName: "What design tools do I use?",
          acceptedAnswerText: portfolioData.skills.design.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
        },
        {
          questionName: "What general tools do I use?",
          acceptedAnswerText: portfolioData.skills.tools.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
        },
      ]}
    />
    {
      portfolioData.projects.map((project, index) => (
        <NewsArticleJsonLd
          key={`project-${index}`}
          url={`${url}/#section-projects`}
          title={project.title}
          images={[project.image]}
          section={project.category}
          keywords={`${project.title},${project.category},${project.techStack.join(",")}`}
          authorName={portfolioData.details.name}
          publisherName={portfolioData.details.name}
          publisherLogo={portfolioData.details.image}
          description={project.intro}
          body={project.responsabilities.length
            ? `${project.intro} \n\n Tech Stack: ${project.techStack.join(",")}`
            : `${project.intro} \n\n Responsabilities: ${project.responsabilities.join(",")}. \n\n Tech Stack: ${project.techStack.join(",")}`}
          isAccessibleForFree={true}
          datePublished={project.from}
          dateCreated={project.from}
        />
      ))
    }
    {
      portfolioData.services.map((service, index) => (
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
