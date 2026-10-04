import { ZoneId } from "@/config/zones";

export interface ZoneLabel {
  zone: ZoneId;
  title: string;
}

export interface Journey {
  // Prefix for the banner's counter, for example "Zone".
  zoneLabel: string;
  zones: ZoneLabel[];
}
