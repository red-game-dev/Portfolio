import { Audience } from "@/types/case-studies";
import { Industry } from "@/types/industry";

export interface AudienceLink {
  audience: Audience;
  label: string;
}

// A role I can be hired for, linked to the part of the page that proves it.
export interface RoleLink {
  label: string;
  // An element id, used as the link's hash.
  target: string;
}

export interface IndustryLink {
  industry: Industry;
  label: string;
}

// The first screen: what I do, what I am looking for, availability, and the two actions that matter.
export interface Headline {
  lines: string[];
  availability: string;
  cvLabel: string;
  emailLabel: string;
  audiencesLabel: string;
  // The case study filters, a subset of the roles.
  audiences: AudienceLink[];
  roles: RoleLink[];
  industriesLabel: string;
  industries: IndustryLink[];
}
