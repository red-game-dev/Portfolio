import { ZoneId } from "@/config/zones";

// Where a box sits on wide screens, in grid lines. Narrow screens stack everything in reading order.
export interface BlueprintPlacement {
  col: number;
  row: number;
  colSpan?: number;
  rowSpan?: number;
}

export type BlueprintNodeKind = "service" | "store" | "actor" | "decision" | "note";

export interface BlueprintNode {
  id: string;
  label: string;
  detail?: string;
  kind?: BlueprintNodeKind;
  // Columns this node takes inside its group.
  span?: number;
}

export interface BlueprintGroup {
  id: string;
  // A group without a label is just a place for loose nodes, drawn without a frame.
  label?: string;
  nodes: BlueprintNode[];
  // Columns inside the group on wide screens. Narrow screens use at most two.
  columns?: number;
  place: BlueprintPlacement;
  // Outside the system being shown, such as a legacy system or a third party: a dashed frame.
  isExternal?: boolean;
}

export interface BlueprintEdge {
  // A node id or a group id.
  from: string;
  to: string;
  label?: string;
  // "link" is an association without a direction.
  style?: "flow" | "dashed" | "link";
  isTwoWay?: boolean;
}

export interface ArchitectureBlueprint {
  // Grid columns on wide screens.
  columns: number;
  groups: BlueprintGroup[];
  edges: BlueprintEdge[];
}

export type WireframeRegionKind = "bar" | "media" | "list" | "canvas" | "form" | "actions" | "card" | "overlay" | "stat" | "steps";

export type WireframeArea = "header" | "left" | "main" | "right" | "footer";

export interface WireframeRegion {
  kind: WireframeRegionKind;
  label: string;
  // Relative height inside the screen.
  size?: number;
  // Desktop screens with areas are laid out as an editor: header, three columns, footer.
  area?: WireframeArea;
}

export interface WireframeScreen {
  title: string;
  regions: WireframeRegion[];
}

export interface Wireframe {
  device: "phone" | "desktop";
  // More than one screen is a flow, read left to right.
  screens: WireframeScreen[];
  decision: string;
  outcome: string;
}

export interface Blueprint {
  id: string;
  // The world the drawing borrows its look from.
  zone: ZoneId;
  title: string;
  caption: string;
  architecture: ArchitectureBlueprint;
  wireframe?: Wireframe;
}

export interface BlueprintLabels {
  architecture: string;
  productFlow: string;
  decision: string;
  outcome: string;
}

export interface BlueprintContent {
  labels: BlueprintLabels;
  // Keyed by the section they appear in.
  ai: Blueprint[];
  chain: Blueprint[];
  platform: Blueprint[];
  casino: Blueprint[];
  mmo: Blueprint[];
}
