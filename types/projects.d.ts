import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

// The kind of region a project is on the world map, which sets its colour and its filter.
export type ProjectKind = "game" | "web3" | "product" | "community" | "archive";

export type ProjectStatus = "live" | "ongoing" | "archived" | "openSource" | "private";

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
  };
}
