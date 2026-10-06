import { ArchitectureBlueprint } from "@/types/blueprints";

// The narrowest a box can be and still fit a label of a few words without breaking inside one.
export const MIN_BOX_WIDTH = 190;

// Width the drawing needs before its frames can sit side by side. A frame that packs several boxes into
// one grid column needs that column wider in proportion, so the densest frame sets the pace.
export const minWideWidth = ({ columns, groups }: ArchitectureBlueprint) => {
  const density = Math.max(1, ...groups.map((group) => (group.columns ?? 1) / (group.place.colSpan ?? 1)));

  return columns * density * MIN_BOX_WIDTH;
};
