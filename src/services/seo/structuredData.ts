import type { BreadcrumbList, CreativeWork, FAQPage, Graph, Person, ProfilePage, WebSite } from "schema-dts";

import { JOURNEY_STOPS } from "@/config/journey";
import { SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
import { PortfolioData } from "@/data/resume";
import { splitTitle, toIsoMonth } from "@/packages/insights/career";
import { collapseWhitespace } from "@/packages/text/format";
import { SeoDetails } from "@/types/seo";

// The pages that carry their own structured data.
export type SeoPage = "home" | "resume";

// The site's address without a trailing slash, so paths join onto it the same way everywhere.
export const siteRoot = (host: string): string => host.replace(/\/+$/, "");

export const absoluteUrl = (host: string, path: string): string => `${siteRoot(host)}${path.startsWith("/") ? path : `/${path}`}`;

// Link previews and search results take a JPG more widely than the WebP the page shows.
const jpg = (path: string) => path.replace(/\.webp$/, ".jpg");

const nodeIds = (root: string) => ({
  person: `${root}/#person`,
  website: `${root}/#website`,
  home: `${root}/#webpage`,
  resume: `${root}/resume/#webpage`,
  breadcrumb: `${root}/#breadcrumb`,
  faq: `${root}/#faq`,
});

// One schema.org graph per page: the person, the site and the page, joined by @id, then what the home page
// holds (services, projects, the journey's stops and the questions recruiters ask). Everything is read from the
// content, so a new service or project extends it without a change here.
export const createStructuredData = (data: PortfolioData, seo: SeoDetails, host: string, page: SeoPage): Graph => {
  const root = siteRoot(host);
  const ids = nodeIds(root);
  const at = (path: string) => absoluteUrl(root, path);
  const { details, cvDocument, socialMedia } = data;
  const me = { "@id": ids.person };
  // Where I work now: the first role still running that is not a company of my own.
  const employer = data.experience.find((role) => !role.to && !role.isVenture);
  const employerName = employer ? splitTitle(employer.title).place : "";

  const person: Person = {
    "@type": "Person",
    "@id": ids.person,
    "name": details.name,
    "url": `${root}/`,
    "image": at(jpg(details.image)),
    "jobTitle": cvDocument.headline,
    "description": collapseWhitespace(cvDocument.summary.join(" ")),
    "email": `mailto:${details.email}`,
    "telephone": details.phone,
    "knowsLanguage": cvDocument.languages.split(/,\s*/),
    ...(employerName ? { worksFor: { "@type": "Organization", "name": employerName } } : {}),
    "knowsAbout": cvDocument.skills.flatMap((line) => line.names),
    "hasOccupation": {
      "@type": "Occupation",
      "name": cvDocument.headline,
      "description": collapseWhitespace(data.headline.lines.join(" ")),
      "skills": cvDocument.skills.flatMap((line) => line.names).join(", "),
    },
    "makesOffer": data.serviceGroups.flatMap((group) => group.services).map((service) => ({
      "@type": "Offer",
      "itemOffered": { "@type": "Service", "name": service.title, "description": collapseWhitespace(service.description), "provider": me },
    })),
    // Profiles of the same person only: the first GitHub account is my own, the rest belong to my companies.
    "sameAs": [
      SOCIAL_URLS.linkedIn(socialMedia.byUsername.linkedIn),
      ...data.github.slice(0, 1).map((account) => account.link),
      SOCIAL_URLS.twitter(socialMedia.byUsername.twitter),
      SOCIAL_URLS.instagram(socialMedia.byUsername.instagram),
      SOCIAL_URLS.facebook(socialMedia.byUsername.facebook),
    ],
  };

  const website: WebSite = {
    "@type": "WebSite",
    "@id": ids.website,
    "url": `${root}/`,
    "name": details.name,
    "description": seo.description,
    "inLanguage": "en",
    "author": me,
    "publisher": me,
  };

  if (page === "resume") {
    const resume: ProfilePage = {
      "@type": "ProfilePage",
      "@id": ids.resume,
      "url": at("/resume/"),
      "name": `${details.name}, CV`,
      "inLanguage": "en",
      "isPartOf": { "@id": ids.website },
      "mainEntity": me,
      "associatedMedia": [
        { "@type": "MediaObject", "name": "CV", "contentUrl": at(data.cv), "encodingFormat": "application/pdf" },
        { "@type": "MediaObject", "name": data.fullResume.label, "contentUrl": at(data.fullResume.url), "encodingFormat": "application/pdf" },
      ],
    };

    return { "@context": "https://schema.org", "@graph": [website, person, resume] };
  }

  const home: ProfilePage = {
    "@type": "ProfilePage",
    "@id": ids.home,
    "url": `${root}/`,
    "name": seo.defaultTitle,
    "description": seo.description,
    "inLanguage": "en",
    "isPartOf": { "@id": ids.website },
    "about": me,
    "mainEntity": me,
    "breadcrumb": { "@id": ids.breadcrumb },
    "primaryImageOfPage": { "@type": "ImageObject", "url": at(seo.socialCard.path), "width": `${seo.socialCard.width}`, "height": `${seo.socialCard.height}` },
  };

  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": ids.breadcrumb,
    "itemListElement": JOURNEY_STOPS.map(({ key, href }, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": data.menu.stops[key],
      "item": `${root}/${href}`,
    })),
  };

  const faq: FAQPage = {
    "@type": "FAQPage",
    "@id": ids.faq,
    "url": `${root}/`,
    "isPartOf": { "@id": ids.website },
    "about": me,
    "mainEntity": seo.faq.map((entry) => ({
      "@type": "Question",
      "name": entry.question,
      "acceptedAnswer": { "@type": "Answer", "text": collapseWhitespace(entry.answer) },
    })),
  };

  const projects: CreativeWork[] = data.projects.map((project) => ({
    "@type": "CreativeWork",
    "name": project.title,
    "description": collapseWhitespace(project.intro),
    "url": `${root}/#${SECTION_IDS.projects}`,
    "image": at(jpg(project.image ?? data.cover)),
    "dateCreated": toIsoMonth(project.from),
    "keywords": [project.category, ...project.techStack].join(", "),
    "creator": me,
  }));

  return { "@context": "https://schema.org", "@graph": [website, person, home, breadcrumb, faq, ...projects] };
};

// The graph as a script body: "<" is escaped so no string in the content can close the script tag early.
export const serializeStructuredData = (graph: Graph): string => JSON.stringify(graph).replace(/</g, "\\u003c");
