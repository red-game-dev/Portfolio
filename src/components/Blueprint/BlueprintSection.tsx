import { FC, useCallback, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import dynamic from "next/dynamic";

import { NEAR_MARGIN, PLACEHOLDER_HEIGHT } from "@/components/Blueprint/config";
import { useBlueprintLabels } from "@/components/Blueprint/context";
import { loadSectionBlueprints } from "@/data/blueprints";
import useInView from "@/hooks/useInView";
import useLoaded from "@/hooks/useLoaded";
import { BlueprintSection as Section } from "@/types/blueprints";

interface BlueprintSectionProps {
  section: Section;
}

const loadList = () => import("@/components/Blueprint/BlueprintList");

const BlueprintList = dynamic(() => loadList().then((module) => module.BlueprintList), { ssr: false });

const Slot = styled.div(({ isWaiting }: { isWaiting: boolean }) => [
  tw`relative`,
  isWaiting && css`
    min-height: ${PLACEHOLDER_HEIGHT}px;
  `,
]);

// A section's drawings, fetched with the code that draws them once the section comes within a screen of
// view. Until then the page carries neither, so a visit that never scrolls this far never pays for them.
export const BlueprintSection: FC<BlueprintSectionProps> = ({ section }: BlueprintSectionProps) => {
  const labels = useBlueprintLabels();
  const slotRef = useRef<HTMLDivElement>(null);
  const isNear = useInView(slotRef, { once: true, threshold: 0, rootMargin: NEAR_MARGIN });
  // The data and the drawing code are requested together, so neither waits on the other.
  const load = useCallback(() => Promise.all([loadSectionBlueprints(section), loadList()]).then(([blueprints]) => blueprints), [section]);
  const loaded = useLoaded(load, isNear, "A blueprint");

  return (
    <Slot ref={slotRef} isWaiting={loaded.status === "waiting"}>
      {loaded.status === "ready" && <BlueprintList blueprints={loaded.value} labels={labels} />}
    </Slot>
  );
};
