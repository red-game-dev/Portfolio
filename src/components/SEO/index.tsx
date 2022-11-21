import {
  DefaultSeo,
  CorporateContactJsonLd,
  FAQPageJsonLd,
  SocialProfileJsonLd,
  ProfilePageJsonLd,
  LogoJsonLd,
  NewsArticleJsonLd
} from "next-seo";

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
        siteName: `${seoDetails.title} | ${seoDetails.details.name}`,
        profile: {
          firstName: seoDetails.details.name.split(" ")[0],
          lastName: seoDetails.details.name.split(" ")[1],
          username: seoDetails.socialMedia.byUsername.twitter,
          gender: "male",
        },
        images: [
          {
            url: seoDetails.details.image,
            width: 850,
            height: 650,
            alt: `${seoDetails.socialMedia.byUsername.twitter} Profile Photo`,
          },
        ],
      }}
      twitter={{
        handle: seoDetails.socialMedia.byUsername.twitter,
        site: seoDetails.socialMedia.byUsername.twitter,
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
        {
          rel: "manifest",
          href: "/manifest.json"
        },
      ]}
      additionalMetaTags={[
        {
          name: "application-name",
          content: `${seoDetails.title} | ${seoDetails.details.name}`
        }
      ]}
    />
    <LogoJsonLd
      logo={seoDetails.details.image}
      url={url}
    />
    <SocialProfileJsonLd
      type="Person"
      name={seoDetails.details.name}
      url={url}
      sameAs={[
        `https://www.facebook.com/${seoDetails.socialMedia.byUsername.facebook}`,
        `https://www.linkedin.com/in/${seoDetails.socialMedia.byUsername.linkedIn}`,
        `https://www.instagram.com/${seoDetails.socialMedia.byUsername.instagram}`,
        `https://twitter.com/${seoDetails.socialMedia.byUsername.twitter}`,
        `https://www.youtube.com/${seoDetails.socialMedia.byProjectsUsername.gameYt}`
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
      logo={seoDetails.details.image}
      contactPoint={[
        {
          telephone: seoDetails.details.phone,
          contactType: "Contact",
          email: seoDetails.details.email,
          areaServed: "EU",
          availableLanguage: [seoDetails.skills.language.map((skill) => skill.name)],
        },
      ]}
    />
    <FAQPageJsonLd
      mainEntity={[
        {
          questionName: "When is the best time to reach me?",
          acceptedAnswerText: seoDetails.details.contactTime,
        },
        {
          questionName: "What is my preferred job type?",
          acceptedAnswerText: seoDetails.details.jobType,
        },
        {
          questionName: "What are my expertise? ",
          acceptedAnswerText: seoDetails.skills.expertise.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
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
          acceptedAnswerText: seoDetails.skills.tech.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
        },
        {
          questionName: "What design tools do I use?",
          acceptedAnswerText: seoDetails.skills.design.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
        },
        {
          questionName: "What general tools do I use?",
          acceptedAnswerText: seoDetails.skills.tools.map((skill) => `${skill.name} (${skill.score}%)`).join(","),
        },
      ]}
    />
    {
      seoDetails.projects.map((project, index) => (
        <NewsArticleJsonLd
          key={`project-${index}`}
          url={`${url}/#section-projects`}
          title={project.title}
          images={[project.image]}
          section={project.category}
          keywords={`${project.title},${project.category},${project.techStack.join(",")}`}
          datePublished={project.from}
          dateModified={project.from}
          authorName={seoDetails.details.name}
          publisherName={project.title}
          publisherLogo="https://www.example.com/photos/logo.jpg"
          description={project.intro}
          body={project.responsabilities.length
            ? `${project.intro} \n\n Tech Stack: ${project.techStack.join(",")}`
            : `${project.intro} \n\n Responsabilities: ${project.responsabilities.join(",")}. \n\n Tech Stack: ${project.techStack.join(",")}`}
          isAccessibleForFree={true}
          dateCreated={project.from}
        />
      ))
    }
  </>
);
