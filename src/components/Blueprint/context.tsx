import { createContext, ReactNode, useContext } from "react";

import { BlueprintLabels } from "@/types/blueprints";

const BlueprintLabelsContext = createContext<BlueprintLabels | null>(null);

// The words every blueprint uses (its tabs, the zoom controls, the glance note), given once by the page
// rather than passed through each section that happens to hold a drawing.
export const BlueprintLabelsProvider = ({ labels, children }: { labels: BlueprintLabels; children: ReactNode }) => (
  <BlueprintLabelsContext.Provider value={labels}>{children}</BlueprintLabelsContext.Provider>
);

export const useBlueprintLabels = (): BlueprintLabels => {
  const labels = useContext(BlueprintLabelsContext);

  if (!labels) {
    throw new Error("useBlueprintLabels must be used within a BlueprintLabelsProvider");
  }

  return labels;
};
