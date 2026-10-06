import { FC } from "react";

import dynamic from "next/dynamic";

import type { GlanceProps } from "@/components/Glance/GlanceSheet";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";

const GlanceSheet = dynamic(() => import("@/components/Glance/GlanceSheet").then((module) => module.GlanceSheet), { ssr: false });

// The view's own first panel, right after the cover: a fact sheet for recruiters, a product playbook for
// product readers. Engineers, the view the page is built in, go straight into the full page and never
// download it.
export const Glance: FC<GlanceProps> = (props: GlanceProps) => {
  const { lens } = useLensStateHook();

  return lens === "engineer" ? null : <GlanceSheet lens={lens} {...props} />;
};
