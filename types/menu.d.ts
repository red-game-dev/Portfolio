import { StopKey } from "@/config/journey";
import { ZoneId } from "@/config/zones";

// The words of the navigation: the journey across the top and the mobile menu.
export interface MenuContent {
  label: string;
  // The name of each stop of the journey.
  stops: Record<StopKey, string>;
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
