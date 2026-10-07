import { FC, useCallback } from "react";

import dynamic from "next/dynamic";

import { useBlueprintLabels } from "@/components/Blueprint/context";
import { loadVentureBlueprint } from "@/data/blueprints";
import useLoaded from "@/hooks/useLoaded";
import { VentureBlueprintId } from "@/types/blueprints";

interface VentureBlueprintProps {
  id: VentureBlueprintId;
}

const loadFigure = () => import("@/components/Blueprint/Blueprint");

const Blueprint = dynamic(() => loadFigure().then((module) => module.Blueprint), { ssr: false });

// A venture's drawing inside its map dialog, fetched when the dialog opens. Mount it with a key per venture
// so travelling to the next region starts a fresh load.
export const VentureBlueprint: FC<VentureBlueprintProps> = ({ id }: VentureBlueprintProps) => {
  const labels = useBlueprintLabels();
  const load = useCallback(() => Promise.all([loadVentureBlueprint(id), loadFigure()]).then(([blueprint]) => blueprint), [id]);
  const loaded = useLoaded(load, true, "A blueprint");

  return loaded.status === "ready" ? <Blueprint {...loaded.value} labels={labels} isBleed={false} /> : null;
};
