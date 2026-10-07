import { ForgeStation } from "@/services/skills";
import { Detail } from "@/types/details";
import { Headline } from "@/types/headline";
import { LensContent } from "@/types/lens";
import { Resume } from "@/types/resume";
import { Roster } from "@/types/roster";

// What both glance views are given: the reader's own content and the page's data to back it.
export interface GlanceProps {
  content: LensContent["glance"];
  details: Detail;
  headline: Headline;
  experience: Resume[];
  roster: Roster;
  stations: ForgeStation[];
  cvUrl: string;
}
