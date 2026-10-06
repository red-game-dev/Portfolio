import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

import { Blueprint } from "@/types/blueprints";

// The kind of region a project is on the world map, which sets its colour and its filter.
export type ProjectKind = "game" | "web3" | "product" | "community" | "archive";

export type ProjectStatus = "live" | "ongoing" | "archived" | "openSource" | "private";

// A figure on a venture's dialog, in the measure it was counted in.
export interface ProjectStat {
  value: string;
  label: string;
}

// A real screenshot, as a .webp with a .jpg sibling for the fallback.
export interface ProjectScreen {
  image: string;
  caption: string;
  alt: string;
}

// The deeper look a venture of my own gets: its numbers, how it was built and what users moved through.
export interface ProjectDeepDive {
  stats?: ProjectStat[];
  screens?: ProjectScreen[];
  // In my own words, for example why it did not grow further.
  note?: string;
  blueprint: Blueprint;
}

export interface ProjectDetail {
  // False for catch all entries spanning many unrelated projects, which would inflate skill years.
  countsForSkills?: boolean;
  icon: FontAwesomeIconProps["icon"];
  kind: ProjectKind;
  status: ProjectStatus;
  // A screenshot or cover. Without one the map draws the region's own terrain.
  image?: string;
  title: string;
  category: string;
  intro: string;
  // What was done there, as quest objectives. Short, factual lines.
  responsibilities: string[];
  techStack: string[];
  link?: string;
  repo?: string;
  deepDive?: ProjectDeepDive;
  // Shown in place of the dates for a project kept undated on purpose; from then only orders the map.
  period?: string;
  from: string;
  to?: string;
}

export interface ProjectMapContent {
  kinds: Record<ProjectKind, string>;
  statuses: Record<ProjectStatus, string>;
  labels: {
    filter: string;
    all: string;
    questLog: string;
    loot: string;
    visit: string;
    code: string;
    previous: string;
    next: string;
    close: string;
    period: string;
    present: string;
    regions: string;
    hint: string;
    deepDive: string;
    screens: string;
    screenPrevious: string;
    screenNext: string;
    // "{index}" and "{count}" are replaced.
    screenPosition: string;
    // The year badge on the map for an undated region.
    undated: string;
  };
}
