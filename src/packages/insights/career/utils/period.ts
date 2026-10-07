import { fill } from "@/packages/text/format";

export interface Dated {
  from: string;
  to?: string;
  // Written out by hand where the dates alone would mislead, such as "On and off since 2018".
  period?: string;
}

// When something ran, as `template` words it ("{from} to {to}"), ending in `present` while it still runs.
export const formatPeriod = ({ from, to, period }: Dated, template: string, present: string) => period ?? fill(template, { from, to: to ?? present });

// The year something began, from "Apr 2015" or "2021"; 0 when it names none.
export const startYear = (from: string) => Number(from.match(/\d{4}/)?.[0] ?? 0);
