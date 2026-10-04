import { Audience } from "@/types/case-studies";

export interface AudienceLink {
  audience: Audience;
  label: string;
}

// The first screen: what I do, what I am looking for, availability, and the two actions that matter.
export interface Headline {
  lines: string[];
  availability: string;
  cvLabel: string;
  emailLabel: string;
  audiencesLabel: string;
  audiences: AudienceLink[];
}
