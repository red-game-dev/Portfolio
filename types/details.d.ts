// Stage names shown on the portrait while it materialises.
export interface PortraitLabels {
  decoding: string;
  upscaling: string;
  enhancing: string;
}

// A verified figure in the "Who I am" proof row.
export interface DetailFigure {
  value: string;
  label: string;
}

export interface Detail {
  name: string;
  // A short tag above the hook.
  intro: string;
  // The opening line, shown large.
  hook: string;
  paragraphs: string[];
  proof: DetailFigure[];
  facts: string[];
  location: string;
  jobType: string;
  phone: string;
  email: string;
  contactTime: string;
  image: string;
  portrait: PortraitLabels;
}
