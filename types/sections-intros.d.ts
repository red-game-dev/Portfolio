import { Lens } from "@/config/lenses";

export interface SectionIntros {
  title: string;
  description: string[];
  // The same section introduced for another reader. Titles never change, so the menu and the trail
  // always name a section the same way.
  lenses?: Partial<Record<Lens, string[]>>;
}
