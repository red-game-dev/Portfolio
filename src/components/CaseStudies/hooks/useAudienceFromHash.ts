import { useCallback, useEffect, useState } from "react";

import { AUDIENCE_ANCHORS } from "@/config/sections";
import { Audience } from "@/types/case-studies";

const audienceForHash = (hash: string): Audience | null => {
  const anchor = hash.replace(/^#/, "");
  const match = (Object.keys(AUDIENCE_ANCHORS) as Audience[]).find((audience) => AUDIENCE_ANCHORS[audience] === anchor);

  return match ?? null;
};

// The selected audience lives in the URL hash (#for-payments and so on), so a filtered view can be linked
// from an application. Read after mount, so the server and the first client render both show everything.
export const useAudienceFromHash = () => {
  const [audience, setAudienceState] = useState<Audience | null>(null);

  useEffect(() => {
    const sync = () => setAudienceState(audienceForHash(window.location.hash));

    sync();
    window.addEventListener("hashchange", sync);

    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const setAudience = useCallback((next: Audience | null) => {
    setAudienceState(next);
    window.history.replaceState(null, "", next ? `#${AUDIENCE_ANCHORS[next]}` : window.location.pathname);
  }, []);

  return [audience, setAudience] as const;
};
