import { useEffect, useMemo, useState } from "react";

import { NextSeo } from "next-seo";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { LAB_MOMENTS } from "@/components/Finale/Voyage/lab/moments";
import type { LabMoment } from "@/components/Finale/Voyage/lab/moments";
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
    const source = useMemo(() => labVoyage(moment, LONGEST_CHAPTER), [moment]);

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

// Every moment the lab can hold (the dialog's code, with the list, loads only with the lab dialog).


// The chapter of the story whose decoded line is longest, for the largest card the line's place shows.
const LONGEST_CHAPTER = Object.entries(portfolioData.finale.voyage.career.story.chapters)
  .reduce((longest, entry) => (entry[1].line.length > longest[1].line.length ? entry : longest))[0];
const LAYOUTS = ["auto", "compact", "full"] as const;

// The voyage's HUD held still with every panel it can show at once, for a browser to measure at every screen size and
// fail on any two that overlap (e2e/hud.spec.ts). `?moment=` picks what is shown (flight, descent, or one of the things
// that lie over the HUD: ready, paused, over, perk, hangar, station, photo, map), `?hud=auto|compact|full`
// the HUD's layout (setting this browser's voyage-hud setting, as the hangar would, only when it is given). Kept out of
// search, and linked from nowhere.
export default function HudLab() {
  const { query, isReady } = useRouter();
  const { set } = usePreferencesStateHook();
  const [isSet, setIsSet] = useState(false);
  const moment = LAB_MOMENTS.find((name) => name === query.moment) ?? "flight";
  const layout = LAYOUTS.find((name) => name === query.hud) ?? null;

  useEffect(() => {
    if (isReady) {
      if (layout) {
        set("voyage-hud", layout);
      }

      setIsSet(true);
    }
  }, [isReady, layout, set]);

  return (
    <>
      <NextSeo title="HUD lab" noindex nofollow />
      {isSet && <LabDialog key={`${moment}-${layout ?? "kept"}`} moment={moment} />}
    </>
  );
}
