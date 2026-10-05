import { useCallback, useEffect, useState } from "react";

import { industryAnchor, industryFromHash } from "@/config/sections";
import { Industry } from "@/types/industry";

// The industry filter lives in the URL hash (#industry-fintech), so the first screen's chips, My History
// and the boss fights share one state and a filtered view can be linked. Read after mount, so the server
// and the first client render both show everything.
export default function useIndustryFromHash(industries: Industry[]) {
  const [industry, setIndustryState] = useState<Industry | null>(null);

  useEffect(() => {
    const sync = () => setIndustryState(industryFromHash(window.location.hash, industries));

    sync();
    window.addEventListener("hashchange", sync);

    return () => window.removeEventListener("hashchange", sync);
  }, [industries]);

  const setIndustry = useCallback((next: Industry | null) => {
    setIndustryState(next);
    window.history.replaceState(null, "", next ? `#${industryAnchor(next)}` : window.location.pathname);
    // replaceState fires no event, so the other sections listening to the hash are told directly.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);

  return [industry, setIndustry] as const;
}
