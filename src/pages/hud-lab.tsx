import { useEffect, useMemo, useState } from "react";

import { NextSeo } from "next-seo";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import type { LabMoment } from "@/components/Finale/Voyage/lab/useLabVoyage";
import { usePreferencesStateHook } from "@/components/Preferences/hooks/usePreferencesStateHook";
import { CROSSED_ZONES } from "@/config/zones";
import { portfolioData } from "@/data/resume";

// The dialog and the lab's still life load only here, as the voyage itself loads only once it is opened.
const LabDialog = dynamic(async () => {
  const [{ VoyageDialog }, { labVoyage }] = await Promise.all([
    import("@/components/Finale/Voyage/VoyageDialog"),
    import("@/components/Finale/Voyage/lab/useLabVoyage"),
  ]);
  const LabVoyageDialog = ({ moment }: { moment: LabMoment }) => {
    // One source for the dialog's whole life: a new moment is a new dialog.
    const source = useMemo(() => labVoyage(moment), [moment]);

    return (
      <VoyageDialog
        content={portfolioData.finale.voyage}
        universes={CROSSED_ZONES.map((zone) => portfolioData.journeyTrail.zones[zone])}
        best={0}
        home={null}
        settings={portfolioData.preferences}
        onRecord={() => undefined}
        onClose={() => undefined}
        source={source}
      />
    );
  };

  return LabVoyageDialog;
}, { ssr: false });

const MOMENTS: readonly LabMoment[] = ["flight", "descent"];
const LAYOUTS = ["auto", "compact", "full"] as const;

// The voyage's HUD held still with every panel it can show at once, for a browser to measure at every screen size and
// fail on any two that overlap (e2e/hud.spec.ts). `?moment=flight|descent` picks what is shown, `?hud=auto|compact|full`
// the HUD's layout (it sets this browser's voyage-hud setting, as the hangar would). Kept out of search, and linked from
// nowhere.
export default function HudLab() {
  const { query, isReady } = useRouter();
  const { set } = usePreferencesStateHook();
  const [isSet, setIsSet] = useState(false);
  const moment = MOMENTS.find((name) => name === query.moment) ?? "flight";
  const layout = LAYOUTS.find((name) => name === query.hud) ?? "auto";

  useEffect(() => {
    if (isReady) {
      set("voyage-hud", layout);
      setIsSet(true);
    }
  }, [isReady, layout, set]);

  return (
    <>
      <NextSeo title="HUD lab" noindex nofollow />
      {isSet && <LabDialog key={`${moment}-${layout}`} moment={moment} />}
    </>
  );
}
