import { StopKey, StopPartKey } from "@/config/journey";
import { ZoneId } from "@/config/zones";

// The words of the navigation: the journey across the top and the mobile menu.
export interface MenuContent {
  label: string;
  // The name of each stop of the journey.
  stops: Record<StopKey, string>;
  // The sections a long stop links to by name.
  parts: Record<StopPartKey, string>;
  // Names the list of a stop's parts: "{stop}" is replaced.
  partsLabel: string;
  // The first link on the page, for keyboards: straight past the header to the content.
  skip: string;
  title: string;
  // Above the title: "{n}", "{total}" and "{zone}" are replaced.
  kicker: string;
  open: string;
  close: string;
  // Beside the stop the reader is at.
  here: string;
  zones: Record<ZoneId, string>;
  cv: string;
  email: string;
  linkedIn: string;
}
