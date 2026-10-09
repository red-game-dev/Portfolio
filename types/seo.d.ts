export interface SeoQuestion {
  question: string;
  answer: string;
}

export interface SeoLink {
  label: string;
  // A path on this site, joined to the host when the page is built.
  path: string;
  note: string;
}

// What search engines, link previews and AI crawlers read about the site (src/data/seo.ts).
export interface SeoDetails {
  // The home page's title, and the template every other page's title fills.
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  // /resume/, the short CV as a page: its own title, printed into the PDF's name, and description.
  resume: { title: string; description: string };
  // The picture shown when the site is shared: a 1200 by 630 card printed from /social-card/.
  socialCard: { path: string; width: number; height: number; alt: string };
  // What recruiters and hiring managers ask, answered from the page's own words for search and AI answer engines.
  faq: SeoQuestion[];
  // /llms.txt: the site in brief for language models, with the pages worth reading in full.
  llms: { pagesLabel: string; contactLabel: string; links: SeoLink[] };
}
