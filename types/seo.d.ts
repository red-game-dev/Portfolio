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
  // The picture shown when the site is shared, a 1200 by 630 card the site draws from its content (path), and the film
  // of the journey recorded from /social-card/ beside it (video).
  // The still every platform shows, and the looping film of the journey it is the last frame of.
  socialCard: { path: string; video: string; width: number; height: number; alt: string };
  // What recruiters and hiring managers ask, answered from the page's own words for search and AI answer engines.
  faq: SeoQuestion[];
  // /llms.txt: the site in brief for language models, with the pages worth reading in full.
  llms: { pagesLabel: string; contactLabel: string; links: SeoLink[] };
}
