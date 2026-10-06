import { RefObject, useEffect, useState } from "react";

import { Box, Route, routeBetween } from "@/components/Blueprint/utils/route";
import { BlueprintEdge } from "@/types/blueprints";

export interface PlacedEdge {
  key: string;
  edge: BlueprintEdge;
  route: Route;
}

interface EdgeLayout {
  width: number;
  height: number;
  edges: PlacedEdge[];
}

const EMPTY: EdgeLayout = { width: 0, height: 0, edges: [] };

// Where a box sits inside the drawing, from layout offsets rather than bounding rects. Offsets ignore CSS
// transforms, so a tab switch that flips or scales the drawing while it lands does not bake the tilt into
// the wires. Each positioned frame on the way up adds its own offset and border.
const boxWithin = (element: HTMLElement, container: HTMLElement): Box | null => {
  let left = element.offsetLeft;
  let top = element.offsetTop;
  let parent = element.offsetParent as HTMLElement | null;

  while (parent && parent !== container) {
    left += parent.offsetLeft + parent.clientLeft;
    top += parent.offsetTop + parent.clientTop;
    parent = parent.offsetParent as HTMLElement | null;
  }

  if (parent !== container) {
    return null;
  }

  return { left, top, right: left + element.offsetWidth, bottom: top + element.offsetHeight };
};

// Connectors are drawn from where the boxes actually landed, so the grid can reflow at any width and the
// lines follow. Measured once a frame at most, and only while the drawing is shown.
export const useEdgeRoutes = (containerRef: RefObject<HTMLElement>, edges: BlueprintEdge[], isShown: boolean): EdgeLayout => {
  const [layout, setLayout] = useState<EdgeLayout>(EMPTY);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !isShown) {
      return;
    }

    let frame = 0;

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const boxes = new Map<string, Box>();

        container.querySelectorAll<HTMLElement>("[data-bp-id]").forEach((element) => {
          const box = boxWithin(element, container);

          if (box) {
            boxes.set(element.dataset.bpId ?? "", box);
          }
        });

        const placed = edges.flatMap((edge, index) => {
          const from = boxes.get(edge.from);
          const to = boxes.get(edge.to);
          const route = from && to ? routeBetween(from, to) : null;

          return route ? [{ key: `${edge.from}-${edge.to}-${index}`, edge, route }] : [];
        });

        setLayout({ width: container.clientWidth, height: container.clientHeight, edges: placed });
      });
    };

    const observer = new ResizeObserver(measure);

    observer.observe(container);
    measure();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [containerRef, edges, isShown]);

  return layout;
};
