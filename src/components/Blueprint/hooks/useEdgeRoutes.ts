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
        const origin = container.getBoundingClientRect();
        const boxes = new Map<string, Box>();

        container.querySelectorAll<HTMLElement>("[data-bp-id]").forEach((element) => {
          const rect = element.getBoundingClientRect();

          boxes.set(element.dataset.bpId ?? "", {
            left: rect.left - origin.left,
            top: rect.top - origin.top,
            right: rect.right - origin.left,
            bottom: rect.bottom - origin.top,
          });
        });

        const placed = edges.flatMap((edge, index) => {
          const from = boxes.get(edge.from);
          const to = boxes.get(edge.to);
          const route = from && to ? routeBetween(from, to) : null;

          return route ? [{ key: `${edge.from}-${edge.to}-${index}`, edge, route }] : [];
        });

        setLayout({ width: origin.width, height: origin.height, edges: placed });
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
