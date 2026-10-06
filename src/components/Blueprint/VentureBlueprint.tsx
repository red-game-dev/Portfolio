import { FC, useCallback } from "react";

import dynamic from "next/dynamic";

import useLoaded from "@/components/Blueprint/hooks/useLoaded";
import { loadVentureBlueprint } from "@/data/blueprints";
import { VentureBlueprintId } from "@/data/blueprints/ventures";
import { BlueprintLabels } from "@/types/blueprints";

interface VentureBlueprintProps {
  id: VentureBlueprintId;
  labels: BlueprintLabels;
}

const loadFigure = () => import("@/components/Blueprint/Blueprint");

const Blueprint = dynamic(() => loadFigure().then((module) => module.Blueprint), { ssr: false });

// A venture's drawing inside its map dialog, fetched when the dialog opens. Mount it with a key per venture
// so travelling to the next region starts a fresh load.
export const VentureBlueprint: FC<VentureBlueprintProps> = ({ id, labels }: VentureBlueprintProps) => {
  const load = useCallback(() => Promise.all([loadVentureBlueprint(id), loadFigure()]).then(([blueprint]) => blueprint), [id]);
  const loaded = useLoaded(load, true);

  return loaded.status === "ready" ? <Blueprint {...loaded.value} labels={labels} isBleed={false} /> : null;
};
