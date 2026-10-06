import { FC } from "react";

import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Text } from "@/components/Text";
import { SectionIntros } from "@/types/sections-intros";

interface SectionTextProps {
  intro: Pick<SectionIntros, "title" | "description" | "lenses">;
}

// A section's title and introduction, in the words for whoever is reading.
export const SectionText: FC<SectionTextProps> = ({ intro }: SectionTextProps) => {
  const { lens } = useLensStateHook();

  return <Text title={intro.title} paragraphs={intro.lenses?.[lens] ?? intro.description} isSection={false} />;
};
