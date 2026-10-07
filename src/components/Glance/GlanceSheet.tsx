import { FC } from "react";

import { ProductPlaybook } from "@/components/Glance/ProductPlaybook";
import { RecruiterGlance } from "@/components/Glance/RecruiterGlance";
import { GlanceProps } from "@/components/Glance/types";
import { Section } from "@/components/Section";
import { Lens } from "@/config/lenses";
import { SECTION_IDS } from "@/config/sections";

interface GlanceSheetProps extends GlanceProps {
  lens: Exclude<Lens, "engineer">;
}

// The fact sheet for recruiters or the product playbook for product readers, loaded only for those views.
export const GlanceSheet: FC<GlanceSheetProps> = ({ lens, content, ...rest }: GlanceSheetProps) => (
  <Section id={SECTION_IDS.glance}>
    {lens === "recruiter" ? <RecruiterGlance content={content.recruiter} {...rest} /> : <ProductPlaybook content={content.product} {...rest} />}
  </Section>
);
