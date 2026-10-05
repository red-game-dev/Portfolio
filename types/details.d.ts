// Stage names shown on the portrait while it materialises.
export interface PortraitLabels {
  decoding: string;
  upscaling: string;
  enhancing: string;
}

export interface Detail {
  intro: string;
  description: string;
  residence: string;
  jobType: string;
  phone: string;
  email: string;
  image: string;
  name: string;
  location: string;
  isFlexible: boolean;
  contactTime: string;
  portrait: PortraitLabels;
}
